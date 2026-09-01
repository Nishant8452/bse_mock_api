// ============================================================================
// Mock BSE Trade API Server with Real-Time Database Synchronization
// ============================================================================
// This server provides real-time access to BSE (Bombay Stock Exchange) trades.
// 1. Reads trade data from MySQL database (fallback to CSV).
// 2. Continuous real-time DB change detection: automatically polls MySQL every 1s
//    and pushes live updates to all connected browser clients via SSE when any
//    new data is inserted into the database.
// 3. REST endpoint (POST /api/trades) to insert new trades via API with instant push.
// 4. Server-Sent Events (SSE) stream for zero-polling real-time sync with frontend.
// ============================================================================

import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";

// Helper to get current directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// 1. CONFIGURATION & CONSTANTS
// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 7777;
const DB_URL = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/trades_db";
const CSV_PATH = path.resolve(__dirname, "../bse_mock_trades_2000.csv");

// Initialize MySQL Connection Pool for high-performance non-blocking queries
const dbUrlParsed = new URL(DB_URL);
const pool = mysql.createPool({
  host: dbUrlParsed.hostname || "localhost",
  port: parseInt(dbUrlParsed.port || "3306", 10),
  user: dbUrlParsed.username || "root",
  password: dbUrlParsed.password || "root",
  database: dbUrlParsed.pathname.replace(/^\//, "") || "trades_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ----------------------------------------------------------------------------
// 2. INITIALIZE EXPRESS APP & MIDDLEWARE
// ----------------------------------------------------------------------------
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ----------------------------------------------------------------------------
// 3. REAL-TIME SERVER-SENT EVENTS (SSE)
// ----------------------------------------------------------------------------
const sseClients = new Set();

/**
 * Sends a message to all connected browsers via SSE.
 * @param {string} eventType - The name of the event (e.g. "trades_updated", "trade_pull_completed")
 * @param {object} payload - The data to send with the event
 */
function broadcastEvent(eventType, payload) {
  const eventData = JSON.stringify({
    type: eventType,
    timestamp: new Date().toISOString(),
    ...payload,
  });

  const message = `event: ${eventType}\ndata: ${eventData}\n\n`;

  for (const clientResponse of sseClients) {
    try {
      clientResponse.write(message);
    } catch {
      sseClients.delete(clientResponse);
    }
  }
}

// ----------------------------------------------------------------------------
// 4. HELPER FUNCTIONS FOR DATA FORMATTING & CSV
// ----------------------------------------------------------------------------

function parseDelay(rawDelay) {
  if (rawDelay === undefined || rawDelay === null || rawDelay === "") {
    return { delayMs: 0, description: "0s (immediate)" };
  }

  const delayStr = rawDelay.toString().trim().toLowerCase();

  if (delayStr.endsWith("s") && !delayStr.endsWith("ms")) {
    const seconds = parseFloat(delayStr);
    const delayMs = seconds * 1000;
    return { delayMs, description: `${seconds} second(s)` };
  }

  if (delayStr.endsWith("ms")) {
    const delayMs = parseFloat(delayStr);
    return { delayMs, description: `${delayMs} ms` };
  }

  const minutes = parseFloat(delayStr);
  if (!isNaN(minutes) && minutes > 0) {
    const delayMs = minutes * 60 * 1000;
    const totalSeconds = (delayMs / 1000).toFixed(0);
    return { delayMs, description: `${minutes} minute(s) (${totalSeconds}s)` };
  }

  return { delayMs: 0, description: "0s (immediate)" };
}

function formatTradeRecord(raw) {
  const timestamp = raw.trade_timestamp instanceof Date 
    ? raw.trade_timestamp.toISOString() 
    : String(raw.trade_timestamp);

  return {
    trade_id: raw.trade_id,
    symbol: raw.symbol,
    trade_name: raw.trade_name,
    exchange: raw.exchange,
    side: raw.side,
    quantity: Number(raw.quantity),
    price: Number(raw.price),
    trade_value: Number(raw.trade_value),
    trade_type: raw.trade_type,
    order_type: raw.order_type,
    status: raw.status,
    trade_timestamp: timestamp,

    // Nested Client Details
    client: {
      client_id: raw.client_id,
      client_name: raw.client_name,
      client_contact: raw.client_contact,
      client_email: raw.client_email || "",
      client_city: raw.client_city,
      client_segment: raw.client_segment,
    },

    // Nested Employee Details
    employee: {
      employee_id: raw.employee_id,
      employee_name: raw.employee_name,
      employee_department: raw.employee_department,
      employee_location: raw.employee_location,
    },

    // Flat properties for convenience
    client_id: raw.client_id,
    client_name: raw.client_name,
    client_contact: raw.client_contact,
    client_email: raw.client_email || "",
    client_city: raw.client_city,
    client_segment: raw.client_segment,
    employee_id: raw.employee_id,
    employee_name: raw.employee_name,
    employee_department: raw.employee_department,
    employee_location: raw.employee_location,
  };
}

function parseCsvTrades(filePath) {
  return new Promise((resolve, reject) => {
    const tradeList = [];
    const fileStream = fs.createReadStream(filePath);
    const lineReader = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isFirstLine = true;

    lineReader.on("line", (line) => {
      if (!line.trim()) return;
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }

      const columns = line.split(",").map((col) => col.trim());
      if (columns.length < 21) return;

      let trade_id, client_id, client_name, client_contact, client_email;
      let client_city, client_segment, employee_id, employee_name, employee_department;
      let employee_location, symbol, trade_name, exchange, side, quantity, price;
      let trade_value, trade_type, order_type, status, trade_timestamp;

      if (columns.length >= 22) {
        [
          trade_id, client_id, client_name, client_contact, client_email,
          client_city, client_segment, employee_id, employee_name, employee_department,
          employee_location, symbol, trade_name, exchange, side, quantity, price,
          trade_value, trade_type, order_type, status, trade_timestamp
        ] = columns;
      } else {
        [
          trade_id, client_id, client_name, client_contact,
          client_city, client_segment, employee_id, employee_name, employee_department,
          employee_location, symbol, trade_name, exchange, side, quantity, price,
          trade_value, trade_type, order_type, status, trade_timestamp
        ] = columns;
        client_email = "";
      }

      tradeList.push({
        trade_id,
        client_id,
        client_name,
        client_contact,
        client_email,
        client_city,
        client_segment,
        employee_id,
        employee_name,
        employee_department,
        employee_location,
        symbol,
        trade_name,
        exchange,
        side,
        quantity: parseInt(quantity, 10),
        price: parseFloat(price),
        trade_value: parseFloat(trade_value),
        trade_type,
        order_type,
        status,
        trade_timestamp,
      });
    });

    lineReader.on("close", () => resolve(tradeList));
    lineReader.on("error", (err) => reject(err));
  });
}

/**
 * Fetches trades data:
 * 1. Tries to read from MySQL database first.
 * 2. Falls back to CSV file if MySQL query fails.
 */
async function fetchTradesData() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM `bse_mock_trades` ORDER BY `trade_timestamp` DESC, `trade_id` DESC;"
    );

    if (rows && rows.length > 0) {
      return rows.map(formatTradeRecord);
    }
  } catch (dbError) {
    console.warn(`⚠️ MySQL query failed (${dbError.message}). Falling back to CSV file...`);
  }

  if (fs.existsSync(CSV_PATH)) {
    const csvRows = await parseCsvTrades(CSV_PATH);
    return csvRows.map(formatTradeRecord);
  }

  return [];
}

