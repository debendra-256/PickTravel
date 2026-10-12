/**
 * PickMyTravels API - Google Sheets backend.
 * This spreadsheet IS the database: every collection (Cars, Blogs, Settings,
 * Bookings, Enquiries, Feedback) is stored in a tab of this spreadsheet, one
 * record per row. Primitive record fields are flattened into their own columns
 * for readability; the full JSON document is kept in the data_json column, which
 * is what the API actually reads.
 *
 * SETUP
 * 1. Create a new Google Spreadsheet, then open Extensions > Apps Script in it.
 * 2. Delete the default code and paste this entire file.
 * 3. Project Settings > Script Properties - add:
 *      SESSION_SECRET            long random string used to sign admin session tokens
 *      INITIAL_ADMIN_USERNAME    admin login id (used only to create the login on first run)
 *      INITIAL_ADMIN_PASSWORD    admin password (used only to create the login on first run)
 * 4. Deploy > New deployment > Web app: Execute as = Me, Access = Anyone.
 * 5. Copy the web app URL (ends in /exec) into VITE_SHEETS_API_URL in the site's
 *    .env.local (local dev) and GitHub Actions secret (Pages builds).
 *
 * Change the admin password from the site's Admin Panel after signing in.
 */

var PUBLIC_READ = ["Cars", "Blogs", "Settings"];
var PUBLIC_WRITE = ["Bookings", "Enquiries", "Feedback"];
var AUTH_SHEET = "_auth";
var TOKEN_TTL_SECONDS = 8 * 60 * 60;
var LOCK_TIMEOUT_MS = 30000;

function doGet(e) {
  return handle_(e, "GET");
}

function doPost(e) {
  return handle_(e, (e.parameter._method || "POST").toUpperCase());
}

function handle_(e, method) {
  try {
    ensureSeeded_();
    var path = String((e.parameter && e.parameter.path) || "/").replace(/^\/+|\/+$/g, "");
    var parts = path.split("/").filter(Boolean);
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;
    var token = String((e.parameter && e.parameter.token) || "");

    if (!parts.length || parts[0] !== "api") {
      return json_({ ok: true, service: "PickTravel Sheets API" });
    }

    var area = parts[1];
    var collection = parts[2];
    var id = parts[3];

    if (area === "auth") {
      return routeAuth_(method, collection, body, token);
    }
    if (area !== "records" || !collection) {
      return error_("Not found.");
    }

    var admin = verifyToken_(token);
    var isPublicRead = PUBLIC_READ.indexOf(collection) !== -1;
    var isPublicWrite = method === "POST" && PUBLIC_WRITE.indexOf(collection) !== -1;
    if (!isPublicRead && !isPublicWrite && !admin) {
      return error_("Admin login required.");
    }

    if (method === "GET" && id) {
      var match = null;
      readRecords_(collection).forEach(function (record) {
        if (String(record.id) === String(id)) match = record;
      });
      return match ? json_(match) : error_("Record not found.");
    }
    if (method === "GET") {
      return json_(readRecords_(collection));
    }
    if (method === "POST") {
      return withLock_(function () { return insertRecord_(collection, body); });
    }
    if (method === "PATCH" && id) {
      return withLock_(function () { return patchRecord_(collection, id, body); });
    }
    if (method === "DELETE" && id) {
      return withLock_(function () { return deleteRecord_(collection, id); });
    }
    return error_("Method not allowed.");
  } catch (err) {
    return error_(err && err.message ? err.message : "The request could not be completed.");
  }
}

/***** Auth *****/

