import React from "react";
import { APP_CONFIG } from "../config/app.config";
import { Phone, Mail, MapPin, MessageSquare, ShieldCheck, CreditCard } from "lucide-react";

export function Footer({ setActiveTab, onOpenAuthModal, onOpenFeedback, showFeedback = true }) {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Bio */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <img className="site-logo-image" src="/picklogo.png" alt={APP_CONFIG.COMPANY_NAME} style={{ height: "42px", objectFit: "contain" }} />
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "1.25rem", lineHeight: "1.6" }}>
              Pick My Travel is Odisha's premier car rental agency providing reliable outstation cabs, local city sightseeing, airport pickups, and luxury tempo travellers.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge-red">Govt. Approved</span>
              <span className="badge badge-green">24/7 Road Support</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}>Home Portal</a></li>
              <li><a href="#fleet" onClick={(e) => { e.preventDefault(); setActiveTab("fleet"); }}>Vehicle Fleet & Rates</a></li>
              <li><a href="#blogs" onClick={(e) => { e.preventDefault(); setActiveTab("blogs"); }}>Travel Blogs</a></li>
              {showFeedback && <li><a href="#feedback" onClick={(e) => { e.preventDefault(); onOpenFeedback(); }}>Share Feedback</a></li>}
              <li><a href="#login" onClick={(e) => { e.preventDefault(); onOpenAuthModal(); }}>Admin / Staff Login</a></li>
            </ul>
          </div>

          {/* Col 3: Taxi Services */}
          <div>
            <h4 className="footer-col-title">Taxi Services</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}>Local City Trip (8h/80km)</a></li>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}>One Way Outstation Cab</a></li>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}>Puri & Konark Taxi Package</a></li>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}>Bhubaneswar Airport Transfer</a></li>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}>Wedding Fleet Rental</a></li>
            </ul>
          </div>

          {/* Col 4: Registered Office Contact */}
          <div>
            <h4 className="footer-col-title">Registered Office</h4>
            <div className="footer-contact-item">
              <MapPin size={18} style={{ color: "var(--primary-red)", flexShrink: 0, marginTop: "3px" }} />
              <span style={{ fontSize: "0.85rem" }}>{APP_CONFIG.ADDRESS}</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={16} style={{ color: "var(--primary-red)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.85rem" }}>Toll-Free: {APP_CONFIG.TOLL_FREE}</span>
            </div>
            <div className="footer-contact-item">
              <MessageSquare size={16} style={{ color: "#25d366", flexShrink: 0 }} />
              <span style={{ fontSize: "0.85rem" }}>WhatsApp: {APP_CONFIG.DISPLAY_WHATSAPP}</span>
            </div>
            <div className="footer-contact-item">
              <Mail size={16} style={{ color: "var(--primary-red)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.85rem" }}>{APP_CONFIG.EMAIL}</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © 2026 {APP_CONFIG.COMPANY_NAME}. All rights reserved.
          </div>
          <div className="footer-payment">
            <img className="footer-payment-qr" src="/payment-qr.png" alt="Scan to pay with PhonePe" />
            <div className="footer-payment-copy">
              <span className="footer-payment-label"><CreditCard size={16} /> Easy, secure payments</span>
              <span className="footer-payment-methods">We accept UPI, Credit Cards, NetBanking, Cash.</span>
              <span className="footer-payment-scan">Scan to pay with PhonePe</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
