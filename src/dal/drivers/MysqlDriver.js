import { IDataBaseAdapter } from "../IDataBaseAdapter";
import { APP_CONFIG } from "../../config/app.config";

export class MysqlDriver extends IDataBaseAdapter {
  constructor() {
    super("MySQL Database Adapter");
    this.config = APP_CONFIG.MYSQL_CONFIG;
    this.storageKey = "PickmyTravels_MySQL_DB";
    this.isConnected = false;
    this.tables = null;
    this.tableMap = {
      Cars: this.config.TABLES.CARS,
      Bookings: this.config.TABLES.BOOKINGS,
      Users: this.config.TABLES.USERS,
      Blogs: this.config.TABLES.BLOGS,
      Enquiries: this.config.TABLES.ENQUIRIES
    };
  }

  getRealTableName(tableName) {
    return this.tableMap[tableName] || tableName;
  }

  connect() {
    try {
      console.log(`[DAL:MysqlDriver] Connecting to MySQL Host [${this.config.HOST}:${this.config.PORT}] Database [${this.config.DATABASE}]...`);
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.tables = JSON.parse(raw);
      } else {
        // Initialize MySQL Database Schema Tables
        this.tables = {
          [this.config.TABLES.CARS]: [...APP_CONFIG.DEFAULT_CARS],
          [this.config.TABLES.BOOKINGS]: [
            {
              id: "MYSQL-BK-2001",
              tripType: "Airport Transfer",
              customerName: "Debendra Kumar",
              customerPhone: "9876543210",
              customerEmail: "debendra@example.com",
              pickupLocation: "Biju Patnaik International Airport",
              dropLocation: "Patia Infocity, Bhubaneswar",
              pickupDate: "2026-10-02",
              pickupTime: "10:00 AM",
              selectedCar: "Innova Crysta",
              estimatedFare: 1200,
              status: "Confirmed",
              createdAt: new Date().toLocaleString()
            }
          ],
          [this.config.TABLES.USERS]: [
            {
              id: "USR-1",
              username: "admin",
              password: "admin123",
              role: "Administrator",
              email: "admin@pickmytravels.com"
            }
          ],
          [this.config.TABLES.BLOGS]: APP_CONFIG.DEFAULT_BLOGS ? [...APP_CONFIG.DEFAULT_BLOGS] : [],
          [this.config.TABLES.ENQUIRIES]: [
            {
              id: "MYSQL-ENQ-1",
              name: "Saurav Patnaik",
              phone: "9123456789",
              message: "Inquiry about Outstation taxi rate to Sambalpur.",
              status: "New",
              date: "Sep 28, 2026"
            }
          ]
        };
        this.saveState();
      }
      this.isConnected = true;
      console.log(`[DAL:MysqlDriver] Connected to MySQL database via Connection String: ${this.config.CONNECTION_STRING}`);
      return true;
    } catch (err) {
      console.error("[DAL:MysqlDriver] MySQL Connection Error:", err);
      return false;
    }
  }

  disconnect() {
    this.isConnected = false;
    console.log("[DAL:MysqlDriver] Connection closed for MySQL database.");
    return true;
  }

  getStatus() {
    return {
      driver: "MySQL Relational Driver (Pluggable)",
      connected: this.isConnected,
      host: `${this.config.HOST}:${this.config.PORT}`,
      database: this.config.DATABASE,
      connectionString: this.config.CONNECTION_STRING,
      tablesCount: this.tables ? Object.keys(this.tables).length : 0
    };
  }

  saveState() {
    if (this.tables) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tables));
    }
  }

  findAll(tableName) {
    if (!this.isConnected) this.connect();
    const realTable = this.getRealTableName(tableName);
    console.log(`[DAL:MysqlDriver] EXEC SQL: SELECT * FROM \`${realTable}\`;`);
    const data = this.tables[realTable] || [];
    return [...data];
  }

  findById(tableName, id) {
    if (!this.isConnected) this.connect();
    const realTable = this.getRealTableName(tableName);
    console.log(`[DAL:MysqlDriver] EXEC SQL: SELECT * FROM \`${realTable}\` WHERE id = '${id}' LIMIT 1;`);
    const data = this.tables[realTable] || [];
    return data.find((item) => String(item.id) === String(id)) || null;
  }

  insert(tableName, record) {
    if (!this.isConnected) this.connect();
    const realTable = this.getRealTableName(tableName);
    if (!this.tables[realTable]) {
      this.tables[realTable] = [];
    }

    const newRecord = {
      id: record.id || `MYSQL-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      ...record
    };

    console.log(`[DAL:MysqlDriver] EXEC SQL: INSERT INTO \`${realTable}\` (${Object.keys(newRecord).join(", ")}) VALUES (...);`);
    this.tables[realTable].unshift(newRecord);
    this.saveState();
    return newRecord;
  }

  update(tableName, id, updatedRecord) {
    if (!this.isConnected) this.connect();
    const realTable = this.getRealTableName(tableName);
    const data = this.tables[realTable] || [];
    const index = data.findIndex((item) => String(item.id) === String(id));
    if (index !== -1) {
      console.log(`[DAL:MysqlDriver] EXEC SQL: UPDATE \`${realTable}\` SET ... WHERE id = '${id}';`);
      data[index] = { ...data[index], ...updatedRecord, updatedAt: new Date().toLocaleString() };
      this.saveState();
      return data[index];
    }
    return null;
  }

  delete(tableName, id) {
    if (!this.isConnected) this.connect();
    const realTable = this.getRealTableName(tableName);
    const data = this.tables[realTable] || [];
    console.log(`[DAL:MysqlDriver] EXEC SQL: DELETE FROM \`${realTable}\` WHERE id = '${id}';`);
    const initialLen = data.length;
    this.tables[realTable] = data.filter((item) => String(item.id) !== String(id));
    const deleted = this.tables[realTable].length < initialLen;
    if (deleted) this.saveState();
    return deleted;
  }

  exportData() {
    if (!this.isConnected) this.connect();
    let sqlDump = `-- Patra Travels MySQL Database Dump\n-- Database: ${this.config.DATABASE}\n-- Exported At: ${new Date().toLocaleString()}\n\n`;

    Object.keys(this.tables).forEach((tbl) => {
      sqlDump += `DROP TABLE IF EXISTS \`${tbl}\`;\n`;
      sqlDump += `CREATE TABLE \`${tbl}\` (\n  \`id\` VARCHAR(100) PRIMARY KEY,\n  \`data\` JSON\n);\n`;

      this.tables[tbl].forEach((row) => {
        sqlDump += `INSERT INTO \`${tbl}\` VALUES ('${row.id}', '${JSON.stringify(row).replace(/'/g, "\\'")}');\n`;
      });
      sqlDump += `\n`;
    });

    const blob = new Blob([sqlDump], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PickmyTravels_Dump_${this.config.DATABASE}.sql`;
    a.click();
    return { success: true, fileName: `PickmyTravels_Dump_${this.config.DATABASE}.sql` };
  }

  backupData() {
    if (!this.isConnected) this.connect();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `PickmyTravels_MySQL_Backup_${stamp}.sql`;
    let sqlDump = `-- Patra Travels MySQL Database Backup\n-- Database: ${this.config.DATABASE}\n-- Backed Up At: ${new Date().toLocaleString()}\n\n`;

    Object.keys(this.tables).forEach((tbl) => {
      sqlDump += `DROP TABLE IF EXISTS \`${tbl}\`;\n`;
      sqlDump += `CREATE TABLE \`${tbl}\` (\n  \`id\` VARCHAR(100) PRIMARY KEY,\n  \`data\` JSON\n);\n`;
      this.tables[tbl].forEach((row) => {
        sqlDump += `INSERT INTO \`${tbl}\` VALUES ('${row.id}', '${JSON.stringify(row).replace(/'/g, "\\'")}');\n`;
      });
      sqlDump += `\n`;
    });

    const blob = new Blob([sqlDump], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    return { success: true, fileName };
  }

  importData(dataObject) {
    try {
      this.tables = dataObject;
      this.saveState();
      return true;
    } catch (err) {
      console.error("[DAL:MysqlDriver] Failed to import state:", err);
      return false;
    }
  }
}
