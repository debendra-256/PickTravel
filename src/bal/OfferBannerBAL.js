const STORAGE_KEY = "PickMyTravels_Festive_Offer_Banner";

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

  saveOfferBanner(values) {
    const amountValue = Number(values.amount);
    const offer = {
      enabled: Boolean(values.enabled),
      title: String(values.title || "").trim(),
      message: String(values.message || "").trim(),
      code: String(values.code || "").trim(),
      amount: Number.isFinite(amountValue) && amountValue > 0 ? amountValue : 0
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offer));
      return { success: true, offer, message: "Festive offer banner saved." };
    } catch {
      return { success: false, message: "Could not save the festive offer banner." };
    }
  }
};
