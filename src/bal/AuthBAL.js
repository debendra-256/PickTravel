import { dbFactory } from "../dal/DBFactory";

export class AuthBAL {
  static login(username, password) {
    if (!username || !password) {
      return { success: false, message: "Please enter both username and password." };
    }

    const driver = dbFactory.getDriver();
    const users = driver.findAll("Users");

    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (user) {
      const session = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        loginTime: new Date().toLocaleString()
      };
      sessionStorage.setItem("PATRA_SESSION", JSON.stringify(session));
      return { success: true, user: session, message: "Login successful!" };
    }

    return { success: false, message: "Invalid username or password. Default admin: admin / admin123" };
  }

  static getCurrentUser() {
    const raw = sessionStorage.getItem("PATRA_SESSION");
    return raw ? JSON.parse(raw) : null;
  }

  static logout() {
    sessionStorage.removeItem("PATRA_SESSION");
    return true;
  }

  static changePassword(userId, currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: "All password fields are required." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New password and Confirm password do not match." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    const driver = dbFactory.getDriver();
    const currentUser = driver.findById("Users", userId || "USR-1");

    if (!currentUser) {
      return { success: false, message: "User account not found." };
    }

    if (currentUser.password !== currentPassword) {
      return { success: false, message: "Incorrect current password." };
    }

    const updated = driver.update("Users", currentUser.id, { password: newPassword });
    if (updated) {
      return { success: true, message: "Password changed successfully! Please use new password next time." };
    }

    return { success: false, message: "Failed to update password in database." };
  }
}
