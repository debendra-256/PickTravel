import React, { useState, useEffect } from "react";
import { dbFactory } from "../dal/DBFactory";
import { BookingBAL } from "../bal/BookingBAL";
import { FleetBAL } from "../bal/FleetBAL";
import { EnquiryBAL } from "../bal/EnquiryBAL";
import { OfferBannerBAL } from "../bal/OfferBannerBAL";
import { DATABASE_UPDATED_EVENT } from "../dal/drivers/PostgresDriver";
import {
  Database,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  Car,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  PlusCircle,
  Lock,
  ShieldCheck,
  Check,
  Edit,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageSquare,
  Send,
  Tag
} from "lucide-react";

const buildDriverDetailsMessage = (booking, driver, fare) => `*Booking Confirmed - Pick My Travel*\n\nDear ${booking.customerName},\nYour booking *#${booking.id}* has been confirmed!\n\nPickup: ${booking.pickupLocation}\nDate: ${booking.pickupDate} (${booking.pickupTime})\nVehicle: ${booking.selectedCar}\nTotal Fare: ₹${fare}\n\n*Driver Details:*\nDriver Name: *${driver.name}*\nDriver Mobile: *${driver.phone}*\n\n*⚠️ Note: The quoted fare is approximate and may vary based on applicable RTO/government guidelines, actual distance, trip duration, route changes, waiting time, or additional usage; toll, parking, and other applicable charges are extra as per actuals, and the final fare and trip inclusions should be confirmed with PickMyTravels before the journey to avoid any disputes.*\n\nPlease coordinate with your driver upon arrival.\nHelpline: +91 9853706020\n\nThank you for choosing Pick My Travel!`;

const DRIVER_LABELS = { POSTGRES: "Postgres", GOOGLE_SHEETS: "Google Sheets" };

