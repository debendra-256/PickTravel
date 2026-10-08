import React, { useEffect, useMemo, useState } from "react";
import { Car, Download, Search } from "lucide-react";
import { FleetBAL } from "../bal/FleetBAL";
import { APP_CONFIG } from "../config/app.config";

const formatRate = (rate) => {
  if (rate === null || rate === undefined || rate === "") return "Contact for rate";
  return `₹${Number(rate).toLocaleString("en-IN")}`;
};

const packages = [
  { key: "fourHours40Km", title: "4 hours · 40 km" },
  { key: "eightHours80Km", title: "8 hours · 80 km" },
  { key: "tenHours100Km", title: "10 hours · 100 km" }
];

export function RateChartPage({ carsVersion = 0 }) {
  const [cars, setCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    setCars(FleetBAL.getCars());
  }, [carsVersion]);

  const categories = useMemo(() => [...new Set(cars.map((car) => car.category).filter(Boolean))].sort(), [cars]);

  const visibleCars = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return [...cars]
      .filter((car) => categoryFilter === "ALL" || car.category === categoryFilter)
      .filter((car) => !query || `${car.name} ${car.category} ${car.seater}`.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cars, categoryFilter, searchTerm]);

  return (
    <section className="rate-chart-page">
      <div className="rate-chart-print-header">
        <img src="/picklogo.png" alt={APP_CONFIG.COMPANY_NAME} />
        <div>
          <strong>{APP_CONFIG.COMPANY_NAME}</strong>
          <span>WhatsApp: {APP_CONFIG.DISPLAY_WHATSAPP}</span>
          <span>Registered Office: {APP_CONFIG.ADDRESS}</span>
        </div>
      </div>
      <section className="rate-chart-hero">
        <div className="container rate-chart-hero-content">
          <div>
            <span className="rate-chart-eyebrow"><span /> Vehicle pricing</span>
            <h1>Vehicle Rate Chart</h1>
            <p>Local A/C package rates and extra usage charges.</p>
          </div>
          <div className="rate-chart-hero-mark" aria-hidden="true"><Car size={42} /></div>
        </div>
      </section>

      <section className="container rate-chart-content">
        <div className="rate-chart-toolbar">
          <div>
            <h2>Local trip packages</h2>
            <p>Showing {visibleCars.length} of {cars.length} vehicles · A/C rates</p>
          </div>
          <div className="rate-chart-controls">
            <label className="rate-chart-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search vehicles</span>
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search vehicles" />
            </label>
            <label className="rate-chart-category-filter">
              <span className="sr-only">Filter by vehicle category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="ALL">All vehicle types</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <button type="button" className="rate-chart-export" onClick={() => window.print()}>
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>

        {visibleCars.length ? (
          <div className="rate-table-wrap">
            <table className="rate-chart-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>4 hrs / 40 km</th>
                  <th>8 hrs / 80 km</th>
                  <th>10 hrs / 100 km</th>
                  <th>Extra hour</th>
                  <th>Extra km</th>
                </tr>
              </thead>
              <tbody>
                {visibleCars.map((car) => (
                  <tr key={car.id}>
                    <th scope="row">
                      <strong>{car.name}</strong>
                      <span>{car.category} · {car.seater} seater · A/C</span>
                    </th>
                    {packages.map((item) => (
                      <td key={item.key} className={car[item.key] == null ? "rate-unavailable" : ""}>
                        {formatRate(car[item.key])}
                      </td>
                    ))}
                    <td className={car.extraHour == null ? "rate-unavailable" : ""}>{formatRate(car.extraHour)}</td>
                    <td className={car.extraKm == null ? "rate-unavailable" : ""}>{formatRate(car.extraKm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rate-chart-empty">No vehicles match “{searchTerm}”. Try another search.</div>
        )}

        <aside className="rate-chart-notes">
          <h2>Good to know</h2>
          <ul>
            <li>Toll, interstate tax, and parking are extra. Billing is garage to garage.</li>
            <li>Night halt and driver allowance apply. Outstation trips have a 300 km/day minimum.</li>
            <li>Standing A/C is chargeable; A/C is switched off on ghat roads.</li>
            <li>Cancellation within 24 hours incurs a 20% charge. Jurisdiction: Bhubaneswar.</li>
          </ul>
        </aside>
      </section>
    </section>
  );
}
