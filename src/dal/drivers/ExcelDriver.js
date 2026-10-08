import { IDataBaseAdapter } from "../IDataBaseAdapter";
import { APP_CONFIG } from "../../config/app.config";
import * as XLSX from "xlsx";

export class ExcelDriver extends IDataBaseAdapter {
  constructor() {
    super("Excel Spreadsheet Database");
    this.storageKey = APP_CONFIG.EXCEL_CONFIG.STORAGE_KEY;
    this.isConnected = false;
    this.workbookData = null;
  }

  connect() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.workbookData = JSON.parse(raw);
      } else {
        // Initialize default Excel Workbook Structure
        this.workbookData = {
          Cars: [...APP_CONFIG.DEFAULT_CARS],
          Bookings: [
            {
              id: "BK-1001",
              tripType: "Local Trip",
              customerName: "Rakesh Sharma",
              customerPhone: "9861012345",
              customerEmail: "rakesh@gmail.com",
              pickupLocation: "Bhubaneswar Railway Station",
              dropLocation: "Cuttack Ring Road",
              pickupDate: "2026-10-01",
              pickupTime: "08:30 AM",
              packageType: "8 Hrs / 80 Kms",
              selectedCar: "Swift Dzire / Etios",
              estimatedFare: 2000,
              status: "Confirmed",
              createdAt: new Date().toLocaleString()
            }
          ],
          Users: [
            {
              id: "USR-1",
              username: "admin",
              password: "admin123", // In production hash password
              role: "Administrator",
              email: "admin@pickmytravels.com"
            }
          ],
          Blogs: APP_CONFIG.DEFAULT_BLOGS ? [...APP_CONFIG.DEFAULT_BLOGS] : [],
          Enquiries: [
            {
              id: "ENQ-1",
              name: "Priyanka Mishra",
              phone: "9437098765",
              message: "Need 2 Innova Crystas for wedding trip to Puri on 15th October.",
              status: "Pending",
              date: "Sep 27, 2026"
            }
          ]
        };
        this.saveWorkbook();
      }
      this.isConnected = true;
      console.log("[DAL:ExcelDriver] Connected to Excel Database workbook successfully.");
      return true;
    } catch (err) {
      console.error("[DAL:ExcelDriver] Error connecting to Excel database:", err);
      return false;
    }
  }

  disconnect() {
    this.isConnected = false;
    console.log("[DAL:ExcelDriver] Disconnected from Excel Database.");
    return true;
  }

  getStatus() {
    return {
      driver: "Excel Spreadsheet Driver (XLSX / LocalStorage)",
      connected: this.isConnected,
      storageKey: this.storageKey,
      sheetsCount: this.workbookData ? Object.keys(this.workbookData).length : 0,
      connectionString: `excel://${this.storageKey}`
    };
  }

  saveWorkbook() {
    if (this.workbookData) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.workbookData));
    }
  }

  findAll(tableName) {
    if (!this.isConnected) this.connect();
    const sheet = this.workbookData[tableName] || [];
    return [...sheet];
  }

  findById(tableName, id) {
    if (!this.isConnected) this.connect();
    const sheet = this.workbookData[tableName] || [];
    return sheet.find((item) => String(item.id) === String(id)) || null;
  }

  insert(tableName, record) {
    if (!this.isConnected) this.connect();
    if (!this.workbookData[tableName]) {
      this.workbookData[tableName] = [];
    }

    const newRecord = {
      id: record.id || `REC-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      ...record
    };

    this.workbookData[tableName].unshift(newRecord);
    this.saveWorkbook();
    console.log(`[DAL:ExcelDriver] Record inserted into Sheet [${tableName}]`, newRecord);
    return newRecord;
  }

  update(tableName, id, updatedRecord) {
    if (!this.isConnected) this.connect();
    const sheet = this.workbookData[tableName] || [];
    const index = sheet.findIndex((item) => String(item.id) === String(id));
    if (index !== -1) {
      sheet[index] = { ...sheet[index], ...updatedRecord, updatedAt: new Date().toLocaleString() };
      this.saveWorkbook();
      return sheet[index];
    }
    return null;
  }

  delete(tableName, id) {
    if (!this.isConnected) this.connect();
    const sheet = this.workbookData[tableName] || [];
    const initialLength = sheet.length;
    this.workbookData[tableName] = sheet.filter((item) => String(item.id) !== String(id));
    const deleted = this.workbookData[tableName].length < initialLength;
    if (deleted) this.saveWorkbook();
    return deleted;
  }

  exportData() {
    if (!this.isConnected) this.connect();
    try {
      const wb = XLSX.utils.book_new();

      Object.keys(this.workbookData).forEach((sheetName) => {
        const wsData = this.workbookData[sheetName];
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Trigger actual XLSX browser download
      XLSX.writeFile(wb, APP_CONFIG.EXCEL_CONFIG.FILE_NAME);
      return { success: true, fileName: APP_CONFIG.EXCEL_CONFIG.FILE_NAME };
    } catch (err) {
      console.error("[DAL:ExcelDriver] Failed to export XLSX file:", err);
      return { success: false, error: err.message };
    }
  }

  backupData() {
    if (!this.isConnected) this.connect();
    try {
      const wb = XLSX.utils.book_new();
      Object.keys(this.workbookData).forEach((sheetName) => {
        const ws = XLSX.utils.json_to_sheet(this.workbookData[sheetName]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `PickmyTravels_Excel_Backup_${stamp}.xlsx`;
      XLSX.writeFile(wb, fileName);
      return { success: true, fileName };
    } catch (err) {
      console.error("[DAL:ExcelDriver] Failed to backup XLSX file:", err);
      return { success: false, error: err.message };
    }
  }

  importData(dataObject) {
    try {
      if (typeof dataObject === "object") {
        this.workbookData = dataObject;
        this.saveWorkbook();
        return true;
      }
      return false;
    } catch (err) {
      console.error("[DAL:ExcelDriver] Failed to import data:", err);
      return false;
    }
  }
}
