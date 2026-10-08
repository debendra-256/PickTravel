import React, { useState, useEffect } from "react";
import { FleetBAL } from "../bal/FleetBAL";
import { X, PlusCircle, Save } from "lucide-react";
import { assetUrl } from "../config/assetUrl";

export function AddCarModal({ isOpen, onClose, onCarAdded, carToEdit = null }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Sedan");
  const [seater, setSeater] = useState("4");
  const [hourlyPrice, setHourlyPrice] = useState("");
  const [perKmPrice, setPerKmPrice] = useState("");
  const [fourHours40Km, setFourHours40Km] = useState("");
  const [eightHours80Km, setEightHours80Km] = useState("");
  const [tenHours100Km, setTenHours100Km] = useState("");
  const [extraHour, setExtraHour] = useState("");
  const [extraKm, setExtraKm] = useState("");
  const [luggage, setLuggage] = useState("");
  const [image, setImage] = useState("");
  const [features, setFeatures] = useState("Air Conditioner, Clean Interior, Push Back Seats, 24/7 Driver Support");

  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    if (carToEdit) {
      setName(carToEdit.name || "");
      setCategory(carToEdit.category || "Sedan");
      setSeater(carToEdit.seater ? String(carToEdit.seater) : "4");
      setHourlyPrice(carToEdit.hourlyPrice ? String(carToEdit.hourlyPrice) : "");
      setPerKmPrice(carToEdit.perKmPrice ? String(carToEdit.perKmPrice) : "");
      setFourHours40Km(carToEdit.fourHours40Km ?? "");
      setEightHours80Km(carToEdit.eightHours80Km ?? "");
      setTenHours100Km(carToEdit.tenHours100Km ?? "");
      setExtraHour(carToEdit.extraHour ?? "");
      setExtraKm(carToEdit.extraKm ?? "");
      setLuggage(carToEdit.luggage || "");
      setImage(carToEdit.image || "");
      setFeatures(Array.isArray(carToEdit.features) ? carToEdit.features.join(", ") : "");
    } else {
      setName("");
      setCategory("Sedan");
      setSeater("4");
      setHourlyPrice("");
      setPerKmPrice("");
      setFourHours40Km("");
      setEightHours80Km("");
      setTenHours100Km("");
      setExtraHour("");
      setExtraKm("");
      setLuggage("");
      setImage("");
      setFeatures("Air Conditioner, Clean Interior, Push Back Seats, 24/7 Driver Support");
    }
    setAlertMsg(null);
  }, [carToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg(null);

    const featureArray = features
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const carData = {
      name,
      category,
      seater,
      hourlyPrice,
      perKmPrice,
      fourHours40Km,
      eightHours80Km,
      tenHours100Km,
      extraHour,
      extraKm,
      luggage,
      image,
      features: featureArray
    };

    let res;
    if (carToEdit && carToEdit.id) {
      res = await FleetBAL.updateCar(carToEdit.id, carData);
    } else {
      res = await FleetBAL.addCar(carData);
    }

    if (res.success) {
      setAlertMsg({ type: "success", text: res.message });
      setTimeout(() => {
        if (onCarAdded) onCarAdded(res.car);
        onClose();
      }, 1000);
    } else {
      setAlertMsg({ type: "error", text: res.message });
    }
  };

  return (
    <div className="modal-overlay add-car-overlay">
      <div className="modal-content add-car-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <img src={assetUrl("picklogo.webp")} alt="Pick My Travel" style={{ height: "36px", objectFit: "contain" }} />
          <h3 style={{ fontSize: "1.3rem" }}>
            {carToEdit ? "Edit Vehicle Details" : "Add New Vehicle to Fleet"}
          </h3>
        </div>

        {alertMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              marginBottom: "1rem",
              background: alertMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: alertMsg.type === "success" ? "#065f46" : "#991b1b",
              border: alertMsg.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
              fontSize: "0.88rem",
              fontWeight: "600"
            }}
          >
            {alertMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-car-form">
          <div className="form-group addcar-field-name">
            <label className="form-label">Vehicle Name / Model *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Innova Crysta / Urbania"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="addcar-field-meta">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Sedan">Sedan</option>
                <option value="Compact SUV">Compact SUV</option>
                <option value="Luxury SUV">Luxury SUV</option>
                <option value="Mini Van">Mini Van</option>
                <option value="Executive Van">Executive Van</option>
                <option value="VIP Luxury">VIP Luxury</option>
                <option value="Bus">Bus / Coach</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Seating Capacity (Seater) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 4, 7, 12, 26"
                value={seater}
                onChange={(e) => setSeater(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="addcar-field-pricing">
            <div className="form-group">
              <label className="form-label">Price Per Hour (₹) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 350"
                value={hourlyPrice}
                onChange={(e) => setHourlyPrice(e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Price Per KM (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 16"
                value={perKmPrice}
                onChange={(e) => setPerKmPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="vehicle-tariff-section addcar-field-tariffs">
            <div className="vehicle-tariff-heading">
              <h4>Local A/C Tariff</h4>
              <span>A/C package prices for local trips.</span>
            </div>
            <div className="vehicle-tariff-input-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="vehicle-tariff-4-40">4 hours / 40 km (₹)</label>
                <input id="vehicle-tariff-4-40" type="number" min="1" step="1" className="form-input" placeholder="Optional" value={fourHours40Km} onChange={(e) => setFourHours40Km(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vehicle-tariff-8-80">8 hours / 80 km (₹) *</label>
                <input id="vehicle-tariff-8-80" type="number" min="1" step="1" className="form-input" value={eightHours80Km} onChange={(e) => setEightHours80Km(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vehicle-tariff-10-100">10 hours / 100 km (₹) *</label>
                <input id="vehicle-tariff-10-100" type="number" min="1" step="1" className="form-input" value={tenHours100Km} onChange={(e) => setTenHours100Km(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vehicle-tariff-extra-hour">Extra hour (₹) *</label>
                <input id="vehicle-tariff-extra-hour" type="number" min="1" step="1" className="form-input" value={extraHour} onChange={(e) => setExtraHour(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vehicle-tariff-extra-km">Extra kilometre (₹) *</label>
                <input id="vehicle-tariff-extra-km" type="number" min="1" step="1" className="form-input" value={extraKm} onChange={(e) => setExtraKm(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="form-group addcar-field-image">
            <label className="form-label">Image URL (Optional)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div className="form-group addcar-field-features">
            <label className="form-label">Features (Comma Separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Air Conditioner, Push Back Seats, Clean Interior"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
            />
          </div>

          <div className="addcar-form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {carToEdit ? <Save size={16} /> : <PlusCircle size={16} />}
              {carToEdit ? "Update Vehicle" : "Save Vehicle to DB"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
