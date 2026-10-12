import { apiRequest } from "../dal/apiClient";
import { DATABASE_UPDATED_EVENT } from "../dal/drivers/PostgresDriver";

const STORAGE_KEY = "PickmyTravels_Festive_Offer_Banner";

const DEFAULT_OFFER_BANNER = {
  enabled: true,
  title: "DIWALI SPECIAL",
  message: "Make your festive visits easy with a comfortable ride",
  code: "",
  amount: 0
};

export const OfferBannerBAL = {
  getOfferBanner() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return { ...DEFAULT_OFFER_BANNER };
      return { ...DEFAULT_OFFER_BANNER, ...JSON.parse(saved) };
    } catch {
      return { ...DEFAULT_OFFER_BANNER };
    }
  },

  async syncOfferBanner() {
    try {
      const records = await apiRequest("/api/records/Settings");
      const saved = records.find((record) => record.id === "festive-offer");
      if (!saved) return this.getOfferBanner();
      const offer = { ...DEFAULT_OFFER_BANNER, ...saved };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offer));
      window.dispatchEvent(new CustomEvent(DATABASE_UPDATED_EVENT));
      return offer;
    } catch {
      return this.getOfferBanner();
    }
  },

  async saveOfferBanner(values) {
    const amountValue = Number(values.amount);
    const offer = {
      enabled: Boolean(values.enabled),
      title: String(values.title || "").trim(),
      message: String(values.message || "").trim(),
      code: String(values.code || "").trim(),
      amount: Number.isFinite(amountValue) && amountValue > 0 ? amountValue : 0
    };

    try {
      const saved = await apiRequest("/api/records/Settings", {
        method: "POST",
        body: JSON.stringify(offer)
      });
      const persistedOffer = { ...DEFAULT_OFFER_BANNER, ...saved };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedOffer));
      return { success: true, offer: persistedOffer, message: "Festive offer banner saved to Supabase." };
    } catch {
      return { success: false, message: "Could not save the festive offer banner." };
    }
  }
};
