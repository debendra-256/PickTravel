/**
 * Dev-only stand-in for the Google Apps Script web app (google-apps-script/Code.gs).
 * Implements the same request contract (path/_method/token query parameters,
 * text/plain JSON bodies, { ok: false, message } error envelopes) over in-memory
 * Maps, so the GOOGLE_SHEETS driver can be exercised without deploying.
 *
 * Usage: node scripts/sheets-dev-mock.mjs   (listens on http://localhost:8787)
 * Then set VITE_SHEETS_API_URL=http://localhost:8787 in .env.local and run npm run dev.
 * Admin login: admin / demo-password-123
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 8787);
const TOKEN_TTL_SECONDS = 8 * 60 * 60;

const PUBLIC_READ = new Set(["Cars", "Blogs", "Settings"]);
const PUBLIC_WRITE = new Set(["Bookings", "Enquiries", "Feedback"]);

const sheets = new Map(); // collection -> Map(id -> record)
const admins = [{ username: "admin", salt: "mock", passwordHash: "demo-password-123" }];
const sessions = new Map(); // token -> { user, exp }

function sheet(collection) {
  if (!sheets.has(collection)) sheets.set(collection, new Map());
  return sheets.get(collection);
}

function seed() {
  const now = new Date().toISOString();
  sheet("Cars").set("CAR-901", {
    id: "CAR-901", name: "Mock Sheet Sedan", category: "Sedan", seater: 4, perKmPrice: 11,
    fourHours40Km: 1500, eightHours80Km: 2100, tenHours100Km: 2400, extraHour: 110, extraKm: 12, ac: true,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
    features: ["Air Conditioner", "Music System"], createdAt: now, updatedAt: now
  });
  sheet("Cars").set("CAR-902", {
    id: "CAR-902", name: "Mock Sheet Innova", category: "Luxury SUV", seater: 7, perKmPrice: 21,
    fourHours40Km: 3400, eightHours80Km: 3900, tenHours100Km: 4400, extraHour: 190, extraKm: 19, ac: true,
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80",
    features: ["Dual AC", "Push Back Seats"], createdAt: now, updatedAt: now
  });
  sheet("Settings").set("festive-offer", {
    id: "festive-offer", enabled: true, title: "MOCK SHEET OFFER",
    message: "Served from the mock Sheets backend", code: "", amount: 0, createdAt: now, updatedAt: now
  });
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*"
  });
  res.end(body);
}

const errorEnvelope = (res, message) => json(res, 200, { ok: false, message });

function signToken(user) {
  const token = `mock.${randomUUID()}.${randomUUID()}`;
  sessions.set(token, { user, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS });
  return token;
}

function verifyToken(token) {
  const session = sessions.get(token);
  return session && session.exp > Math.floor(Date.now() / 1000) ? session.user : null;
}

function routeAuth(res, method, action, body, token) {
  if (action === "login" && method === "POST") {
    const loginId = String((body && (body.userId || body.username)) || "").trim();
    const admin = admins.find((row) => row.username.toLowerCase() === loginId.toLowerCase());
    if (!admin || admin.passwordHash !== String((body && body.password) || "")) {
      return errorEnvelope(res, "Invalid username or password.");
    }
    const user = { id: "admin", username: admin.username, role: "Administrator" };
    return json(res, 200, { token: signToken(user), user });
  }
  if (action === "session" && method === "GET") {
    const admin = verifyToken(token);
    return admin
      ? json(res, 200, { user: { id: admin.id, username: admin.username, role: admin.role } })
      : errorEnvelope(res, "Session expired.");
  }
  if (action === "password" && method === "POST") {
    const admin = verifyToken(token);
    if (!admin) return errorEnvelope(res, "Admin login required.");
    const newPassword = body && body.newPassword;
    if (typeof newPassword !== "string" || newPassword.length < 12) {
      return errorEnvelope(res, "Use a password with at least 12 characters.");
    }
    const row = admins.find((entry) => entry.username === admin.username);
    if (row.passwordHash !== String((body && body.currentPassword) || "")) {
      return errorEnvelope(res, "Incorrect current password.");
    }
    row.passwordHash = newPassword;
    return json(res, 200, { success: true, message: "Password changed successfully." });
  }
  return errorEnvelope(res, "Not found.");
}

function insertRecord(res, collection, body) {
  if (!body || typeof body !== "object") return errorEnvelope(res, "Request body is required.");
  if (collection === "Settings" && body.enabled !== undefined) {
    const record = { ...sheet("Settings").get("festive-offer"), ...body, id: "festive-offer", updatedAt: new Date().toISOString() };
    sheet("Settings").set("festive-offer", record);
    return json(res, 200, record);
  }
  if (collection === "Bookings" && (!body.customerName || !body.customerPhone || !body.pickupLocation || !body.pickupDate)) {
    return errorEnvelope(res, "Booking details are incomplete.");
  }
  if ((collection === "Enquiries" || collection === "Feedback") && (!body.name || !body.phone)) {
    return errorEnvelope(res, "Name and phone are required.");
  }
  const now = new Date().toISOString();
  const record = { ...body, id: body.id ? String(body.id) : `REC-${randomUUID().replace(/-/g, "").slice(0, 18)}`, createdAt: now, updatedAt: now };
  sheet(collection).set(record.id, record);
  return json(res, 200, record);
}

function handle(res, method, path, body, token) {
  const parts = path.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (!parts.length || parts[0] !== "api") return json(res, 200, { ok: true, service: "PickTravel mock Sheets API" });

  const [, area, collection, id] = parts;
  if (area === "auth") return routeAuth(res, method, collection, body, token);
  if (area !== "records" || !collection) return errorEnvelope(res, "Not found.");

  const admin = verifyToken(token);
  const isPublicRead = PUBLIC_READ.has(collection);
  const isPublicWrite = method === "POST" && PUBLIC_WRITE.has(collection);
  if (!isPublicRead && !isPublicWrite && !admin) return errorEnvelope(res, "Admin login required.");

  const records = [...sheet(collection).values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (method === "GET" && id) {
    const record = sheet(collection).get(String(id));
    return record ? json(res, 200, record) : errorEnvelope(res, "Record not found.");
  }
  if (method === "GET") return json(res, 200, records);
  if (method === "POST") return insertRecord(res, collection, body);
  if (method === "PATCH" && id) {
    const existing = sheet(collection).get(String(id));
    if (!existing) return errorEnvelope(res, "Record not found.");
    const merged = { ...existing, ...body, id: existing.id, updatedAt: new Date().toISOString() };
    sheet(collection).set(existing.id, merged);
    return json(res, 200, merged);
  }
  if (method === "DELETE" && id) {
    const removed = sheet(collection).delete(String(id));
    return json(res, 200, { success: removed });
  }
  return errorEnvelope(res, "Method not allowed.");
}

seed();

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = (url.searchParams.get("_method") || req.method || "GET").toUpperCase();
  const path = url.searchParams.get("path") || "/";
  const token = url.searchParams.get("token") || "";
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; });
  req.on("end", () => {
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { /* leave body null */ }
    try {
      handle(res, method, path, body, token);
    } catch (err) {
      errorEnvelope(res, err && err.message ? err.message : "The request could not be completed.");
    }
  });
}).listen(PORT, () => {
  console.log(`[mock-sheets] PickTravel mock Sheets API on http://localhost:${PORT} (admin / demo-password-123)`);
});
