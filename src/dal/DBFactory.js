import { APP_CONFIG } from "../config/app.config";
import { ExcelDriver } from "./drivers/ExcelDriver";
import { MysqlDriver } from "./drivers/MysqlDriver";
import { PostgresDriver } from "./drivers/PostgresDriver";

class DBFactory {
  constructor() {
    this.currentDriverName = APP_CONFIG.ACTIVE_DB_DRIVER || "EXCEL";
    this.driverInstance = null;
    this.initializeDriver(this.currentDriverName);
  }

  initializeDriver(driverType) {
    if (this.driverInstance) {
      this.driverInstance.disconnect();
    }

    if (driverType === "MYSQL") {
      this.driverInstance = new MysqlDriver();
      this.currentDriverName = "MYSQL";
    } else if (driverType === "POSTGRES") {
      this.driverInstance = new PostgresDriver();
      this.currentDriverName = "POSTGRES";
    } else {
      this.driverInstance = new ExcelDriver();
      this.currentDriverName = "EXCEL";
    }

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

  // Switch driver dynamically at runtime (Excel <-> MySQL <-> PostgreSQL)
  switchDriver(driverType) {
    return this.initializeDriver(driverType);
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