// ----------------------------------------------------------------------------
// 5. REAL-TIME DATABASE CHANGE WATCHER
// ----------------------------------------------------------------------------
let lastDbFingerprint = null;
let isCheckingDb = false;

/**
 * Checks MySQL database for changes (inserts, updates, deletes).
 * If any change is detected, broadcasts new data to all connected SSE clients.
 */
async function checkDatabaseChanges() {
  if (isCheckingDb) return;
  isCheckingDb = true;

  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count, MAX(trade_timestamp) as max_ts, MAX(trade_id) as max_id, SUM(CRC32(CONCAT(trade_id, price, quantity, status))) as checksum FROM `bse_mock_trades`;"
    );

    if (rows && rows.length > 0) {
      const { count, max_ts, max_id, checksum } = rows[0];
      const countNum = Number(count) || 0;
      const tsStr = max_ts ? new Date(max_ts).toISOString() : "";
      const idStr = String(max_id || "");
      const csStr = String(checksum || "");

      const currentFingerprint = `${countNum}_${tsStr}_${idStr}_${csStr}`;

      if (lastDbFingerprint !== null && lastDbFingerprint !== currentFingerprint) {
        console.log(`⚡ [Real-time DB Sync] Database change detected! Total rows: ${countNum}, Latest: ${idStr}`);
        const trades = await fetchTradesData();

        // Broadcast real-time update event
        broadcastEvent("trades_updated", {
          totalTrades: trades.length,
          source: "database_live_sync",
          timestamp: new Date().toISOString(),
          trades,
        });

        // Also broadcast trade_pull_completed for backwards compatibility
        broadcastEvent("trade_pull_completed", {
          pullId: `db_sync_${Date.now()}`,
          totalTrades: trades.length,
          durationMs: 0,
          completedAt: new Date().toISOString(),
          trades,
        });
      }

      lastDbFingerprint = currentFingerprint;
    }
  } catch (err) {
    // Database check might fail during startup or migration; ignore and retry next tick
  } finally {
    isCheckingDb = false;
  }
}

