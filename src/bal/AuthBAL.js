import { apiRequest } from "../dal/apiClient";
import { dbFactory } from "../dal/DBFactory";

const SESSION_KEY = "PATRA_SESSION";

export class AuthBAL {
  static async login(username, password) {
    if (!username || !password) return { success: false, message: "Please enter both username and password." };
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password })
      });
      sessionStorage.setItem("PATRA_TOKEN", result.token);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...result.user, loginTime: new Date().toISOString() }));
      await dbFactory.getDriver().hydrateRemote(true);
      return { success: true, user: this.getCurrentUser(), message: "Login successful!" };
    } catch (error) {
      return { success: false, message: error.message || "Unable to sign in." };
    }
  }

  static getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  static async restoreSession() {
    if (!sessionStorage.getItem("PATRA_TOKEN")) return null;
    try {
      const result = await apiRequest("/api/auth/session");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      await dbFactory.getDriver().hydrateRemote(true);
      return result.user;
    } catch {
      this.logout();
      return null;
    }
  }

  static logout() {
    sessionStorage.removeItem("PATRA_TOKEN");
    sessionStorage.removeItem(SESSION_KEY);
    return true;
  }

  static async changePassword(_userId, currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) return { success: false, message: "All password fields are required." };
    if (newPassword !== confirmPassword) return { success: false, message: "New password and Confirm password do not match." };
    if (newPassword.length < 12) return { success: false, message: "New password must be at least 12 characters long." };
    try {
      const result = await apiRequest("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return { success: true, message: result.message };
    } catch (error) {
      return { success: false, message: error.message || "Password could not be changed." };
    }
  }
}
