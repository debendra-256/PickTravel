import { IDataBaseAdapter } from "../IDataBaseAdapter";
import { APP_CONFIG } from "../../config/app.config";
import { apiRequest, getApiBaseUrl } from "../apiClient";

export const DATABASE_UPDATED_EVENT = "picktravel:database-updated";
const CACHE_KEY = "PickmyTravels_Neon_Cache";
export const collections = ["Cars", "Bookings", "Users", "Blogs", "Enquiries", "Settings"];

const emptyState = () => ({
  Cars: [...APP_CONFIG.DEFAULT_CARS],
  Bookings: [],
  Users: [],
  Blogs: [],
  Enquiries: [],
  Settings: []
});

export class PostgresDriver extends IDataBaseAdapter {
  constructor(cacheKey = CACHE_KEY) {
    super("Supabase Postgres");
    this.isConnected = false;
    this.cacheKey = cacheKey;
    this.tables = this.readCache();
  }

  readCache() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.cacheKey) || "null");
      return { ...emptyState(), ...(saved || {}), Users: [] };
    } catch {
      return emptyState();
    }
  }

  saveCache() {
    localStorage.setItem(this.cacheKey, JSON.stringify(this.tables));
    window.dispatchEvent(new CustomEvent(DATABASE_UPDATED_EVENT));
  }

  connect() {
    this.isConnected = true;
    void this.hydrateRemote();
    return true;
  }

  async hydrateRemote(includePrivate = Boolean(sessionStorage.getItem("PATRA_TOKEN"))) {
    if (!getApiBaseUrl()) return false;
    const names = includePrivate ? collections : ["Cars", "Blogs", "Settings"];
    const results = await Promise.allSettled(names.map(async (name) => [name, await apiRequest(`/api/records/${name}`)]));
    let changed = false;
    for (const result of results) {
      if (result.status === "fulfilled") {
        const [name, rows] = result.value;
        this.tables[name] = Array.isArray(rows) ? rows : [];
        changed = true;
      } else {
        console.error("Could not sync data from Supabase:", result.reason?.message || result.reason);
      }
    }
    if (changed) this.saveCache();
    return changed;
  }

  disconnect() {
    this.isConnected = false;
    return true;
  }

  getStatus() {
    return {
      driver: "Supabase Postgres API",
      connected: this.isConnected && Boolean(getApiBaseUrl()),
      target: "Supabase production database",
      tablesCount: collections.length
    };
  }

  findAll(collection) {
    if (!this.isConnected) this.connect();
    return [...(this.tables[collection] || [])];
  }

  findById(collection, id) {
    return (this.tables[collection] || []).find((record) => String(record.id) === String(id)) || null;
  }

  async insert(collection, record) {
    const saved = await apiRequest(`/api/records/${encodeURIComponent(collection)}`, {
      method: "POST",
      body: JSON.stringify(record)
    });
    this.tables[collection] = [saved, ...(this.tables[collection] || []).filter((row) => String(row.id) !== String(saved.id))];
    this.saveCache();
    return saved;
  }

  async update(collection, id, updatedRecord) {
    const saved = await apiRequest(`/api/records/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updatedRecord)
    });
    this.tables[collection] = (this.tables[collection] || []).map((row) => String(row.id) === String(id) ? saved : row);
    this.saveCache();
    return saved;
  }

  async delete(collection, id) {
    const result = await apiRequest(`/api/records/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (result.success) {
      this.tables[collection] = (this.tables[collection] || []).filter((row) => String(row.id) !== String(id));
      this.saveCache();
    }
    return result.success;
  }

  download(content, fileName, mimeType = "application/json") {
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return { success: true, fileName };
  }

  async exportData() {
    await this.hydrateRemote(true);
    return this.download(JSON.stringify(this.tables, null, 2), "PickTravel_Postgres_Backup.json");
  }

  async backupData() {
    return this.exportData();
  }

  async importData(data) {
    if (!data || typeof data !== "object") return false;
    for (const collection of ["Cars", "Blogs", "Bookings", "Enquiries"]) {
      for (const row of Array.isArray(data[collection]) ? data[collection] : []) {
        if (row?.id) {
          const exists = this.findById(collection, row.id);
          if (exists) await this.update(collection, row.id, row);
          else await this.insert(collection, row);
        }
      }
    }
    await this.hydrateRemote(true);
    return true;
  }
}
