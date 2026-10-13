import { attachDatabasePool } from "@neon/functions";
import { Pool } from "pg";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { APP_CONFIG } from "../src/config/app.config.js";

const scrypt = promisify(scryptCallback);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);

const publicCollections = new Set(["Cars", "Blogs", "Settings"]);
const privateCollections = new Set(["Bookings", "Enquiries", "Feedback"]);
const allowedOrigins = new Set(
  [
    ...(process.env.ALLOWED_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean),
    "http://localhost:5173",
    "http://localhost:4173"
  ]
);
let databaseReady;

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const key = await scrypt(password, salt, 64);
  return { salt, hash: Buffer.from(key).toString("hex") };
}

async function ensureDatabase() {
  if (!databaseReady) {
    databaseReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_records (
          collection text NOT NULL,
          id text NOT NULL,
          data jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (collection, id)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_admin_credentials (
          username text PRIMARY KEY,
          salt text NOT NULL,
          password_hash text NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      const credential = await pool.query("SELECT username FROM app_admin_credentials LIMIT 1");
      if (!credential.rowCount) {
        const initialUsername = process.env.INITIAL_ADMIN_USERNAME;
        const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;
        if (!initialUsername || !initialPassword || !process.env.SESSION_SECRET) {
          throw new Error("Initial admin and session secrets are not configured.");
        }
        const password = await hashPassword(initialPassword);
        await pool.query(
          "INSERT INTO app_admin_credentials (username, salt, password_hash) VALUES ($1, $2, $3)",
          [initialUsername, password.salt, password.hash]
        );
      }
      const count = await pool.query("SELECT count(*)::int AS count FROM app_records WHERE collection = 'Cars'");
      if (!count.rows[0].count) {
        for (const car of APP_CONFIG.DEFAULT_CARS) {
          await pool.query(
            "INSERT INTO app_records (collection, id, data) VALUES ('Cars', $1, $2::jsonb) ON CONFLICT DO NOTHING",
            [String(car.id), JSON.stringify(car)]
          );
        }
      }
      await pool.query(
        "INSERT INTO app_records (collection, id, data) VALUES ('Settings', 'festive-offer', $1::jsonb) ON CONFLICT DO NOTHING",
        [JSON.stringify({ enabled: true, title: "DIWALI SPECIAL", message: "Make your festive visits easy with a comfortable ride", code: "", amount: 0 })]
      );
    })().catch((error) => {
      databaseReady = undefined;
      throw error;
    });
  }
  return databaseReady;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !process.env.SESSION_SECRET) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", process.env.SESSION_SECRET).update(body).digest();
  let actual;
  try { actual = Buffer.from(signature, "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}

async function readJson(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) throw new Error("Request is too large.");
  return request.json();
}

function recordId(data) {
  return String(data?.id || `REC-${randomBytes(9).toString("hex")}`);
}

async function handle(request) {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) return json({ message: "Origin is not allowed." }, 403);
  const cors = origin ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "Authorization,Content-Type",
    "access-control-max-age": "86400",
    vary: "Origin"
  } : {};
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  try {
    await ensureDatabase();
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    const [api, area, collection, id] = path;
    if (api !== "api") return json({ ok: true, service: "PickTravel API" }, 200, cors);

    if (area === "auth" && collection === "login" && request.method === "POST") {
      const { userId, username, password = "" } = await readJson(request);
      const loginId = String(userId || username || "").trim();
      const result = await pool.query("SELECT username, salt, password_hash FROM app_admin_credentials WHERE lower(username) = lower($1)", [loginId]);
      if (!result.rowCount) return json({ message: "Invalid username or password." }, 401, cors);
      const stored = result.rows[0];
      const candidate = Buffer.from(await scrypt(String(password), stored.salt, 64));
      const storedHash = Buffer.from(stored.password_hash, "hex");
      if (candidate.length !== storedHash.length || !timingSafeEqual(candidate, storedHash)) {
        return json({ message: "Invalid username or password." }, 401, cors);
      }
      const user = { id: "admin", username: stored.username, role: "Administrator" };
      const token = signToken({ ...user, exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 });
      return json({ token, user }, 200, cors);
    }

    const admin = verifyToken(request);
    if (area === "auth" && collection === "session" && request.method === "GET") {
      return admin ? json({ user: { id: admin.id, username: admin.username, role: admin.role } }, 200, cors) : json({ message: "Session expired." }, 401, cors);
    }
    if (area === "auth" && collection === "password" && request.method === "POST") {
      if (!admin) return json({ message: "Admin login required." }, 401, cors);
      const { currentPassword, newPassword } = await readJson(request);
      if (typeof newPassword !== "string" || newPassword.length < 12) return json({ message: "Use a password with at least 12 characters." }, 400, cors);
      const result = await pool.query("SELECT username, salt, password_hash FROM app_admin_credentials WHERE username = $1", [admin.username]);
      if (!result.rowCount) return json({ message: "Admin account not found." }, 404, cors);
      const stored = result.rows[0];
      const candidate = Buffer.from(await scrypt(String(currentPassword), stored.salt, 64));
      const storedHash = Buffer.from(stored.password_hash, "hex");
      if (candidate.length !== storedHash.length || !timingSafeEqual(candidate, storedHash)) return json({ message: "Incorrect current password." }, 401, cors);
      const next = await hashPassword(newPassword);
      await pool.query("UPDATE app_admin_credentials SET salt = $1, password_hash = $2, updated_at = now() WHERE username = $3", [next.salt, next.hash, admin.username]);
      return json({ success: true, message: "Password changed successfully." }, 200, cors);
    }

    if (area !== "records" || !collection) return json({ message: "Not found." }, 404, cors);
    const isPublicRead = publicCollections.has(collection);
    const isPublicWrite = request.method === "POST" && ["Bookings", "Enquiries", "Feedback"].includes(collection);
    if (!isPublicRead && !isPublicWrite && !admin) return json({ message: "Admin login required." }, 401, cors);

    if (request.method === "GET" && id) {
      const result = await pool.query("SELECT data FROM app_records WHERE collection = $1 AND id = $2", [collection, id]);
      return result.rowCount ? json(result.rows[0].data, 200, cors) : json({ message: "Record not found." }, 404, cors);
    }
    if (request.method === "GET") {
      const result = await pool.query("SELECT data FROM app_records WHERE collection = $1 ORDER BY created_at DESC", [collection]);
      return json(result.rows.map((row) => row.data), 200, cors);
    }
    if (request.method === "POST") {
      const data = await readJson(request);
      if (collection === "Settings" && data?.enabled !== undefined) {
        const record = { ...data, id: "festive-offer", updatedAt: new Date().toISOString() };
        const saved = await pool.query(
          "INSERT INTO app_records (collection, id, data) VALUES ('Settings', 'festive-offer', $1::jsonb) ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now() RETURNING data",
          [JSON.stringify(record)]
        );
        return json(saved.rows[0].data, 200, cors);
      }
      if (collection === "Bookings" && (!data.customerName || !data.customerPhone || !data.pickupLocation || !data.pickupDate)) return json({ message: "Booking details are incomplete." }, 400, cors);
      if ((collection === "Enquiries" || collection === "Feedback") && (!data.name || !data.phone)) return json({ message: "Name and phone are required." }, 400, cors);
      const record = { ...data, id: recordId(data), createdAt: new Date().toISOString() };
      const saved = await pool.query("INSERT INTO app_records (collection, id, data) VALUES ($1, $2, $3::jsonb) RETURNING data", [collection, record.id, JSON.stringify(record)]);
      return json(saved.rows[0].data, 201, cors);
    }
    if (request.method === "PATCH" && id) {
      const changes = await readJson(request);
      const result = await pool.query(
        "UPDATE app_records SET data = data || $3::jsonb, updated_at = now() WHERE collection = $1 AND id = $2 RETURNING data",
        [collection, id, JSON.stringify({ ...changes, updatedAt: new Date().toISOString() })]
      );
      return result.rowCount ? json(result.rows[0].data, 200, cors) : json({ message: "Record not found." }, 404, cors);
    }
    if (request.method === "DELETE" && id) {
      const result = await pool.query("DELETE FROM app_records WHERE collection = $1 AND id = $2", [collection, id]);
      return json({ success: result.rowCount > 0 }, 200, cors);
    }
    return json({ message: "Method not allowed." }, 405, cors);
  } catch (error) {
    console.error("PickTravel API error:", error);
    return json({ message: "The request could not be completed." }, 500, cors);
  }
}

export default { fetch: handle };
