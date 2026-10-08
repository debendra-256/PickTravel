import { dbFactory } from "../dal/DBFactory";
import { APP_CONFIG } from "../config/app.config";
import { OfferBannerBAL } from "./OfferBannerBAL";

export class BookingBAL {
  static calculateFare(tripType, details, car) {
    if (!car) return 1500; // Base default

    const hourly = car.hourlyPrice || 300;
    const kmRate = car.perKmPrice || 15;

    switch (tripType) {
      case "Local Trip":
        {
          const localPackages = {
            "4 Hrs / 40 Kms": { rate: car.fourHours40Km, fallback: hourly * 4 },
            "8 Hrs / 80 Kms": { rate: car.eightHours80Km, fallback: hourly * 8 },
            "10 Hrs / 100 Kms": { rate: car.tenHours100Km, fallback: hourly * 10 }
          };
          const selectedPackage = localPackages[details.packageType];
          if (!selectedPackage) return hourly * 8;
          const rate = selectedPackage.rate;
          return rate !== null && rate !== undefined && rate !== "" && Number.isFinite(Number(rate))
            ? Number(rate)
            : selectedPackage.fallback;
        }

      case "One Way":
        const approxKmOneWay = details.approxKm || 120;
        return Math.round(approxKmOneWay * kmRate + 300); // Toll + Base

      case "Round Trip":
        const days = details.days || 2;
        const approxKmRound = details.approxKm || 300;
        return Math.round(approxKmRound * kmRate + days * 500); // Driver allowance

      case "Taxi Packages":
        if (details.packageName?.includes("Puri")) return hourly * 9;
        if (details.packageName?.includes("Chilika")) return hourly * 11;
        if (details.packageName?.includes("Triangle")) return hourly * 14;
        return hourly * 8;

      case "Airport Transfer":
        return Math.max(750, Math.round(hourly * 2.5 + 200));

      default:
        return hourly * 8;
    }
  }

  static async createBooking(bookingData) {
    const {
      tripType,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropLocation,
      pickupDate,
      pickupTime,
      returnDate,
      packageType,
      packageName,
      selectedCarId,
      selectedCarName
    } = bookingData;

    // Validation
    if (!customerName || !customerPhone) {
      return { success: false, message: "Customer Name and Contact Phone Number are required." };
    }

    if (!pickupLocation || !pickupDate) {
      return { success: false, message: "Pickup Location and Date are required." };
    }

    const driver = dbFactory.getDriver();
    const cars = driver.findAll("Cars");
    const carObj = cars.find((c) => String(c.id) === String(selectedCarId)) || cars.find((c) => c.name === selectedCarName) || cars[0];

    const baseFare = this.calculateFare(tripType, bookingData, carObj);
    const normalizedPromoCode = String(bookingData.promoCode || "").trim().toUpperCase();
    const festiveOffer = OfferBannerBAL.getOfferBanner();
    const festiveCode = String(festiveOffer.code || "").trim();
    const hasFestiveCoupon = festiveOffer.enabled
      && festiveCode
      && Number(festiveOffer.amount) > 0
      && normalizedPromoCode === festiveCode.toUpperCase();
    const appliedCoupon = hasFestiveCoupon
      ? festiveCode
      : normalizedPromoCode === APP_CONFIG.COUPON_CODE.toUpperCase() ? APP_CONFIG.COUPON_CODE : "";
    const appliedDiscount = hasFestiveCoupon ? Number(festiveOffer.amount) : APP_CONFIG.COUPON_DISCOUNT;
    const discountAmount = appliedCoupon ? Math.min(appliedDiscount, baseFare) : 0;
    const estimatedFare = Math.max(0, baseFare - discountAmount);

    const newBooking = {
      id: `BK-${Date.now().toString().slice(-6)}`,
      tripType: tripType || "Local Trip",
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : "N/A",
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation ? dropLocation.trim() : "N/A",
      pickupDate: pickupDate,
      pickupTime: pickupTime || "09:00 AM",
      returnDate: returnDate || "N/A",
      packageType: packageType || "N/A",
      packageName: packageName || "N/A",
      selectedCar: carObj ? carObj.name : selectedCarName || "Standard Vehicle",
      seater: carObj ? carObj.seater : 4,
      baseFare,
      discountAmount,
      promoCode: appliedCoupon || "N/A",
      estimatedFare: estimatedFare,
      status: "Confirmed",
      paymentStatus: "Pending",
      createdAt: new Date().toLocaleString()
    };

    let inserted;
    try { inserted = await driver.insert("Bookings", newBooking); }
    catch (error) { return { success: false, message: error.message || "Failed to save booking." }; }

    if (inserted) {
      return {
        success: true,
        booking: inserted,
        message: `Booking #${inserted.id} confirmed successfully! Estimated Fare: ₹${estimatedFare}`
      };
    }

    return { success: false, message: "Failed to save booking to database." };
  }

  static getBookings() {
    const driver = dbFactory.getDriver();
    return driver.findAll("Bookings");
  }

  static async updateBookingStatus(bookingId, newStatus) {
    const driver = dbFactory.getDriver();
    let updated;
    try { updated = await driver.update("Bookings", bookingId, { status: newStatus }); }
    catch (error) { return { success: false, message: error.message || "Failed to update booking." }; }
    if (updated) {
      return { success: true, message: `Booking #${bookingId} status updated to '${newStatus}'.` };
    }
    return { success: false, message: "Failed to update booking status." };
  }

  static async confirmBookingWithDriver(bookingId, driverDetails) {
    const driver = dbFactory.getDriver();
    const updateData = {
      status: "Confirmed",
      driverName: driverDetails.driverName?.trim() || "Assigned Driver",
      driverPhone: driverDetails.driverPhone?.trim() || "N/A"
    };
    if (driverDetails.estimatedFare !== undefined && driverDetails.estimatedFare !== "") {
      updateData.estimatedFare = Number(driverDetails.estimatedFare) || driverDetails.estimatedFare;
    }
    let updated;
    try { updated = await driver.update("Bookings", bookingId, updateData); }
    catch (error) { return { success: false, message: error.message || "Failed to update driver details." }; }
    if (updated) {
      return {
        success: true,
        booking: updated,
        message: `Booking #${bookingId} confirmed with Driver: ${updateData.driverName} (${updateData.driverPhone})`
      };
    }
    return { success: false, message: "Failed to update booking with driver details." };
  }

  static async cancelBooking(bookingId) {
    return this.updateBookingStatus(bookingId, "Cancelled");
  }
}
