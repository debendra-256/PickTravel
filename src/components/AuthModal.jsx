import React, { useState } from "react";
import { AuthBAL } from "../bal/AuthBAL";
import { Lock, User, /* KeyRound, */ X, LogIn, CheckCircle2, ShieldAlert } from "lucide-react";
import { assetUrl } from "../config/assetUrl";

export function AuthModal({ isOpen, onClose, session, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("login");
  
  // Login State
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [alertMsg, setAlertMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setAlertMsg(null);
    setSubmitting(true);
    const res = await AuthBAL.login(userId, password);
    setSubmitting(false);

    if (res.success) {
      setAlertMsg({ type: "success", text: res.message });
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      }, 300);
    } else {
      setAlertMsg({ type: "error", text: res.message });
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setAlertMsg(null);

    const userId = session ? session.id : "USR-1";
    const res = await AuthBAL.changePassword(userId, currentPassword, newPassword, confirmPassword);

    if (res.success) {
      setAlertMsg({ type: "success", text: res.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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

        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img src={assetUrl("picklogo.png")} alt="Pick My Travel" style={{ height: "40px", objectFit: "contain" }} />
        </div>

        {/* Tab Headers: Login / Change Password */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid #f1f5f9", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
          <button
            className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <LogIn size={16} />
            <span>Admin Login</span>
          </button>

          {/* Change Password tab stays hidden; the handler and form below are kept so
              the entry point can be switched back on.
          <button
            className={`tab-btn ${activeTab === "changePassword" ? "active" : ""}`}
            onClick={() => setActiveTab("changePassword")}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <KeyRound size={16} />
            <span>Change Password</span>
          </button>
          */}
        </div>

        {alertMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              marginBottom: "1.25rem",
              background: alertMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: alertMsg.type === "success" ? "#065f46" : "#991b1b",
              border: alertMsg.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
              fontSize: "0.88rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {alertMsg.type === "success" ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} className="text-red" />
                <span>User ID</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Administrator User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={14} className="text-red" />
                <span>Password</span>
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: "0.5rem", justifyContent: "center" }}
              disabled={submitting}
            >
              {submitting && <span className="btn-spinner" aria-hidden="true" />}
              <span>{submitting ? "Signing in…" : "Authenticate & Login"}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Change Password Form */}
        {activeTab === "changePassword" && (
          <form onSubmit={handleChangePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter existing password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 12 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem", justifyContent: "center" }}>
              Update Password in Database
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
