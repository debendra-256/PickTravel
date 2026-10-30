import React, { useState, useEffect } from "react";
import { BookingBAL } from "../bal/BookingBAL";
import { FleetBAL } from "../bal/FleetBAL";
import { OfferBannerBAL } from "../bal/OfferBannerBAL";
import { APP_CONFIG } from "../config/app.config";
import { DATABASE_UPDATED_EVENT } from "../dal/drivers/PostgresDriver";
import { assetUrl } from "../config/assetUrl";
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  BedDouble,
  Palmtree,
  CheckCircle2,
  Package,
  Plane,
  RotateCw,
  Navigation,
  ArrowRight,
  Tag,
  X
} from "lucide-react";

// Background Hero Carousel Image Slides(1536 × 1024 px resolution)
const CAROUSEL_SLIDES = [
  {
    url: assetUrl("corosal_image/JagannathTemple.png"),
    title: "Puri Jagannath Temple & Pilgrimage Tours",
    subtitle: "Explore Lord Jagannath Dham, Grand Road & Beach Tours with Professional Drivers"
  },
  {
    url: assetUrl("corosal_image/konark-temple-puri-odisha-2-attr-hero.jpeg"),
    title: "Scenic Puri-Konark Sun Temple & Marine Drive",
    subtitle: "Customized Day Tours, UNESCO World Heritage Sun Temple & Coastal Road Trips"
  },
  {
    url: assetUrl("corosal_image/marine_drive.jpg"),
    title: "Scenic View Marine Drive Eco Retreat",
    subtitle: "A vibrant seaside retreat featuring the deep blue ocean, bright skies, sandy shores, and a bold “Marine Drive Eco Retreat” sign."
  }
];

const formatPackageRate = (rate) => rate === null || rate === undefined || rate === ""
  ? "Contact for rate"
  : `₹${Number(rate).toLocaleString("en-IN")}`;

