import { apiRequest } from "../dal/apiClient";
import { dbFactory } from "../dal/DBFactory";

const SESSION_KEY = "PATRA_SESSION";

const LOCAL_SESSION_TOKEN = "local-session";

// Set VITE_ADMIN_USER_ID / VITE_ADMIN_PASSWORD in the gitignored .env.local to sign in
// against those credentials without the server. Never add them to the Pages workflow
// secrets: vite inlines VITE_* into the published bundle, making them public.
const LOCAL_ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID;
const LOCAL_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export class AuthBAL {
  static usesLocalAuth() {
    return Boolean(LOCAL_ADMIN_USER_ID && LOCAL_ADMIN_PASSWORD);
  }

  static async login(userId, password) {
    if (!userId || !password) return { success: false, message: "Please enter both User ID and password." };
    const localAuth = AuthBAL.usesLocalAuth();
    if (
      localAuth &&
      (userId.trim().toLowerCase() !== LOCAL_ADMIN_USER_ID.toLowerCase() || password !== LOCAL_ADMIN_PASSWORD)
    ) {
      return { success: false, message: "Invalid username or password." };
    }

    try {
      if (localAuth) {
        sessionStorage.setItem("PATRA_TOKEN", LOCAL_SESSION_TOKEN);
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            id: "admin",
            username: LOCAL_ADMIN_USER_ID,
            role: "Administrator",
            loginTime: new Date().toISOString()
          })
        );
      } else {
        const result = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ userId: userId.trim(), password })
        });
        sessionStorage.setItem("PATRA_TOKEN", result.token);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...result.user, loginTime: new Date().toISOString() }));
      }
      // Refreshing the tables must not gate the sign-in: the cached data renders right
      // away and the console updates when the background sync lands.
      void dbFactory.getDriver().hydrateRemote(true);
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
      if (AuthBAL.usesLocalAuth()) {
        const user = this.getCurrentUser();
        if (!user) return null;
        void dbFactory.getDriver().hydrateRemote(true);
        return user;
      }
      const result = await apiRequest("/api/auth/session");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      void dbFactory.getDriver().hydrateRemote(true);
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