function routeAuth_(method, action, body, token) {
  if (action === "login" && method === "POST") {
    ensureAdmin_();
    var loginId = String(body && (body.userId || body.username) || "").trim();
    var row = findAdmin_(loginId);
    if (!row || hashPassword_(String((body && body.password) || ""), row.salt) !== row.passwordHash) {
      return error_("Invalid username or password.");
    }
    var user = { id: "admin", username: row.username, role: "Administrator" };
    return json_({ token: signToken_(user), user: user });
  }
  if (action === "session" && method === "GET") {
    var admin = verifyToken_(token);
    return admin
      ? json_({ user: { id: admin.id, username: admin.username, role: admin.role } })
      : error_("Session expired.");
  }
  if (action === "password" && method === "POST") {
    var current = verifyToken_(token);
    if (!current) return error_("Admin login required.");
    var newPassword = body && body.newPassword;
    if (typeof newPassword !== "string" || newPassword.length < 12) {
      return error_("Use a password with at least 12 characters.");
    }
    var existing = findAdmin_(current.username);
    if (!existing) return error_("Admin account not found.");
    if (hashPassword_(String((body && body.currentPassword) || ""), existing.salt) !== existing.passwordHash) {
      return error_("Incorrect current password.");
    }
    var salt = randomHex_(16);
    withLock_(function () {
      writeAdmin_(existing.username, salt, hashPassword_(newPassword, salt));
    });
    return json_({ success: true, message: "Password changed successfully." });
  }
  return error_("Not found.");
}

function ensureAdmin_() {
  var sheet = ensureSheet_(AUTH_SHEET);
  if (sheet.getLastRow() >= 2) return;
  var props = PropertiesService.getScriptProperties();
  var username = props.getProperty("INITIAL_ADMIN_USERNAME");
  var password = props.getProperty("INITIAL_ADMIN_PASSWORD");
  if (!username || !password) {
    throw new Error("Admin credentials are not configured. Set INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD in Script Properties.");
  }
  if (!props.getProperty("SESSION_SECRET")) {
    throw new Error("SESSION_SECRET is not configured in Script Properties.");
  }
  var salt = randomHex_(16);
  sheet.appendRow([username, salt, hashPassword_(password, salt)]);
}

function findAdmin_(loginId) {
  var sheet = getSheet_(AUTH_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === String(loginId).toLowerCase()) {
      return { username: String(rows[i][0]), salt: String(rows[i][1]), passwordHash: String(rows[i][2]) };
    }
  }
  return null;
}

function writeAdmin_(username, salt, passwordHash) {
  var sheet = ensureSheet_(AUTH_SHEET);
  var existingRow = findAdminRow_(username);
  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, 3).setValues([[username, salt, passwordHash]]);
  } else {
    sheet.appendRow([username, salt, passwordHash]);
  }
}

function findAdminRow_(loginId) {
  var sheet = getSheet_(AUTH_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return -1;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase() === String(loginId).toLowerCase()) return i + 2;
  }
  return -1;
}

function signToken_(user) {
  var payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  };
  var body = base64UrlEncode_(JSON.stringify(payload));
  var secret = PropertiesService.getScriptProperties().getProperty("SESSION_SECRET");
  return body + "." + base64UrlEncode_(computeHmac_(body, secret));
}

function verifyToken_(token) {
  if (!token) return null;
  var dot = token.indexOf(".");
  if (dot <= 0) return null;
  var body = token.substring(0, dot);
  var signature = token.substring(dot + 1);
  var secret = PropertiesService.getScriptProperties().getProperty("SESSION_SECRET");
  if (!secret) return null;
  if (signature !== base64UrlEncode_(computeHmac_(body, secret))) return null;
  try {
    var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(body)).getDataAsString());
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch (err) {
    return null;
  }
}

function computeHmac_(value, secret) {
  return Utilities.computeHmacSha256Signature(value, secret);
}

function base64UrlEncode_(value) {
  var bytes = typeof value === "string"
    ? Utilities.newBlob(value).getBytes()
    : value;
  return Utilities.base64EncodeWebSafe(bytes);
}

function hashPassword_(password, salt) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ":" + password, Utilities.Charset.UTF_8);
  for (var i = 0; i < 5000; i++) {
    digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digest);
  }
  return digest.map(function (byte) {
    return (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0");
  }).join("");
}

function randomHex_(byteCount) {
  var hex = "";
  while (hex.length < byteCount * 2) {
    hex += Utilities.getUuid().replace(/-/g, "");
  }
  return hex.substring(0, byteCount * 2);
}

/***** Records *****/

