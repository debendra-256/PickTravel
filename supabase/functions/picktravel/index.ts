import { createClient } from "npm:@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const publicCollections = new Set(["Cars", "Blogs", "Settings"]);
const privateCollections = new Set(["Bookings", "Enquiries", "Feedback"]);
const allowedOrigins = new Set([
  "https://debendra-256.github.io",
  "http://localhost:5173",
  "http://localhost:4173",
]);

async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const key = await scrypt(password, salt, 64) as Buffer;
  return { salt, hash: key.toString("hex") };
}

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function signToken(payload: Record<string, unknown>) {
  const secret = Deno.env.get("SESSION_SECRET");
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(request: Request) {
  const secret = Deno.env.get("SESSION_SECRET");
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

async function readJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) throw new Error("Request is too large.");
  return request.json();
}

function recordId(data: Record<string, unknown>) {
  return String(data?.id || `REC-${randomBytes(9).toString("hex")}`);
}

async function query<T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

async function handle(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) return json({ message: "Origin is not allowed." }, 403);
  const cors: HeadersInit = origin ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "Authorization,Content-Type",
    "access-control-max-age": "86400",
    vary: "Origin",
  } : {};
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  try {
    const url = new URL(request.url);
    const allSegments = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    const apiIndex = allSegments.indexOf("api");
    const [api, area, collection, id] = apiIndex >= 0 ? allSegments.slice(apiIndex) : [];
    if (api !== "api") return json({ ok: true, service: "PickTravel API" }, 200, cors);

    if (area === "auth" && collection === "login" && request.method === "POST") {
      const { userId, username, password = "" } = await readJson(request);
      const loginId = String(userId || username || "").trim();
      const stored = await query(
        supabase.from("app_admin_credentials").select("username,salt,password_hash").ilike("username", loginId).limit(1).maybeSingle(),
      );
      if (!stored) return json({ message: "Invalid username or password." }, 401, cors);
      const candidate = Buffer.from(await scrypt(String(password), stored.salt, 64) as Buffer);
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
      return admin
        ? json({ user: { id: admin.id, username: admin.username, role: admin.role } }, 200, cors)
        : json({ message: "Session expired." }, 401, cors);
    }
    if (area === "auth" && collection === "password" && request.method === "POST") {
      if (!admin) return json({ message: "Admin login required." }, 401, cors);
      const { currentPassword, newPassword } = await readJson(request);
      if (typeof newPassword !== "string" || newPassword.length < 12) return json({ message: "Use a password with at least 12 characters." }, 400, cors);
      const stored = await query(
        supabase.from("app_admin_credentials").select("username,salt,password_hash").eq("username", admin.username).maybeSingle(),
      );
      if (!stored) return json({ message: "Admin account not found." }, 404, cors);
      const candidate = Buffer.from(await scrypt(String(currentPassword), stored.salt, 64) as Buffer);
      const storedHash = Buffer.from(stored.password_hash, "hex");
      if (candidate.length !== storedHash.length || !timingSafeEqual(candidate, storedHash)) return json({ message: "Incorrect current password." }, 401, cors);
      const next = await hashPassword(newPassword);
      await query(supabase.from("app_admin_credentials").update({ salt: next.salt, password_hash: next.hash, updated_at: new Date().toISOString() }).eq("username", admin.username));
      return json({ success: true, message: "Password changed successfully." }, 200, cors);
    }

    if (area !== "records" || !collection) return json({ message: "Not found." }, 404, cors);
    const isPublicRead = publicCollections.has(collection);
    const isPublicWrite = request.method === "POST" && privateCollections.has(collection);
    if (!isPublicRead && !isPublicWrite && !admin) return json({ message: "Admin login required." }, 401, cors);

    if (request.method === "GET" && id) {
      const row = await query(supabase.from("app_records").select("data").eq("collection", collection).eq("id", id).maybeSingle());
      return row ? json(row.data, 200, cors) : json({ message: "Record not found." }, 404, cors);
    }
    if (request.method === "GET") {
      const rows = await query(supabase.from("app_records").select("data").eq("collection", collection).order("created_at", { ascending: false }));
      return json(rows.map((row) => row.data), 200, cors);
    }
    if (request.method === "POST") {
      const data = await readJson(request);
      if (collection === "Settings" && data?.enabled !== undefined) {
        const record = { ...data, id: "festive-offer", updatedAt: new Date().toISOString() };
        const row = await query(supabase.from("app_records").upsert({ collection: "Settings", id: "festive-offer", data: record, updated_at: new Date().toISOString() }, { onConflict: "collection,id" }).select("data").single());
        return json(row.data, 200, cors);
      }
      if (collection === "Bookings" && (!data.customerName || !data.customerPhone || !data.pickupLocation || !data.pickupDate)) return json({ message: "Booking details are incomplete." }, 400, cors);
      if ((collection === "Enquiries" || collection === "Feedback") && (!data.name || !data.phone)) return json({ message: "Name and phone are required." }, 400, cors);
      const record = { ...data, id: recordId(data), createdAt: new Date().toISOString() };
      const row = await query(supabase.from("app_records").insert({ collection, id: record.id, data: record }).select("data").single());
      return json(row.data, 201, cors);
    }
    if (request.method === "PATCH" && id) {
      const changes = await readJson(request);
      const existing = await query(supabase.from("app_records").select("data").eq("collection", collection).eq("id", id).maybeSingle());
      if (!existing) return json({ message: "Record not found." }, 404, cors);
      const merged = { ...existing.data, ...changes, updatedAt: new Date().toISOString() };
      const row = await query(supabase.from("app_records").update({ data: merged, updated_at: new Date().toISOString() }).eq("collection", collection).eq("id", id).select("data").single());
      return json(row.data, 200, cors);
    }
    if (request.method === "DELETE" && id) {
      const rows = await query(supabase.from("app_records").delete().eq("collection", collection).eq("id", id).select("id"));
      return json({ success: rows.length > 0 }, 200, cors);
    }
    return json({ message: "Method not allowed." }, 405, cors);
  } catch (error) {
    console.error("PickTravel API error:", error);
    return json({ message: "The request could not be completed." }, 500, cors);
  }
}

Deno.serve(handle);