// Start continuous background database watcher polling every 1 second (1000ms)
setInterval(checkDatabaseChanges, 1000);

// ----------------------------------------------------------------------------
// 6. API ENDPOINTS & ROUTES
// ----------------------------------------------------------------------------

/**
 * Route: GET /api/events
 * Description: Real-time Server-Sent Events (SSE) stream for connected web browsers.
 */
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  sseClients.add(res);
  console.log(`📡 Browser connected to SSE stream. Total connected: ${sseClients.size}`);

  const welcomePayload = JSON.stringify({
    status: "connected",
    realtime_db_sync: "active",
    time: new Date().toISOString(),
  });
  res.write(`event: connected\ndata: ${welcomePayload}\n\n`);

  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeatTimer);
    sseClients.delete(res);
    console.log(`🔌 Browser disconnected from SSE stream. Remaining: ${sseClients.size}`);
  });
});

/**
 * Handler for GET /getTrades and GET /api/trades
 * Returns all current trades immediately from the database.
 */
async function handleGetTrades(req, res) {
  const pullId = `pull_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();
  const { delayMs, description: delayDescription } = parseDelay(req.query.delay);

  if (delayMs > 0) {
    broadcastEvent("trade_pull_started", {
      pullId,
      delayMs,
      delayDescription,
      startedAt: new Date().toISOString(),
    });
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  try {
    const trades = await fetchTradesData();
    const durationMs = Date.now() - startTime;
    const elapsedSeconds = Number((durationMs / 1000).toFixed(2));

    res.json({
      success: true,
      meta: {
        pull_id: pullId,
        total_records: trades.length,
        elapsed_seconds: elapsedSeconds,
        timestamp: new Date().toISOString(),
        source: "Mock BSE Trade API (Real-time DB Sync)",
      },
      data: trades,
    });
  } catch (error) {
    console.error("❌ Error fetching trades:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve trades data",
      message: error.message,
    });
  }
}

app.get("/getTrades", handleGetTrades);
app.get("/api/getTrades", handleGetTrades);
app.get("/api/trades", handleGetTrades);

/**
 * Route: POST /api/trades (and POST /insertTrade)
 * Description: Inserts a new trade directly into MySQL and broadcasts it to all SSE clients in real-time.
 */
async function handleInsertTrade(req, res) {
  try {
    const body = req.body || {};

    // Auto-generate trade ID if missing
    let tradeId = body.trade_id;
    if (!tradeId) {
      const [maxRows] = await pool.query("SELECT MAX(trade_id) as max_id FROM `bse_mock_trades`");
      const lastId = maxRows[0]?.max_id;
      let nextNum = 2001;
      if (lastId && lastId.startsWith("TRD")) {
        const parsed = parseInt(lastId.replace("TRD", ""), 10);
        if (!isNaN(parsed)) nextNum = parsed + 1;
      }
      tradeId = `TRD${String(nextNum).padStart(6, "0")}`;
    }

    const tradeRecord = {
      trade_id: tradeId,
      client_id: body.client_id || "C001",
      client_name: body.client_name || "Apex Capital Advisors",
      client_contact: body.client_contact || "Raj Mehta",
      client_email: body.client_email || "raj.mehta@apexcapital.example",
      client_city: body.client_city || "Mumbai",
      client_segment: body.client_segment || "Institutional",
      employee_id: body.employee_id || "E011",
      employee_name: body.employee_name || "Ankit",
      employee_department: body.employee_department || "Equities",
      employee_location: body.employee_location || "Mumbai",
      symbol: (body.symbol || "TCS").toUpperCase(),
      trade_name: body.trade_name || "Tata Consultancy Services Ltd",
      exchange: body.exchange || "BSE",
      side: body.side || "BUY",
      quantity: Number(body.quantity) || 100,
      price: Number(body.price) || 3850.0,
      trade_value: Number(body.trade_value) || (Number(body.quantity || 100) * Number(body.price || 3850.0)),
      trade_type: body.trade_type || "DELIVERY",
      order_type: body.order_type || "LIMIT",
      status: body.status || "EXECUTED",
      trade_timestamp: body.trade_timestamp || new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    const sql = `
      INSERT INTO \`bse_mock_trades\` (
        \`trade_id\`, \`client_id\`, \`client_name\`, \`client_contact\`, \`client_email\`,
        \`client_city\`, \`client_segment\`, \`employee_id\`, \`employee_name\`,
        \`employee_department\`, \`employee_location\`, \`symbol\`, \`trade_name\`,
        \`exchange\`, \`side\`, \`quantity\`, \`price\`, \`trade_value\`,
        \`trade_type\`, \`order_type\`, \`status\`, \`trade_timestamp\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        \`quantity\` = VALUES(\`quantity\`),
        \`price\` = VALUES(\`price\`),
        \`trade_value\` = VALUES(\`trade_value\`),
        \`status\` = VALUES(\`status\`);
    `;

    const values = [
      tradeRecord.trade_id, tradeRecord.client_id, tradeRecord.client_name,
      tradeRecord.client_contact, tradeRecord.client_email, tradeRecord.client_city,
      tradeRecord.client_segment, tradeRecord.employee_id, tradeRecord.employee_name,
      tradeRecord.employee_department, tradeRecord.employee_location,
      tradeRecord.symbol, tradeRecord.trade_name, tradeRecord.exchange,
      tradeRecord.side, tradeRecord.quantity, tradeRecord.price,
      tradeRecord.trade_value, tradeRecord.trade_type, tradeRecord.order_type,
      tradeRecord.status, tradeRecord.trade_timestamp
    ];

    await pool.query(sql, values);
    console.log(`✅ [Trade Inserted] ${tradeRecord.trade_id} (${tradeRecord.symbol} - ${tradeRecord.employee_name}) into MySQL`);

    // Fetch and broadcast immediately
    const updatedTrades = await fetchTradesData();

    // Update the fingerprint so watcher won't duplicate broadcast
    const [statRows] = await pool.query(
      "SELECT COUNT(*) as count, MAX(trade_timestamp) as max_ts, MAX(trade_id) as max_id, SUM(CRC32(CONCAT(trade_id, price, quantity, status))) as checksum FROM `bse_mock_trades`;"
    );
    if (statRows && statRows.length > 0) {
      lastDbFingerprint = `${statRows[0].count}_${statRows[0].max_ts ? new Date(statRows[0].max_ts).toISOString() : ''}_${statRows[0].max_id}_${statRows[0].checksum}`;
    }

    broadcastEvent("trades_updated", {
      totalTrades: updatedTrades.length,
      source: "api_insert",
      insertedTrade: formatTradeRecord(tradeRecord),
      timestamp: new Date().toISOString(),
      trades: updatedTrades,
    });

    broadcastEvent("trade_pull_completed", {
      pullId: `insert_${Date.now()}`,
      totalTrades: updatedTrades.length,
      durationMs: 0,
      completedAt: new Date().toISOString(),
      trades: updatedTrades,
    });

    res.status(201).json({
      success: true,
      message: "Trade successfully inserted into MySQL database and synced in real-time.",
      data: formatTradeRecord(tradeRecord),
    });
  } catch (error) {
    console.error("❌ Error inserting trade:", error);
    res.status(500).json({
      success: false,
      error: "Failed to insert trade",
      message: error.message,
    });
  }
}

