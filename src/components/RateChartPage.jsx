import React, { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { FleetBAL } from "../bal/FleetBAL";
import { APP_CONFIG } from "../config/app.config";
import { DATABASE_UPDATED_EVENT } from "../dal/drivers/PostgresDriver";
import { assetUrl } from "../config/assetUrl";

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
    const loadCars = () => setCars(FleetBAL.getCars());
    loadCars();
    window.addEventListener(DATABASE_UPDATED_EVENT, loadCars);
    return () => window.removeEventListener(DATABASE_UPDATED_EVENT, loadCars);
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
        <img src={assetUrl("picklogo.png")} alt={APP_CONFIG.COMPANY_NAME} />
        <div>
          <strong>{APP_CONFIG.COMPANY_NAME}</strong>
          <span>WhatsApp: {APP_CONFIG.DISPLAY_WHATSAPP}</span>
          <span>Registered Office: {APP_CONFIG.ADDRESS}</span>
        </div>
      </div>

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

        <aside className="rate-chart-notes rate-chart-tnc">
          <h2>Terms &amp; Conditions</h2>
          <ol className="rate-chart-tnc-list">
            <li>Toll taxes, interstate taxes, and parking charges will be charged on an actual basis.</li>
            <li>Kilometres and hours will be calculated from garage to garage.</li>
            <li>
              <strong>Night Halt Charges (10:00 PM to 6:00 AM):</strong>
              <ul className="rate-chart-tnc-sub">
                <li>Light Vehicle: ₹350</li>
                <li>Traveller: ₹500</li>
                <li>Coach: ₹1,000</li>
              </ul>
            </li>
            <li>
              <strong>Driver Allowance for Outstation Trips:</strong>
              <ul className="rate-chart-tnc-sub">
                <li>Light Vehicle: ₹350</li>
                <li>Tempo: ₹500</li>
                <li>Coach: ₹1,000</li>
              </ul>
            </li>
            <li>Vehicles covering less than 300 km per day will be billed as per the applicable local tariff.</li>
            <li>For outstation trips, a minimum of 300 km per day will be charged.</li>
            <li>Additional charges will apply for vehicles operating with the air conditioning switched on while stationary.</li>
            <li>If a booking is cancelled within 24 hours of the scheduled departure time, 20% of the total booking amount will be charged as a cancellation fee.</li>
            <li>Air conditioning must remain switched off while driving on ghat roads.</li>
            <li>All disputes shall be subject to the jurisdiction of the courts in Bhubaneswar only.</li>
            <li>Toll taxes, interstate taxes, parking fees, and other road-related charges incurred during the trip will be charged additionally on an actual basis.</li>
            <li>For all bookings with Tour &amp; Travels Bhubaneswar, the travel time and distance will be calculated from garage to garage.</li>
            <li>Customers are requested to confirm all trip details before the commencement of the journey.</li>
          </ol>
        </aside>
      </section>
    </section>
  );
}