function insertRecord_(collection, body) {
  if (!body || typeof body !== "object") return error_("Request body is required.");
  if (collection === "Settings" && body.enabled !== undefined) {
    return json_(upsertSettings_(body));
  }
  if (collection === "Bookings" && (!body.customerName || !body.customerPhone || !body.pickupLocation || !body.pickupDate)) {
    return error_("Booking details are incomplete.");
  }
  if ((collection === "Enquiries" || collection === "Feedback") && (!body.name || !body.phone)) {
    return error_("Name and phone are required.");
  }
  var now = new Date().toISOString();
  var record = Object.assign({}, body, {
    id: body.id ? String(body.id) : "REC-" + randomHex_(9),
    createdAt: now,
    updatedAt: now
  });
  var sheet = ensureSheet_(collection);
  writeRecord_(collection, record, findRecordRow_(sheet, record.id));
  return json_(record);
}

function patchRecord_(collection, id, changes) {
  var sheet = ensureSheet_(collection);
  var rowIndex = findRecordRow_(sheet, id);
  if (rowIndex < 0) return error_("Record not found.");
  var existing = JSON.parse(String(sheet.getRange(rowIndex, jsonColumnIndex_(sheet)).getValue()));
  var merged = Object.assign({}, existing, changes, {
    id: existing.id,
    updatedAt: new Date().toISOString()
  });
  writeRecord_(collection, merged, rowIndex);
  return json_(merged);
}

function deleteRecord_(collection, id) {
  var sheet = getSheet_(collection);
  var rowIndex = sheet ? findRecordRow_(sheet, id) : -1;
  if (rowIndex < 0) return json_({ success: false });
  sheet.deleteRow(rowIndex);
  return json_({ success: true });
}

function upsertSettings_(data) {
  var sheet = ensureSheet_("Settings");
  var rowIndex = findRecordRow_(sheet, "festive-offer");
  var existing = rowIndex > 0 ? JSON.parse(String(sheet.getRange(rowIndex, jsonColumnIndex_(sheet)).getValue())) : {};
  var now = new Date().toISOString();
  var record = Object.assign({}, existing, data, {
    id: "festive-offer",
    createdAt: existing.createdAt || now,
    updatedAt: now
  });
  writeRecord_("Settings", record, rowIndex);
  return record;
}

/***** Spreadsheet storage *****/