app.post("/api/trades", handleInsertTrade);
app.post("/insertTrade", handleInsertTrade);

/**
 * Route: GET /api/status
 * Description: Health check endpoint that checks MySQL database status and total record count.
 */
app.get("/api/status", async (req, res) => {
  let dbStatus = "disconnected";
  let tradeCount = 0;

  try {
    const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM `bse_mock_trades`;");
    tradeCount = rows[0]?.cnt || 0;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = `unavailable (${err.code || err.message})`;
  }

  res.json({
    status: "online",
    service: "Mock BSE Trade API (Real-Time Live Sync)",
    port: PORT,
    mysql: {
      database: "trades_db",
      status: dbStatus,
      trade_count: tradeCount,
    },
    sse_active_clients: sseClients.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Route: GET /
 */
app.get("/", (req, res) => {
  res.json({
    message: "Mock BSE Trade API is running on Port 7777 with Real-Time Database Sync",
    endpoints: {
      getTrades: "GET /getTrades (Live trades from MySQL)",
      insertTrade: "POST /api/trades (Insert trade and push real-time event)",
      events_sse: "GET /api/events (Live Server-Sent Events)",
      status: "GET /api/status (DB connection & count)",
    },
  });
});

// ----------------------------------------------------------------------------
// 7. START SERVER
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log("=================================================");
  console.log(`🚀 Mock BSE Trade API running on http://localhost:${PORT}`);
  console.log(`⚡ Real-Time DB Watcher: Active (1s polling interval)`);
  console.log(`📊 Endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/getTrades`);
  console.log(`   - POST http://localhost:${PORT}/api/trades`);
  console.log(`   - GET  http://localhost:${PORT}/api/events (SSE Stream)`);
  console.log(`   - GET  http://localhost:${PORT}/api/status`);
  console.log("=================================================");
});
