import { dbFactory } from "../dal/DBFactory";
import { APP_CONFIG } from "../config/app.config";

const parseRate = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : NaN;
};

const validateTariffRates = (carData) => {
  const rates = {
    fourHours40Km: parseRate(carData.fourHours40Km),
    eightHours80Km: parseRate(carData.eightHours80Km),
    tenHours100Km: parseRate(carData.tenHours100Km),
    extraHour: parseRate(carData.extraHour),
    extraKm: parseRate(carData.extraKm)
  };

  if ([rates.eightHours80Km, rates.tenHours100Km, rates.extraHour, rates.extraKm].some((rate) => !Number.isFinite(rate))) {
    return { error: "Enter valid positive rates for the 8/80, 10/100, extra hour, and extra kilometre tariffs." };
  }
  if (Number.isNaN(rates.fourHours40Km)) {
    return { error: "Enter a valid positive 4 hours / 40 km rate, or leave it blank." };
  }

  return { rates };
};

export class FleetBAL {
  static getCars(filterSeater = "ALL", maxHourlyPrice = null) {
    const driver = dbFactory.getDriver();
    const defaultCars = new Map(APP_CONFIG.DEFAULT_CARS.map((car) => [String(car.id), car]));
    let cars = driver.findAll("Cars").map((car) => {
      const defaultCar = defaultCars.get(String(car.id));
      if (!defaultCar) return car;

      const hydratedCar = { ...car };
      ["fourHours40Km", "eightHours80Km", "tenHours100Km", "extraHour", "extraKm"].forEach((field) => {
        if (hydratedCar[field] === undefined && defaultCar[field] !== undefined) {
          hydratedCar[field] = defaultCar[field];
        }
      });
      return hydratedCar;
    });

    if (filterSeater && filterSeater !== "ALL") {
      const seaterNum = parseInt(filterSeater, 10);
      cars = cars.filter((c) => Number(c.seater) === seaterNum);
    }

    if (maxHourlyPrice) {
      cars = cars.filter((c) => Number(c.hourlyPrice) <= Number(maxHourlyPrice));
    }

    return cars;
  }

  static async addCar(carData) {
    // Validation
    if (!carData.name || !carData.seater || !carData.hourlyPrice) {
      return { success: false, message: "Vehicle Name, Seater capacity, and Hourly Price are required." };
    }

    const seater = parseInt(carData.seater, 10);
    const hourlyPrice = parseFloat(carData.hourlyPrice);
    const perKmPrice = carData.perKmPrice ? parseFloat(carData.perKmPrice) : Math.round(hourlyPrice * 0.05 + 10);
    const tariffValidation = validateTariffRates(carData);
    if (tariffValidation.error) return { success: false, message: tariffValidation.error };

    if (isNaN(seater) || seater <= 0) {
      return { success: false, message: "Please enter a valid positive number for Seater capacity." };
    }

    if (isNaN(hourlyPrice) || hourlyPrice <= 0) {
      return { success: false, message: "Please enter a valid Hourly Price." };
    }

    const newCar = {
      id: `CAR-${Date.now().toString().slice(-4)}`,
      name: carData.name.trim(),
      category: carData.category || "Standard",
      seater: seater,
      hourlyPrice: hourlyPrice,
      perKmPrice: perKmPrice,
      ...tariffValidation.rates,
      ac: carData.ac !== undefined ? carData.ac : true,
      luggage: carData.luggage || `${Math.max(2, Math.floor(seater * 0.6))} Bags`,
      image: carData.image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      features: carData.features && carData.features.length > 0 
        ? carData.features 
        : ["Clean Interiors", "Push Back Seats", "24/7 Driver Support", "AC Enabled"]
    };

    const driver = dbFactory.getDriver();
    let inserted;
    try { inserted = await driver.insert("Cars", newCar); }
    catch (error) { return { success: false, message: error.message || "Failed to save car to Neon." }; }

    if (inserted) {
      return { success: true, car: inserted, message: `Vehicle '${newCar.name}' added successfully to Database!` };
    }

    return { success: false, message: "Failed to save car to database." };
  }

  static async updateCar(carId, carData) {
    if (!carData.name || !carData.seater || !carData.hourlyPrice) {
      return { success: false, message: "Vehicle Name, Seater capacity, and Hourly Price are required." };
    }

    const seater = parseInt(carData.seater, 10);
    const hourlyPrice = parseFloat(carData.hourlyPrice);
    const perKmPrice = carData.perKmPrice ? parseFloat(carData.perKmPrice) : Math.round(hourlyPrice * 0.05 + 10);
    const tariffValidation = validateTariffRates(carData);
    if (tariffValidation.error) return { success: false, message: tariffValidation.error };

    if (isNaN(seater) || seater <= 0) {
      return { success: false, message: "Please enter a valid positive number for Seater capacity." };
    }

    if (isNaN(hourlyPrice) || hourlyPrice <= 0) {
      return { success: false, message: "Please enter a valid Hourly Price." };
    }

    const updatedPayload = {
      name: carData.name.trim(),
      category: carData.category || "Standard",
      seater: seater,
      hourlyPrice: hourlyPrice,
      perKmPrice: perKmPrice,
      ...tariffValidation.rates,
      luggage: carData.luggage || `${Math.max(2, Math.floor(seater * 0.6))} Bags`,
      image: carData.image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      features: carData.features && carData.features.length > 0 
        ? carData.features 
        : ["Clean Interiors", "Push Back Seats", "24/7 Driver Support", "AC Enabled"]
    };

    const driver = dbFactory.getDriver();
    let updated;
    try { updated = await driver.update("Cars", carId, updatedPayload); }
    catch (error) { return { success: false, message: error.message || "Failed to update vehicle in Neon." }; }

    if (updated) {
      return { success: true, car: updated, message: `Vehicle '${updated.name}' updated successfully!` };
    }

    return { success: false, message: "Failed to update vehicle in database." };
  }

  static async deleteCar(carId) {
    const driver = dbFactory.getDriver();
    let deleted;
    try { deleted = await driver.delete("Cars", carId); }
    catch (error) { return { success: false, message: error.message || "Failed to delete vehicle from Neon." }; }
    if (deleted) {
      return { success: true, message: "Vehicle deleted successfully from database." };
    }
    return { success: false, message: "Could not remove vehicle." };
  }
}