export function AdminDashboard({ session, onOpenAddCar, onEditCar, onOpenAuthModal, carsVersion = 0, onCarsChange }) {
  const [activeDriver] = useState(dbFactory.getActiveDriverInfo().type);
  const [driverStatus] = useState(dbFactory.getActiveDriverInfo().status);
  const [bookings, setBookings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [cars, setCars] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 10;
  const [confirmingBooking, setConfirmingBooking] = useState(null);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverPrice, setDriverPrice] = useState("");
  const [statusMsg, setStatusMsg] = useState(null);
  const [offerBanner, setOfferBanner] = useState(() => OfferBannerBAL.getOfferBanner());

  const feedbackRecords = enquiries.filter((record) => String(record.type || "").toLowerCase().includes("feedback"));
  const enquiryRecords = enquiries.filter((record) => !String(record.type || "").toLowerCase().includes("feedback"));

  const reloadData = () => {
    const bList = BookingBAL.getBookings();
    setBookings(bList);
    const eList = EnquiryBAL.getEnquiries();
    setEnquiries(eList);
    const cList = FleetBAL.getCars();
    setCars(cList);
  };

  useEffect(() => {
    reloadData();
    OfferBannerBAL.syncOfferBanner().then(setOfferBanner);
    window.addEventListener(DATABASE_UPDATED_EVENT, reloadData);
    return () => window.removeEventListener(DATABASE_UPDATED_EVENT, reloadData);
  }, [carsVersion]);

  const handleExportDatabase = async () => {
    const driver = dbFactory.getDriver();
    const res = await driver.exportData();
    if (res.success) {
      setStatusMsg({ type: "success", text: `Database exported successfully as [${res.fileName}]!` });
    } else {
      setStatusMsg({ type: "error", text: `Export error: ${res.error}` });
    }
  };

  const handleSaveOfferBanner = async (event) => {
    event.preventDefault();
    const result = await OfferBannerBAL.saveOfferBanner(offerBanner);
    if (result.success) {
      setOfferBanner(result.offer);
      setStatusMsg({ type: "success", text: result.message });
    } else {
      setStatusMsg({ type: "error", text: result.message });
    }
  };

  const handleBackupDatabase = async () => {
    const res = await dbFactory.backupActiveDatabase();
    if (res.success) {
      setStatusMsg({ type: "success", text: `Database backup downloaded as [${res.fileName}]!` });
    } else {
      setStatusMsg({ type: "error", text: `Backup error: ${res.error || "Unable to create backup"}` });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const res = await BookingBAL.updateBookingStatus(id, newStatus);
    if (res.success) {
      reloadData();
      setStatusMsg({ type: "success", text: res.message });
    }
  };

  const handleOpenConfirmModal = (booking) => {
    setConfirmingBooking(booking);
    setDriverName(booking.driverName || "");
    setDriverPhone(booking.driverPhone && booking.driverPhone !== "N/A" ? booking.driverPhone : "");
    setDriverPrice(booking.estimatedFare !== undefined ? String(booking.estimatedFare) : "");
  };

  const handleConfirmAndSendWhatsApp = async (e) => {
    e.preventDefault();
    if (!confirmingBooking) return;
    if (!driverName.trim()) {
      alert("Please enter the Driver Name.");
      return;
    }
    if (!driverPhone.trim()) {
      alert("Please enter the Driver Mobile Number.");
      return;
    }

    const updatedData = {
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      estimatedFare: driverPrice.trim() !== "" ? Number(driverPrice) : confirmingBooking.estimatedFare
    };

    const res = await BookingBAL.confirmBookingWithDriver(confirmingBooking.id, updatedData);

    if (res.success) {
      // Build WhatsApp message for customer
      const rawPhone = String(confirmingBooking.customerPhone || "").replace(/[^0-9]/g, "");
      const fullPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

      const waMsg = buildDriverDetailsMessage(
        confirmingBooking,
        { name: updatedData.driverName, phone: updatedData.driverPhone },
        updatedData.estimatedFare
      );

      const waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(waMsg)}`;

      try {
        window.open(waUrl, "_blank");
      } catch (err) {
        console.warn("Popup blocked:", err);
      }

      setConfirmingBooking(null);
      setDriverName("");
      setDriverPhone("");
      setDriverPrice("");
      reloadData();

      setStatusMsg({
        type: "success",
        text: `Booking #${confirmingBooking.id} confirmed! Driver ${updatedData.driverName} (${updatedData.driverPhone}) assigned and WhatsApp message prepared for ${confirmingBooking.customerName}.`,
        whatsappUrl: waUrl
      });
    } else {
      setStatusMsg({ type: "error", text: res.message });
    }
  };

  const handleDeleteCar = async (car) => {
    if (window.confirm(`Are you sure you want to delete vehicle "${car.name}" from the database?`)) {
      const res = await FleetBAL.deleteCar(car.id);
      if (res.success) {
        setStatusMsg({ type: "success", text: res.message });
        reloadData();
        if (onCarsChange) onCarsChange();
      } else {
        setStatusMsg({ type: "error", text: res.message });
      }
    }
  };

  const filteredBookings = bookings.filter((b) => {
    // Filter by trip type
    const matchesTripType = filterType === "ALL" || b.tripType === filterType;
    if (!matchesTripType) return false;

    // Filter by search query (Booking ID, Customer Name, Mobile Number)
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const idMatch = String(b.id || "").toLowerCase().includes(q);
    const nameMatch = String(b.customerName || "").toLowerCase().includes(q);
    const phoneMatch = String(b.customerPhone || "").toLowerCase().includes(q);

    return idMatch || nameMatch || phoneMatch;
  });

  // Reset to page 1 whenever search query or trip filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  // Pagination Calculations (10 records per page)
  const totalRecords = filteredBookings.length;
  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = Math.min(startIndex + RECORDS_PER_PAGE, totalRecords);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Helper to construct smart page number array (e.g. 1, 2, 3, '...', 10)
  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, "...", total];
    }
    if (current >= total - 2) {
      return [1, "...", total - 3, total - 2, total - 1, total];
    }
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  return (
    <section className="section-padding admin-dashboard-page">
      <div className="container">
        <header className="admin-console-header">
          <div className="admin-console-heading">
            <span className="admin-console-mark" aria-hidden="true"><ShieldCheck size={24} /></span>
            <div>
              <span className="admin-console-eyebrow">PICK MY TRAVELS · ADMIN</span>
              <h1>Administrator Console</h1>
              <p>Welcome back, {session?.username || "Admin"}. Manage bookings, fleet, and customer enquiries.</p>
            </div>
          </div>
          <button className="admin-console-password" onClick={onOpenAuthModal}>
            <Lock size={15} />
            <span>Change Password</span>
          </button>
        </header>

        {statusMsg && (
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              background: statusMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: statusMsg.type === "success" ? "#065f46" : "#991b1b",
              border: statusMsg.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
              fontWeight: "600",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem"
            }}
          >
            <span>{statusMsg.text}</span>
            {statusMsg.whatsappUrl && (
              <a
                href={statusMsg.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#25d366",
                  color: "#ffffff",
                  padding: "0.38rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)"
                }}
              >
                <span>📲 Open Customer WhatsApp Chat</span>
              </a>
            )}
          </div>
        )}

        {/* Pluggable Database Driver Control Panel */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "white",
            padding: "1.75rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "2.5rem",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Database size={22} style={{ color: "var(--primary-red)" }} />
                <h3 style={{ color: "white", fontSize: "1.3rem" }}>{DRIVER_LABELS[activeDriver] || activeDriver} Database</h3>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                Active database: <strong>{driverStatus ? driverStatus.driver : activeDriver}</strong> · {driverStatus?.connected ? `Connected to ${driverStatus.target}` : "Waiting for connection"}
              </p>
            </div>

            {/* Database actions */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={handleBackupDatabase}
                style={{
                  background: "#0ea5e9",
                  color: "white",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <DatabaseBackup size={16} />
                <span>Backup Database</span>
              </button>

              <button
                className="btn-primary"
                onClick={handleExportDatabase}
                style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}
              >
                <Download size={16} />
                <span>Export {DRIVER_LABELS[activeDriver] || activeDriver} to File</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <Calendar size={16} />
              <span>Customer Bookings ({bookings.length})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "fleet" ? "active" : ""}`}
              onClick={() => setActiveTab("fleet")}
            >
              <Car size={16} />
              <span>Fleet Vehicles ({cars.length})</span>
            </button>


            <button
              className={`tab-btn ${activeTab === "enquiries" ? "active" : ""}`}
              onClick={() => setActiveTab("enquiries")}
            >
              <Send size={16} />
              <span>Enquiries ({enquiryRecords.length})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
              onClick={() => setActiveTab("feedback")}
            >
              <MessageSquare size={16} />
              <span>Feedback ({feedbackRecords.length})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "offers" ? "active" : ""}`}
              onClick={() => setActiveTab("offers")}
            >
              <Tag size={16} />
              <span>Festive Offer</span>
            </button>

          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-outline" onClick={onOpenAddCar} style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}>
              <PlusCircle size={15} />
              <span>Add Vehicle</span>
            </button>
            <button className="btn-secondary" onClick={reloadData} style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}>
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Bookings View */}
        {activeTab === "bookings" && (
          <div>
            {/* Filter and Search Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              {/* Filter by Trip Type */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {["ALL", "Local Trip", "One Way", "Round Trip", "Taxi Packages", "Airport Transfer"].map((tp) => (
                  <button
                    key={tp}
                    onClick={() => setFilterType(tp)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      background: filterType === tp ? "var(--dark-navy)" : "#f1f5f9",
                      color: filterType === tp ? "white" : "var(--text-dark)",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tp}
                  </button>
                ))}
              </div>

              {/* Search Box: Booking ID, Customer Name, Mobile Number */}
              <div style={{ position: "relative", minWidth: "260px", flex: "1", maxWidth: "380px" }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                    pointerEvents: "none"
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by ID, Name, Mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.42rem 2rem 0.42rem 2.1rem",
                    fontSize: "0.84rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    background: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "2px"
                    }}
                    title="Clear Search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Active search or filter feedback */}
            {(searchQuery.trim() || filterType !== "ALL") && (
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <span>
                  Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> bookings
                  {searchQuery.trim() && <> matching "<strong>{searchQuery}</strong>"</>}
                  {filterType !== "ALL" && <> in <strong>{filterType}</strong></>}
                </span>
                {(searchQuery.trim() || filterType !== "ALL") && (
                  <button
                    onClick={() => { setSearchQuery(""); setFilterType("ALL"); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-red)",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: "0.78rem",
                      padding: 0
                    }}
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            )}

            {/* Bookings Data Table */}
            <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>ID</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Trip Type</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Customer</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Pickup & Date</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Vehicle</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Fare</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                        {searchQuery.trim() ? (
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--dark-navy)", fontSize: "0.95rem", marginBottom: "0.3rem" }}>
                              No bookings found matching "{searchQuery}"
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                              Search checks <strong>Booking ID</strong> (e.g. BK-123456), <strong>Customer Name</strong>, and <strong>Mobile Number</strong>.
                            </div>
                            <button
                              onClick={() => setSearchQuery("")}
                              className="btn-outline"
                              style={{ marginTop: "0.85rem", fontSize: "0.8rem", padding: "0.35rem 0.9rem" }}
                            >
                              Clear Search
                            </button>
                          </div>
                        ) : (
                          `No bookings saved in current ${DRIVER_LABELS[activeDriver] || activeDriver} database.`
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b) => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: "700", color: "var(--primary-red)", whiteSpace: "nowrap" }}>
                          {b.id}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span className="badge badge-blue">{b.tripType}</span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <strong>{b.customerName}</strong>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{b.customerPhone}</div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div>{b.pickupLocation}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{b.pickupDate} ({b.pickupTime})</div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <strong>{b.selectedCar}</strong>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{b.packageType !== "N/A" ? b.packageType : b.packageName}</div>
                          {b.driverName && (
                            <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "0.25rem", background: "#f0fdf4", padding: "0.15rem 0.4rem", borderRadius: "4px", border: "1px solid #bbf7d0", display: "inline-block" }}>
                              👨‍✈️ {b.driverName} ({b.driverPhone})
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Original: <span style={{ textDecoration: "line-through" }}>₹{Number(b.baseFare ?? b.estimatedFare ?? 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div style={{ marginTop: "0.15rem", fontWeight: "800", color: "var(--dark-navy)" }}>
                            Discounted: ₹{Number(b.estimatedFare ?? b.baseFare ?? 0).toLocaleString("en-IN")}
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          <span className={`badge ${b.status === "Confirmed" ? "badge-green" : "badge-red"}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                          {/* All Action Buttons kept in ONE row */}
                          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                            <button
                              onClick={() => handleOpenConfirmModal(b)}
                              style={{
                                background: "#ecfdf5",
                                color: "#065f46",
                                border: "1px solid #a7f3d0",
                                padding: "0.35rem 0.65rem",
                                borderRadius: "5px",
                                fontSize: "0.78rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                whiteSpace: "nowrap",
                                flexShrink: 0
                              }}
                              title="Confirm Booking & Assign Driver"
                            >
                              <CheckCircle2 size={13} />
                              <span>Confirm Booking</span>
                            </button>

                            {b.status === "Confirmed" && (
                              <button
                                onClick={() => handleStatusChange(b.id, "Cancelled")}
                                style={{
                                  background: "#fef2f2",
                                  color: "#991b1b",
                                  border: "1px solid #fecaca",
                                  padding: "0.35rem 0.55rem",
                                  borderRadius: "5px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0
                                }}
                                title="Cancel Booking"
                              >
                                Cancel
                              </button>
                            )}

                            {b.driverName && (
                              <button
                                onClick={() => {
                                  const rawPhone = String(b.customerPhone || "").replace(/[^0-9]/g, "");
                                  const fullPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
                                  const waMsg = buildDriverDetailsMessage(
                                    b,
                                    { name: b.driverName, phone: b.driverPhone },
                                    b.estimatedFare
                                  );
                                  window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(waMsg)}`, "_blank");
                                }}
                                style={{
                                  background: "#25d366",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "0.35rem 0.6rem",
                                  borderRadius: "5px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                  boxShadow: "0 1px 3px rgba(37, 211, 102, 0.3)"
                                }}
                                title="Send Driver Details to Customer on WhatsApp"
                              >
                                <span>📲 WhatsApp</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Beautiful Pagination Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.85rem 1.25rem",
                  background: "#f8fafc",
                  borderTop: "1px solid var(--border-color)",
                  flexWrap: "wrap",
                  gap: "0.75rem"
                }}
              >
                {/* Left: Record summary */}
                <div style={{ fontSize: "0.83rem", color: "#64748b" }}>
                  {totalRecords === 0 ? (
                    "No records to display"
                  ) : (
                    <>
                      Showing <strong style={{ color: "var(--dark-navy)" }}>{startIndex + 1}</strong> to{" "}
                      <strong style={{ color: "var(--dark-navy)" }}>{endIndex}</strong> of{" "}
                      <strong style={{ color: "var(--dark-navy)" }}>{totalRecords}</strong> bookings{" "}
                      <span style={{ color: "#94a3b8" }}>(10 records per page)</span>
                    </>
                  )}
                </div>

                {/* Right: Page Navigation Buttons */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {/* First Page */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage === 1}
                      style={{
                        minWidth: "30px",
                        height: "30px",
                        padding: "0 0.35rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: validCurrentPage === 1 ? "#cbd5e1" : "#475569",
                        cursor: validCurrentPage === 1 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="First Page"
                    >
                      <ChevronsLeft size={14} />
                    </button>

                    {/* Previous Page */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={validCurrentPage === 1}
                      style={{
                        minWidth: "30px",
                        height: "30px",
                        padding: "0 0.35rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: validCurrentPage === 1 ? "#cbd5e1" : "#475569",
                        cursor: validCurrentPage === 1 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="Previous Page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {/* Numeric Page Buttons */}
                    {getPageNumbers(validCurrentPage, totalPages).map((pNum, idx) =>
                      pNum === "..." ? (
                        <span key={`dots-${idx}`} style={{ padding: "0 0.35rem", color: "#94a3b8", fontSize: "0.82rem" }}>
                          ...
                        </span>
                      ) : (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setCurrentPage(pNum)}
                          style={{
                            minWidth: "30px",
                            height: "30px",
                            padding: "0 0.45rem",
                            borderRadius: "6px",
                            fontSize: "0.82rem",
                            fontWeight: validCurrentPage === pNum ? "700" : "600",
                            background: validCurrentPage === pNum ? "var(--dark-navy)" : "#ffffff",
                            color: validCurrentPage === pNum ? "#ffffff" : "#475569",
                            border: validCurrentPage === pNum ? "1px solid var(--dark-navy)" : "1px solid #cbd5e1",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            boxShadow: validCurrentPage === pNum ? "0 2px 6px rgba(15,23,42,0.2)" : "none"
                          }}
                        >
                          {pNum}
                        </button>
                      )
                    )}

                    {/* Next Page */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={validCurrentPage === totalPages}
                      style={{
                        minWidth: "30px",
                        height: "30px",
                        padding: "0 0.35rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: validCurrentPage === totalPages ? "#cbd5e1" : "#475569",
                        cursor: validCurrentPage === totalPages ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="Next Page"
                    >
                      <ChevronRight size={14} />
                    </button>

                    {/* Last Page */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validCurrentPage === totalPages}
                      style={{
                        minWidth: "30px",
                        height: "30px",
                        padding: "0 0.35rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: validCurrentPage === totalPages ? "#cbd5e1" : "#475569",
                        cursor: validCurrentPage === totalPages ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title="Last Page"
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Booking & Driver Details Modal Popup */}
        {confirmingBooking && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1500,
              backdropFilter: "blur(3px)",
              padding: "1rem"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmingBooking(null);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                width: "min(500px, 96vw)",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
                border: "1px solid #e2e8f0"
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.9rem 1.25rem",
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  color: "#ffffff",
                  borderRadius: "14px 14px 0 0"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🚗</span>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "1.02rem" }}>Confirm Booking & Assign Driver</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Booking #{confirmingBooking.id} • {confirmingBooking.customerName}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmingBooking(null)}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "1rem 1.25rem" }}>
                {/* Trip Summary Chip */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    padding: "0.7rem 0.9rem",
                    fontSize: "0.8rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.35rem 0.65rem",
                    marginBottom: "1rem"
                  }}
                >
                  <div>
                    <span style={{ color: "#64748b" }}>Customer: </span>
                    <strong>{confirmingBooking.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Mobile: </span>
                    <strong>{confirmingBooking.customerPhone}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Trip Type: </span>
                    <strong>{confirmingBooking.tripType}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Vehicle: </span>
                    <strong>{confirmingBooking.selectedCar}</strong>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#64748b" }}>Pickup: </span>
                    <strong>{confirmingBooking.pickupLocation}</strong> on <strong>{confirmingBooking.pickupDate} ({confirmingBooking.pickupTime})</strong>
                  </div>
                </div>

                {/* Driver & Price Form */}
                <form onSubmit={handleConfirmAndSendWhatsApp}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {/* Driver Name */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.25rem" }}>
                        Driver Name <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Ramesh Kumar Sahoo"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        required
                        autoFocus
                        style={{ fontSize: "0.85rem", height: "36px" }}
                      />
                    </div>

                    {/* Driver Mobile Number */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.25rem" }}>
                        Driver Mobile Number <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="e.g. 9853706020"
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        required
                        style={{ fontSize: "0.85rem", height: "36px" }}
                      />
                    </div>

                    {/* Price Details */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.25rem" }}>
                        Price Details (₹)
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Total Fare (₹)"
                        value={driverPrice}
                        onChange={(e) => setDriverPrice(e.target.value)}
                        style={{ fontSize: "0.85rem", height: "36px" }}
                      />
                      <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem", display: "block" }}>
                        Current fare: ₹{confirmingBooking.estimatedFare}. Adjust here if any extra charges or discounts apply.
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginTop: "1.25rem",
                      paddingTop: "0.9rem",
                      borderTop: "1px solid #e2e8f0"
                    }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setConfirmingBooking(null)}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.84rem" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        background: "#25d366",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.55rem 1.15rem",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(37, 211, 102, 0.35)"
                      }}
                    >
                      <span>Confirm &amp; Send WhatsApp</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Fleet Vehicles View */}
        {activeTab === "fleet" && (
          <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>ID</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Vehicle Name</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Category</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Seater</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Price / Hr</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Price / KM</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "700" }}>{c.id}</td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "600" }}>{c.name}</td>
                    <td style={{ padding: "0.85rem 1rem" }}><span className="badge badge-blue">{c.category}</span></td>
                    <td style={{ padding: "0.85rem 1rem" }}><strong>{c.seater}</strong> Seater</td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "700", color: "var(--primary-red)" }}>₹{c.hourlyPrice}/hr</td>
                    <td style={{ padding: "0.85rem 1rem" }}>₹{c.perKmPrice}/KM</td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => onEditCar && onEditCar(c)}
                          style={{ background: "#eff6ff", color: "#2563eb", padding: "0.35rem 0.65rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCar(c)}
                          style={{ background: "#fef2f2", color: "#dc2626", padding: "0.35rem 0.65rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enquiries View */}
        {(activeTab === "enquiries" || activeTab === "feedback") && (
          <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>ID</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Name</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Contact Phone</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Message / Query</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "feedback" ? feedbackRecords : enquiryRecords).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No {activeTab === "feedback" ? "feedback" : "enquiries"} have been submitted yet.
                    </td>
                  </tr>
                ) : (activeTab === "feedback" ? feedbackRecords : enquiryRecords).map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "700" }}>{e.id}</td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "600" }}>{e.name}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{e.phone}</td>
                    <td style={{ padding: "0.85rem 1rem" }}>{e.message}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)" }}>{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "offers" && (
          <form onSubmit={handleSaveOfferBanner} className="admin-offer-settings">
            <div className="admin-offer-settings-heading">
              <div>
                <span className="badge badge-red">Homepage banner</span>
                <h3>Festive Offer Strip</h3>
                <p>Manage the festive offer shown in the homepage strip and booking form.</p>
              </div>
              <label className="admin-offer-toggle">
                <input
                  type="checkbox"
                  checked={offerBanner.enabled}
                  onChange={(event) => setOfferBanner((current) => ({ ...current, enabled: event.target.checked }))}
                />
                <span>Show offer strip</span>
              </label>
            </div>
            <div className="admin-offer-fields">
              <label className="form-group">
                <span className="form-label">Offer title</span>
                <input className="form-input" maxLength={60} value={offerBanner.title} onChange={(event) => setOfferBanner((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. DIWALI SPECIAL" />
              </label>
              <label className="form-group">
                <span className="form-label">Offer text</span>
                <input className="form-input" maxLength={140} value={offerBanner.message} onChange={(event) => setOfferBanner((current) => ({ ...current, message: event.target.value }))} placeholder="Write a short festive offer message" />
              </label>
              <label className="form-group">
                <span className="form-label">Offer amount (₹ off)</span>
                <input className="form-input" type="number" min="0" step="1" value={offerBanner.amount ?? 0} onChange={(event) => setOfferBanner((current) => ({ ...current, amount: event.target.value }))} placeholder="e.g. 500" />
              </label>
              <label className="form-group">
                <span className="form-label">Promo code (optional)</span>
                <input className="form-input" maxLength={30} value={offerBanner.code} onChange={(event) => setOfferBanner((current) => ({ ...current, code: event.target.value }))} placeholder="Enter a promo code" />
              </label>
            </div>
            <div className="admin-offer-settings-footer">
              <span>Enabled offers appear in booking; promo codes apply the amount entered above.</span>
              <button type="submit" className="btn-primary"><Check size={16} /> Save Offer</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
