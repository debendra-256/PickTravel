import React, { useState, useEffect } from "react";
import { BookingTabs } from "./BookingTabs";
import { FleetBAL } from "../bal/FleetBAL";
import { Car, Users, Filter, X } from "lucide-react";
import { DATABASE_UPDATED_EVENT } from "../dal/drivers/PostgresDriver";

export function FleetSection({
  carsVersion = 0,
  onBookingSuccess
}) {
  const [cars, setCars] = useState([]);
  const [filterSeater, setFilterSeater] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingCarId, setBookingCarId] = useState(null);

  const loadCars = () => {
    const list = FleetBAL.getCars(filterSeater, maxPrice);
    setCars(list);
  };

  useEffect(() => {
    loadCars();
    window.addEventListener(DATABASE_UPDATED_EVENT, loadCars);
    return () => window.removeEventListener(DATABASE_UPDATED_EVENT, loadCars);
  }, [filterSeater, maxPrice, carsVersion]);

  const openBookingModal = (car) => {
    setBookingCarId(car.id);
    setShowBookingModal(true);
  };

  return (
    <section id="fleet" className="section-padding" style={{ background: "#ffffff" }}>
      <div className="container">
        {/* Filter Controls Bar */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid var(--border-color)",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            alignItems: "center",
            marginBottom: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>
            <Filter size={16} className="text-red" />
            <span>Filter Fleet:</span>
          </div>

          {/* Seater Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Seater Capacity:</span>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {["ALL", "4", "6", "7", "12", "17", "26"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterSeater(st)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    background: filterSeater === st ? "var(--primary-red)" : "#ffffff",
                    color: filterSeater === st ? "white" : "var(--text-dark)",
                    border: "1px solid #cbd5e1"
                  }}
                >
                  {st === "ALL" ? "All Seaters" : `${st} Seater`}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Max Hourly Price:</span>
            <input
              type="number"
              className="form-input"
              style={{ width: "120px", padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}
              placeholder="e.g. 800"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Cars Cards Grid */}
        <div className="fleet-grid">
          {cars.map((car) => (
            <div key={car.id} className="car-card">
              <div className="car-img-wrapper">
                <img src={car.image} alt={car.name} className="car-img" />
              </div>

              <div className="car-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                  <h3 className="car-title">{car.name}</h3>
                  <span className="badge badge-blue">{car.category}</span>
                </div>

                <div className="car-specs">
                  <div className="car-spec-item">
                    <Users size={14} className="text-red" />
                    <span><strong>{car.seater}</strong> Seater</span>
                  </div>
                  <div className="car-spec-item">
                    <span><strong>₹</strong>{car.perKmPrice}/KM</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.75rem" }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: "center", padding: "0.55rem" }}
                    onClick={() => openBookingModal(car)}
                  >
                    Book {car.name}
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>

        {showBookingModal && (
          <div
            style={{
              position: "fixed",
              top: 0, left: 0,
              width: "100vw", height: "100vh",
              background: "rgba(10,20,40,0.65)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              backdropFilter: "blur(3px)",
              padding: "1rem"
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowBookingModal(false); }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                width: "min(960px, 95vw)",
                maxHeight: "94vh",
                overflowX: "hidden",
                overflowY: "auto",
                boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Modal Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.9rem 1.5rem",
                background: "linear-gradient(135deg, #0f172a 0%, #b91c1c 100%)",
                borderRadius: "16px 16px 0 0",
                flexShrink: 0
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                  <div style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "10px",
                    padding: "0.4rem 0.55rem",
                    fontSize: "1.2rem",
                    lineHeight: 1
                  }}>🚗</div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: "700", fontSize: "1.05rem", letterSpacing: "0.01em" }}>Book Your Ride</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Pick My Travel — Odisha's Trusted Cab Service</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: "50%",
                    width: "34px", height: "34px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    color: "#fff",
                    transition: "background 0.2s"
                  }}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "0.75rem 1rem 1rem", overflowX: "hidden" }}>
                <BookingTabs
                  compactMode={true}
                  preselectedCarId={bookingCarId}
                  carsVersion={carsVersion}
                  onBookingSuccess={(booking) => {
                    if (onBookingSuccess) onBookingSuccess(booking);
                    setShowBookingModal(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