function ensureSheet_(name) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetHeaders_(sheet) {
  if (sheet.getLastRow() === 0) return null;
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function jsonColumnIndex_(sheet) {
  var headers = sheetHeaders_(sheet) || [];
  var index = headers.indexOf("data_json");
  if (index === -1) throw new Error('Sheet "' + sheet.getName() + '" is missing its data_json column.');
  return index + 1;
}

function readRecords_(collection) {
  var sheet = getSheet_(collection);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var headers = sheetHeaders_(sheet);
  var jsonCol = headers.indexOf("data_json");
  if (jsonCol === -1) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  var records = [];
  for (var i = 0; i < values.length; i++) {
    var cell = values[i][jsonCol];
    if (cell) {
      try { records.push(JSON.parse(cell)); } catch (err) { /* skip malformed rows */ }
    }
  }
  return records;
}

function findRecordRow_(sheet, id) {
  if (sheet.getLastRow() < 2) return -1;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function flattenedKeys_(record) {
  return Object.keys(record)
    .filter(function (key) { return ["id", "createdAt", "updatedAt"].indexOf(key) === -1; })
    .filter(function (key) {
      var value = record[key];
      return value === null || ["string", "number", "boolean"].indexOf(typeof value) !== -1;
    })
    .sort();
}

function writeRecord_(collection, record, rowIndex) {
  var sheet = ensureSheet_(collection);
  var headers = sheetHeaders_(sheet);
  if (!headers || headers.length < 4 || headers[0] !== "id" || headers.indexOf("data_json") === -1) {
    headers = ["id", "created_at", "updated_at", "data_json"];
  }
  flattenedKeys_(record).forEach(function (key) {
    if (headers.indexOf(key) === -1) headers.splice(headers.length - 1, 0, key);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  var row = [
    String(record.id),
    record.createdAt || new Date().toISOString(),
    record.updatedAt || new Date().toISOString()
  ];
  for (var i = 3; i < headers.length - 1; i++) {
    var value = record[headers[i]];
    row.push(value === null || value === undefined ? "" : value);
  }
  row.push(JSON.stringify(record));

  if (rowIndex && rowIndex > 1) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

/***** Seeding *****/

function ensureSeeded_() {
  var carsSheet = getSheet_("Cars");
  if (!carsSheet || carsSheet.getLastRow() < 2) {
    withLock_(function () {
      DEFAULT_CARS.forEach(function (car) {
        var now = new Date().toISOString();
        writeRecord_("Cars", Object.assign({}, car, { createdAt: now, updatedAt: now }));
      });
    });
  }
  var settingsSheet = ensureSheet_("Settings");
  if (findRecordRow_(settingsSheet, "festive-offer") < 0) {
    withLock_(function () {
      var now = new Date().toISOString();
      writeRecord_("Settings", {
        id: "festive-offer",
        enabled: true,
        title: "DIWALI SPECIAL",
        message: "Make your festive visits easy with a comfortable ride",
        code: "",
        amount: 0,
        createdAt: now,
        updatedAt: now
      });
    });
  }
}

/***** Helpers *****/

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_TIMEOUT_MS);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function error_(message) {
  return json_({ ok: false, message: message });
}

var DEFAULT_CARS = [
  {
    id: "CAR-101",
    name: "Swift Dzire / Etios",
    category: "Sedan",
    seater: 4,
    hourlyPrice: 250,
    perKmPrice: 12,
    fourHours40Km: 1600,
    eightHours80Km: 2200,
    tenHours100Km: 2500,
    extraHour: 120,
    extraKm: 13,
    ac: true,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
    features: ["Air Conditioner", "Music System", "Clean Interiors", "24/7 Support"]
  },
  {
    id: "CAR-102",
    name: "Ertiga / Triber",
    category: "Compact SUV",
    seater: 6,
    hourlyPrice: 350,
    perKmPrice: 16,
    fourHours40Km: 2500,
    eightHours80Km: 3000,
    tenHours100Km: 3500,
    extraHour: 150,
    extraKm: 15,
    ac: true,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
    features: ["Spacious Seating", "AC Front & Rear", "Comfortable Legs", "Luggage Carrier"]
  },
  {
    id: "CAR-103",
    name: "Innova Crysta",
    category: "Luxury SUV",
    seater: 7,
    hourlyPrice: 500,
    perKmPrice: 22,
    fourHours40Km: 3500,
    eightHours80Km: 4000,
    tenHours100Km: 4500,
    extraHour: 200,
    extraKm: 20,
    ac: true,
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80",
    features: ["Premium Leather Seats", "Dual AC", "Push Back Seats", "Experienced Driver"]
  },
  {
    id: "CAR-104",
    name: "Force Tempo Traveller",
    category: "Mini Van",
    seater: 12,
    hourlyPrice: 750,
    perKmPrice: 28,
    ac: true,
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80",
    features: ["High Roof", "Reclining Seats", "LED Screen & Stereo", "Ample Boot Space"]
  },
  {
    id: "CAR-105",
    name: "Luxury Urbania",
    category: "Executive Van",
    seater: 17,
    hourlyPrice: 1100,
    perKmPrice: 38,
    fourHours40Km: null,
    eightHours80Km: 12000,
    tenHours100Km: 13000,
    extraHour: 500,
    extraKm: 65,
    ac: true,
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop&q=80",
    features: ["Recliner Leather Seats", "Mood Lighting", "Individual USB Ports", "Super Smooth Ride"]
  },
  {
    id: "CAR-106",
    name: "Audi A6 / Mercedes E-Class",
    category: "VIP Luxury",
    seater: 4,
    hourlyPrice: 1500,
    perKmPrice: 65,
    ac: true,
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80",
    features: ["VIP Chauffeur", "Panoramic Sunroof", "Bottled Water & Snacks", "Chilled AC"]
  },
  {
    id: "CAR-107",
    name: "Mini Bus / Coach",
    category: "Bus",
    seater: 26,
    hourlyPrice: 1400,
    perKmPrice: 45,
    ac: true,
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
    features: ["Ideal for Group Tours", "Sound System", "Air Suspension", "Experienced Driver"]
  },
  {
    id: "CAR-108",
    name: "Deluxe Coach Bus",
    category: "Bus",
    seater: 44,
    hourlyPrice: 2200,
    perKmPrice: 65,
    ac: true,
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80",
    features: ["44 Luxury Pushback Seats", "PA System", "Wide Windows", "Wedding / Tour Special"]
  }
];
