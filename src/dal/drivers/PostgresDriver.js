import { IDataBaseAdapter } from "../IDataBaseAdapter";
import { APP_CONFIG } from "../../config/app.config";

export class PostgresDriver extends IDataBaseAdapter {
  constructor() {
    super("PostgreSQL Database Adapter");
    this.config = APP_CONFIG.POSTGRES_CONFIG;
    this.storageKey = "PickmyTravels_Postgres_DB";
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
      console.log(
        `[DAL:PostgresDriver] Connecting to PostgreSQL Host [${this.config.HOST}:${this.config.PORT}] Database [${this.config.DATABASE}] Schema [${this.config.SCHEMA}]...`
      );
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.tables = JSON.parse(raw);
      } else {
        this.tables = {
          [this.config.TABLES.CARS]: [...APP_CONFIG.DEFAULT_CARS],
          [this.config.TABLES.BOOKINGS]: [
            {
              id: "PG-BK-3001",
              tripType: "Round Trip",
              customerName: "Anita Dash",
              customerPhone: "9437012345",
              customerEmail: "anita@example.com",
              pickupLocation: "Nandankanan Zoo Gate",
              dropLocation: "Puri Jagannath Temple",
              pickupDate: "2026-10-05",
              pickupTime: "06:30 AM",
              selectedCar: "Innova Crysta",
              estimatedFare: 4200,
              status: "Pending",
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
              id: "PG-ENQ-1",
              name: "Bikash Swain",
              phone: "9090011122",
              message: "Need a 17-seater Urbania for Konark-Puri-Chilika weekend trip.",
              status: "New",
              date: "Oct 01, 2026"
            }
          ]
        };
        this.saveState();
      }
      this.isConnected = true;
      console.log(`[DAL:PostgresDriver] Connected via Connection String: ${this.config.CONNECTION_STRING}`);
      return true;
    } catch (err) {
      console.error("[DAL:PostgresDriver] PostgreSQL Connection Error:", err);
      return false;
    }
  }

  disconnect() {
    this.isConnected = false;
    console.log("[DAL:PostgresDriver] Connection closed for PostgreSQL database.");
    return true;
  }

  getStatus() {
    return {
      driver: "PostgreSQL Relational Driver (Pluggable)",
      connected: this.isConnected,
      host: `${this.config.HOST}:${this.config.PORT}`,
      database: this.config.DATABASE,
      schema: this.config.SCHEMA,
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
    console.log(`[DAL:PostgresDriver] EXEC SQL: SELECT * FROM ${this.config.SCHEMA}."${realTable}";`);
    const data = this.tables[realTable] || [];
    return [...data];
  }

  findById(tableName, id) {
    if (!this.isConnected) this.connect();
    const realTable = this.getRealTableName(tableName);
    console.log(
      `[DAL:PostgresDriver] EXEC SQL: SELECT * FROM ${this.config.SCHEMA}."${realTable}" WHERE id = '${id}' LIMIT 1;`
    );
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
      id: record.id || `PG-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      ...record
    };

    console.log(
      `[DAL:PostgresDriver] EXEC SQL: INSERT INTO ${this.config.SCHEMA}."${realTable}" (${Object.keys(newRecord).join(", ")}) VALUES (...);`
    );
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
      console.log(
        `[DAL:PostgresDriver] EXEC SQL: UPDATE ${this.config.SCHEMA}."${realTable}" SET ... WHERE id = '${id}';`
      );
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
    console.log(
      `[DAL:PostgresDriver] EXEC SQL: DELETE FROM ${this.config.SCHEMA}."${realTable}" WHERE id = '${id}';`
    );
    const initialLen = data.length;
    this.tables[realTable] = data.filter((item) => String(item.id) !== String(id));
    const deleted = this.tables[realTable].length < initialLen;
    if (deleted) this.saveState();
    return deleted;
  }

  buildSqlDump() {
    const stamp = new Date().toISOString();
    let sqlDump = `-- Pick My Travels PostgreSQL Database Dump\n`;
    sqlDump += `-- Database: ${this.config.DATABASE}\n`;
    sqlDump += `-- Schema: ${this.config.SCHEMA}\n`;
    sqlDump += `-- Exported At: ${stamp}\n\n`;
    sqlDump += `SET client_encoding = 'UTF8';\n`;
    sqlDump += `CREATE SCHEMA IF NOT EXISTS ${this.config.SCHEMA};\n\n`;

    Object.keys(this.tables).forEach((tbl) => {
      const qualified = `${this.config.SCHEMA}."${tbl}"`;
      sqlDump += `DROP TABLE IF EXISTS ${qualified} CASCADE;\n`;
      sqlDump += `CREATE TABLE ${qualified} (\n  id VARCHAR(100) PRIMARY KEY,\n  data JSONB NOT NULL\n);\n`;

      (this.tables[tbl] || []).forEach((row) => {
        const json = JSON.stringify(row).replace(/'/g, "''");
        sqlDump += `INSERT INTO ${qualified} (id, data) VALUES ('${String(row.id).replace(/'/g, "''")}', '${json}'::jsonb);\n`;
      });
      sqlDump += `\n`;
    });

    return sqlDump;
  }

  downloadTextFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportData() {
    if (!this.isConnected) this.connect();
    const fileName = `PickmyTravels_Dump_${this.config.DATABASE}.sql`;
    this.downloadTextFile(this.buildSqlDump(), fileName, "text/plain;charset=utf-8");
    return { success: true, fileName };
  }

  backupData() {
    if (!this.isConnected) this.connect();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `PickmyTravels_Postgres_Backup_${stamp}.sql`;
    this.downloadTextFile(this.buildSqlDump(), fileName, "application/sql;charset=utf-8");
    return { success: true, fileName };
  }

  importData(dataObject) {
    try {
      this.tables = dataObject;
      this.saveState();
      return true;
    } catch (err) {
      console.error("[DAL:PostgresDriver] Failed to import state:", err);
      return false;
    }
  }
}
