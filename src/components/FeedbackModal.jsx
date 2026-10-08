import React, { useEffect, useState } from "react";
import { EnquiryBAL } from "../bal/EnquiryBAL";
import { MessageSquare, Send, X } from "lucide-react";
import { assetUrl } from "../config/assetUrl";

export function FeedbackModal({ isOpen, onClose, mode = "feedback" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("General Enquiry");
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAlertMsg(null);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      setType("General Enquiry");
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg(null);

    const isFeedback = mode === "feedback";
    const res = await EnquiryBAL.submitEnquiry({
      name,
      phone,
      email,
      message,
      type: isFeedback ? "Feedback" : type
    });

    if (res.success) {
      let whatsappOpened = false;
      if (!isFeedback && res.whatsappUrl) {
        const whatsappWindow = window.open(res.whatsappUrl, "_blank");
        if (whatsappWindow) {
          whatsappWindow.opener = null;
          whatsappOpened = true;
        }
      }

      setAlertMsg({
        type: "success",
        text: isFeedback
          ? "Feedback saved successfully. Thank you for sharing it with us."
          : `Enquiry saved successfully.${whatsappOpened ? " WhatsApp opened with a notification for the admin; tap Send in WhatsApp to deliver it." : " Open WhatsApp to send the notification to the admin."}`,
        whatsappUrl: !isFeedback && !whatsappOpened ? res.whatsappUrl : null
      });
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } else {
      setAlertMsg({ type: "error", text: res.message });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <img src={assetUrl("picklogo.png")} alt="Pick My Travel" style={{ height: "36px", objectFit: "contain" }} />
          <div>
            <h3 style={{ fontSize: "1.3rem" }}>{mode === "feedback" ? "Share Feedback" : "Quick Enquiry"}</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {mode === "feedback" ? "We value your feedback about your experience." : "Tell us what you need and our team will get back to you."}
            </p>
          </div>
        </div>

        {alertMsg && (
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "8px",
              marginBottom: "1.25rem",
              background: alertMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: alertMsg.type === "success" ? "#065f46" : "#991b1b",
              border: alertMsg.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
              fontSize: "0.88rem",
              fontWeight: "600"
            }}
          >
            <div>{alertMsg.text}</div>
            {alertMsg.whatsappUrl && (
              <a
                href={alertMsg.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginTop: "0.75rem",
                  background: "#25d366",
                  color: "white",
                  padding: "0.45rem 1rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "700"
                }}
              >
                <MessageSquare size={14} />
                <span>Send Enquiry to Admin on WhatsApp</span>
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {mode === "enquiry" && (
            <div className="form-group">
              <label className="form-label">Enquiry Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="General Enquiry">General Taxi Enquiry</option>
                <option value="Custom Tour Request">Custom Tour / Outstation Cab Request</option>
                <option value="Corporate / Wedding Booking">Corporate / Wedding Booking</option>
              </select>
            </div>
          )}

          <div className="feedback-form-contact-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-Digit Mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="form-input"
              placeholder="sales@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{mode === "feedback" ? "Your Feedback *" : "Your Enquiry *"}</label>
            <textarea
              className="form-input"
              rows="4"
              placeholder={mode === "feedback" ? "Tell us about your experience..." : "Tell us about your trip requirements or itinerary..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn-primary">
              <Send size={15} />
              {mode === "feedback" ? "Submit Feedback" : "Submit Enquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