export function BookingTabs({
  onBookingSuccess,
  carsVersion = 0,
  initialTab = "Local Trip",
  initialPackage = "",
  preselectedCarId,
  compactMode = false
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeService, setActiveService] = useState("cabs");
  const [cars, setCars] = useState([]);
  const [offerBanner, setOfferBanner] = useState(() => OfferBannerBAL.getOfferBanner());
  const [selectedCarId, setSelectedCarId] = useState(preselectedCarId || "");

  // If a preselectedCarId is provided, set it on mount or when it changes
  useEffect(() => {
    if (preselectedCarId) {
      setSelectedCarId(preselectedCarId);
    }
  }, [preselectedCarId]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Tab-specific inputs - all empty initially
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [packageType, setPackageType] = useState("");
  const [packageName, setPackageName] = useState(initialPackage || "");
  const [transferType, setTransferType] = useState("");

  const [estimatedFare, setEstimatedFare] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const selectedCar = cars.find((car) => String(car.id) === String(selectedCarId));
  const appliedFestiveOffer = offerBanner.enabled
    && offerBanner.code
    && Number(offerBanner.amount) > 0
    && appliedCoupon.toUpperCase() === offerBanner.code.trim().toUpperCase();
  const activeCouponDiscount = appliedFestiveOffer ? Number(offerBanner.amount) || 0 : APP_CONFIG.COUPON_DISCOUNT;
  const discountAmount = appliedCoupon ? Math.min(activeCouponDiscount, estimatedFare) : 0;
  const payableFare = Math.max(0, estimatedFare - discountAmount);
  const hasBookingOffer = offerBanner.enabled
    && Boolean(offerBanner.title || offerBanner.message || offerBanner.code || Number(offerBanner.amount) > 0);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [offerPopupDismissed, setOfferPopupDismissed] = useState(false);

  useEffect(() => {
    if (compactMode || !hasBookingOffer || offerPopupDismissed) {
      setShowOfferPopup(false);
      return undefined;
    }

    const updateOfferPopupVisibility = () => setShowOfferPopup(window.scrollY > 240);
    updateOfferPopupVisibility();
    window.addEventListener("scroll", updateOfferPopupVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateOfferPopupVisibility);
  }, [compactMode, hasBookingOffer, offerPopupDismissed]);

  // Background Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play Carousel timer (every 4.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialPackage) setPackageName(initialPackage);
  }, [initialPackage]);

  // Fetch car list from BAL
  const loadCars = () => {
    const list = FleetBAL.getCars();
    setCars(list);
    if (list.length > 0) {
      setSelectedCarId((prev) => {
        if (!prev) return "";
        const exists = list.some((c) => String(c.id) === String(prev));
        return exists ? prev : "";
      });
    }
  };

  useEffect(() => {
    loadCars();
    OfferBannerBAL.syncOfferBanner().then(setOfferBanner);
    window.addEventListener(DATABASE_UPDATED_EVENT, loadCars);
    return () => window.removeEventListener(DATABASE_UPDATED_EVENT, loadCars);
  }, [carsVersion]);

  // Recalculate fare whenever tab or inputs change
  useEffect(() => {
    const carObj = cars.find((c) => String(c.id) === String(selectedCarId));
    if (!carObj) {
      setEstimatedFare(0);
      return;
    }
    if (activeTab === "Local Trip" && !packageType) {
      setEstimatedFare(0);
      return;
    }
    if (activeTab === "Taxi Packages" && !packageName) {
      setEstimatedFare(0);
      return;
    }
    if (activeTab === "Airport Transfer" && !transferType) {
      setEstimatedFare(0);
      return;
    }
    const details = {
      packageType,
      packageName,
      approxKm: activeTab === "One Way" ? 110 : 250,
      days: 2
    };
    const fare = BookingBAL.calculateFare(activeTab, details, carObj);
    setEstimatedFare(fare);
  }, [activeTab, selectedCarId, packageType, packageName, transferType, cars]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg(null);

    if (!selectedCarId) {
      setAlertMsg({ type: "error", text: "Please select a car model / seater." });
      return;
    }

    if (activeTab === "Local Trip" && !packageType) {
      setAlertMsg({ type: "error", text: "Please select a rental package." });
      return;
    }

    if (activeTab === "Taxi Packages" && !packageName) {
      setAlertMsg({ type: "error", text: "Please select a sightseeing package." });
      return;
    }

    if (activeTab === "Airport Transfer" && !transferType) {
      setAlertMsg({ type: "error", text: "Please select an airport transfer option." });
      return;
    }

    if (!pickupDate) {
      setAlertMsg({ type: "error", text: "Please select a pickup date." });
      return;
    }

    if (!pickupTime) {
      setAlertMsg({ type: "error", text: "Please select a pickup time." });
      return;
    }

    const carObj = cars.find((c) => String(c.id) === String(selectedCarId));

    const bookingPayload = {
      tripType: activeTab,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropLocation: activeTab === "Local Trip" ? "Local City" : dropLocation,
      pickupDate,
      pickupTime,
      returnDate: activeTab === "Round Trip" ? returnDate : "N/A",
      packageType: activeTab === "Local Trip" ? packageType : "N/A",
      packageName: activeTab === "Taxi Packages" ? packageName : "N/A",
      promoCode: appliedCoupon,
      selectedCarId,
      selectedCarName: carObj ? carObj.name : "Selected Car"
    };

    const res = await BookingBAL.createBooking(bookingPayload);

    if (res.success) {
      setAlertMsg({ type: "success", text: res.message });
      setCustomerName("");
      setCustomerPhone("");
      setPickupLocation("");
      setDropLocation("");
      setPickupDate("");
      setPickupTime("");
      setReturnDate("");
      setPackageType("");
      setSelectedCarId("");
      if (onBookingSuccess) onBookingSuccess(res.booking);
    } else {
      setAlertMsg({ type: "error", text: res.message });
    }
  };

  const handleApplyCoupon = () => {
    const normalizedCoupon = couponCode.trim().toUpperCase();
    const festiveCode = String(offerBanner.code || "").trim();
    const festiveAmount = Number(offerBanner.amount) || 0;

    if (offerBanner.enabled && festiveCode && festiveAmount > 0 && normalizedCoupon === festiveCode.toUpperCase()) {
      setAppliedCoupon(festiveCode);
      setCouponMessage({ type: "success", text: `₹${festiveAmount.toLocaleString("en-IN")} festive offer applied.` });
    } else if (normalizedCoupon === APP_CONFIG.COUPON_CODE.toUpperCase()) {
      setAppliedCoupon(APP_CONFIG.COUPON_CODE);
      setCouponMessage({ type: "success", text: `₹${APP_CONFIG.COUPON_DISCOUNT} discount applied.` });
    } else {
      setAppliedCoupon("");
      setCouponMessage({ type: "error", text: "That promo code is not valid." });
    }
  };

  const handleUseFestiveOffer = () => {
    if (offerBanner.code && Number(offerBanner.amount) > 0) {
      setCouponCode(offerBanner.code);
      setAppliedCoupon("");
      setCouponMessage(null);
      document.getElementById("booking-promo-code")?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => document.getElementById("booking-promo-code")?.focus({ preventScroll: true }), 350);
      return;
    }
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderBookingCard = () => (
    <div
      className="booking-card-container"
      style={compactMode ? { margin: 0, boxShadow: "none", border: "none", background: "transparent" } : {}}
    >
      {!compactMode && (
        <div className="booking-service-tabs" role="group" aria-label="Choose a booking service">
          <button
            type="button"
            aria-pressed={activeService === "cabs"}
            className={`booking-service-tab ${activeService === "cabs" ? "active" : ""}`}
            onClick={() => setActiveService("cabs")}
          >
            <Car size={18} />
            <span>Cabs</span>
            {offerBanner.enabled && <span className="booking-service-offer">Upto 20% Off</span>}
          </button>
          <a
            href="https://www.oyorooms.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="booking-service-tab"
            aria-label="Search hotels on OYO (opens in a new tab)"
          >
            <BedDouble size={18} />
            <span>Hotels</span>
          </a>
          <button
            type="button"
            aria-pressed={activeService === "flight"}
            className={`booking-service-tab ${activeService === "flight" ? "active" : ""}`}
            onClick={() => setActiveService("flight")}
          >
            <Plane size={18} />
            <span>Flight</span>
          </button>
          <button
            type="button"
            aria-pressed={activeService === "holiday"}
            className={`booking-service-tab ${activeService === "holiday" ? "active" : ""}`}
            onClick={() => setActiveService("holiday")}
          >
            <Palmtree size={18} />
            <span>Holiday</span>
          </button>
        </div>
      )}

      {activeService === "cabs" ? (
      <>
      {/* Tabs Navigation Header */}
      <div className="booking-tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === "Local Trip" ? "active" : ""}`}
          onClick={() => setActiveTab("Local Trip")}
        >
          <Navigation size={16} />
          <span>Local Trip</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "One Way" ? "active" : ""}`}
          onClick={() => setActiveTab("One Way")}
        >
          <ArrowRight size={16} />
          <span>One Way</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "Round Trip" ? "active" : ""}`}
          onClick={() => setActiveTab("Round Trip")}
        >
          <RotateCw size={16} />
          <span>Round Trip</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "Taxi Packages" ? "active" : ""}`}
          onClick={() => setActiveTab("Taxi Packages")}
        >
          <Package size={16} />
          <span>Taxi Packages</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "Airport Transfer" ? "active" : ""}`}
          onClick={() => setActiveTab("Airport Transfer")}
        >
          <Plane size={16} />
          <span>Airport Transfer</span>
        </button>
      </div>

      {/* Booking Alert Banner */}
      {alertMsg && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            background: alertMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: alertMsg.type === "success" ? "#065f46" : "#991b1b",
            border: alertMsg.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
            fontSize: "0.9rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleSubmit} style={{ marginTop: "0.85rem" }}>
        <div className="booking-form-grid">
          {/* Pickup Location */}
          <div className="form-group">
            <label className="form-label">
              <MapPin size={14} className="text-red" />
              <span>Pickup City / Spot</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Pickup City / Spot (e.g. Bhubaneswar)"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              required
            />
          </div>

          {/* Conditional Slot 2 of Row 1: Car Model for Local Trip (swapped with Rental Package), or Destination/Package/Transfer for other tabs */}
          {activeTab === "Local Trip" ? (
            <div className="form-group">
              <label className="form-label">
                <Car size={14} className="text-red" />
                <span>Select Car Model / Seater</span>
              </label>
              <select
                className="form-select"
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                required
              >
                <option value="">----select car----</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.seater} Seater - ₹{c.perKmPrice}/KM)
                  </option>
                ))}
              </select>
            </div>
          ) : (activeTab === "One Way" || activeTab === "Round Trip") ? (
            <div className="form-group">
              <label className="form-label">
                <MapPin size={14} className="text-red" />
                <span>Drop Destination</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Drop Destination (e.g. Puri Dham / Cuttack)"
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value)}
                required
              />
            </div>
          ) : activeTab === "Taxi Packages" ? (
            <div className="form-group">
              <label className="form-label">
                <Package size={14} className="text-red" />
                <span>Select Sightseeing Package</span>
              </label>
              <select
                className="form-select"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                required
              >
                <option value="">----select package----</option>
                <option value="Bhubaneswar Temple & City Tour">Bhubaneswar Temple & City Tour</option>
                <option value="Puri Jagannath Temple & Beach Tour">Puri Jagannath Temple & Beach Tour</option>
                <option value="Konark Sun Temple & Marine Drive">Konark Sun Temple & Marine Drive</option>
                <option value="Chilika Lake & Satapada Dolphin Tour">Chilika Lake & Satapada Dolphin Tour</option>
                <option value="Odisha Golden Triangle (3 Days)">Odisha Golden Triangle (3 Days)</option>
              </select>
            </div>
          ) : activeTab === "Airport Transfer" ? (
            <div className="form-group">
              <label className="form-label">
                <Plane size={14} className="text-red" />
                <span>Transfer Option</span>
              </label>
              <select
                className="form-select"
                value={transferType}
                onChange={(e) => setTransferType(e.target.value)}
                required
              >
                <option value="">----select transfer option----</option>
                <option value="Airport Pickup">Pickup from Airport (BPI Bhubaneswar)</option>
                <option value="Airport Drop">Drop at Airport (BPI Bhubaneswar)</option>
              </select>
            </div>
          ) : null}

          {/* Pickup Date */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} className="text-red" />
              <span>Pickup Date</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
          </div>

          {/* Return Date if Round Trip */}
          {activeTab === "Round Trip" && (
            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} className="text-red" />
                <span>Return Date</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
            </div>
          )}

          {/* Pickup Time Picker */}
          <div className="form-group">
            <label className="form-label">
              <Clock size={14} className="text-red" />
              <span>Pickup Time</span>
            </label>
            <input
              type="time"
              className="form-input"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              required
            />
          </div>

          {/* Row 2: Rental Package (if Local Trip) or Car Selection (for all other tabs) */}
          {activeTab === "Local Trip" ? (
            <div className="form-group col-span-2">
              <label className="form-label">
                <Package size={14} className="text-red" />
                <span>Rental Package</span>
              </label>
              <select
                className="form-select"
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                required
              >
                <option value="">----select package----</option>
                <option value="4 Hrs / 40 Kms">4 hrs - 40 km {selectedCar?.fourHours40Km ? `(${formatPackageRate(selectedCar.fourHours40Km)})` : ""}</option>
                <option value="8 Hrs / 80 Kms">8 hrs - 80 km {selectedCar?.eightHours80Km ? `(${formatPackageRate(selectedCar.eightHours80Km)})` : ""}</option>
                <option value="10 Hrs / 100 Kms">10 hrs - 100 km {selectedCar?.tenHours100Km ? `(${formatPackageRate(selectedCar.tenHours100Km)})` : ""}</option>
              </select>
            </div>
          ) : (
            <div className={`form-group ${activeTab !== "Round Trip" ? "col-span-2" : ""}`}>
              <label className="form-label">
                <Car size={14} className="text-red" />
                <span>Select Car Model / Seater</span>
              </label>
              <select
                className="form-select"
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                required
              >
                <option value="">----select car----</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.seater} Seater - ₹{c.perKmPrice}/KM)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Contact Inputs */}
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Your Full Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Enter 10-Digit Mobile"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Estimated Fare & Submit Action Bar */}
        <div className="estimated-fare-box">
          <div className="estimated-fare-summary">
            <div className="fare-title">Estimated Booking Fare</div>
            <div className="fare-amount">
              {estimatedFare > 0 ? (
                <>
                  {appliedCoupon && <del>₹{estimatedFare.toLocaleString("en-IN")}</del>}
                  <strong>₹{payableFare.toLocaleString("en-IN")}</strong>{" "}
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "normal" }}>
                    (All Inclusive Base Price)
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "0.92rem", color: "#64748b", fontWeight: "500" }}>
                  Select car model to view fare
                </span>
              )}
            </div>
            {discountAmount > 0 && <div className="fare-savings">You save ₹{discountAmount.toLocaleString("en-IN")}</div>}
          </div>
          {offerBanner.enabled && (
            <div className="booking-coupon-section">
              <label className="form-label" htmlFor="booking-promo-code">Use code to reduce price</label>
              <div className="booking-coupon-controls">
                <input
                  id="booking-promo-code"
                  type="text"
                  className="form-input"
                  placeholder={APP_CONFIG.COUPON_CODE}
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value);
                    setAppliedCoupon("");
                    setCouponMessage(null);
                  }}
                />
                <button type="button" className="btn-outline booking-coupon-apply" onClick={handleApplyCoupon}>Apply</button>
              </div>
              {couponMessage ? (
                <span className={`booking-coupon-message ${couponMessage.type}`} role="status">{couponMessage.text}</span>
              ) : (
                <span className="booking-coupon-hint">
                  {offerBanner.code && Number(offerBanner.amount) > 0
                    ? `Use ${offerBanner.code} for ₹${Number(offerBanner.amount).toLocaleString("en-IN")} off.`
                    : `Use ${APP_CONFIG.COUPON_CODE} for ₹${APP_CONFIG.COUPON_DISCOUNT} off.`}
                </span>
              )}
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ padding: "0.65rem 1.75rem", fontSize: "0.95rem" }}>
            Confirm &amp; Save Booking
          </button>
        </div>
      </form>
      </>
      ) : (
        <div className="booking-service-placeholder" role="status">
          {activeService === "holiday" ? <Palmtree size={28} /> : <Plane size={28} />}
          <span>{activeService === "holiday" ? "Holiday bookings are coming soon." : "Flight bookings are coming soon."}</span>
        </div>
      )}
    </div>
  );

  // If compactMode (e.g. inside popup), render just the booking card without carousel
  if (compactMode) {
    return renderBookingCard();
  }

  // Normal Hero Carousel Section (for Home page)
  return (
    <>
    <section id="booking" className="hero-wrapper-carousel">
      {/* Background Slides with Crossfade Transition */}
      {CAROUSEL_SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`carousel-slide-bg ${idx === currentSlide ? "active" : ""}`}
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.45)), url('${slide.url}')`
          }}
        />
      ))}

      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        {/* Carousel copy retained but hidden so booking starts at the top.
        <h1 className="hero-title">{CAROUSEL_SLIDES[currentSlide].title}</h1>
        <p className="hero-subtitle">{CAROUSEL_SLIDES[currentSlide].subtitle}</p>
        */}

        {renderBookingCard()}
      </div>
    </section>
    {showOfferPopup && hasBookingOffer && (
      <aside className="booking-offer-popup" role="status" aria-label="Festive offer">
        <button
          type="button"
          className="booking-offer-popup-close"
          aria-label="Close offer"
          onClick={() => {
            setOfferPopupDismissed(true);
            setShowOfferPopup(false);
          }}
        >
          <X size={17} />
        </button>
        <div className="booking-offer-popup-heading">
          <span className="booking-offer-popup-icon"><Tag size={17} /></span>
          <strong>{offerBanner.title || "Special festive offer"}</strong>
        </div>
        {offerBanner.message && <p>{offerBanner.message}</p>}
        {Number(offerBanner.amount) > 0 && (
          <div className="booking-offer-popup-amount">₹{Number(offerBanner.amount).toLocaleString("en-IN")} OFF</div>
        )}
        {offerBanner.code && Number(offerBanner.amount) > 0 && (
          <div className="booking-offer-popup-code">Use code <b>{offerBanner.code}</b></div>
        )}
        <button type="button" className="booking-offer-popup-action" onClick={handleUseFestiveOffer}>
          {offerBanner.code && Number(offerBanner.amount) > 0 ? "Use this offer" : "Book now"}
          <ArrowRight size={16} />
        </button>
      </aside>
    )}
    </>
  );
}
