import { getSheetsApiBaseUrl } from "../apiClient";
import { collections, PostgresDriver } from "./PostgresDriver";

const SHEETS_CACHE_KEY = "PickmyTravels_Sheets_Cache";

export class GoogleSheetsDriver extends PostgresDriver {
  constructor() {
    super(SHEETS_CACHE_KEY);
    this.driverName = "Google Sheets";
  }

  getStatus() {
    return {
      driver: "Google Spreadsheet",
      connected: this.isConnected && Boolean(getSheetsApiBaseUrl()),
      target: "Google Spreadsheet (Apps Script web app)",
      tablesCount: collections.length
    };
  }

  async exportData() {
    await this.hydrateRemote(true);
    return this.download(JSON.stringify(this.tables, null, 2), "PickTravel_GoogleSheets_Backup.json");
  }

  async backupData() {
    return this.exportData();
  }
}
