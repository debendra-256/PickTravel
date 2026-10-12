import { APP_CONFIG } from "../config/app.config";
import { PostgresDriver } from "./drivers/PostgresDriver";
import { GoogleSheetsDriver } from "./drivers/GoogleSheetsDriver";

const DRIVERS = {
  POSTGRES: PostgresDriver,
  GOOGLE_SHEETS: GoogleSheetsDriver
};

class DBFactory {
  constructor() {
    this.currentDriverName = APP_CONFIG.ACTIVE_DB_DRIVER || "POSTGRES";
    this.driverInstance = null;
    this.initializeDriver(this.currentDriverName);
  }

  initializeDriver(driverType) {
    if (this.driverInstance) {
      this.driverInstance.disconnect();
    }

    if (!DRIVERS[driverType]) {
      console.warn(`[DAL:DBFactory] Unknown driver "${driverType}", falling back to POSTGRES.`);
    }
    this.currentDriverName = DRIVERS[driverType] ? driverType : "POSTGRES";
    this.driverInstance = new DRIVERS[this.currentDriverName]();
    this.driverInstance.connect();
    console.log(`[DAL:DBFactory] Active Driver switched to: ${this.currentDriverName}`);
    return this.driverInstance;
  }

  // Get active driver instance
  getDriver() {
    if (!this.driverInstance || !this.driverInstance.isConnected) {
      this.initializeDriver(this.currentDriverName);
    }
    return this.driverInstance;
  }

  // Switch driver dynamically at runtime (PostgreSQL <-> Google Sheets)
  switchDriver(driverType) {
    return this.initializeDriver(DRIVERS[driverType] ? driverType : this.currentDriverName);
  }

  // Download a backup of the currently active database without changing records
  backupActiveDatabase() {
    const driver = this.getDriver();
    if (typeof driver.backupData === "function") {
      return driver.backupData();
    }
    return driver.exportData();
  }

  // Get active driver metadata
  getActiveDriverInfo() {
    return {
      type: this.currentDriverName,
      status: this.driverInstance ? this.driverInstance.getStatus() : null
    };
  }
}

// Export singleton instance
export const dbFactory = new DBFactory();
