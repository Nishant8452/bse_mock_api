// ============================================================================
// Database Seed Script for BSE Mock Trades
// ============================================================================
// This script:
// 1. Reads the trade data from 'bse_mock_trades_2000.csv'.
// 2. Connects to the MySQL database.
// 3. Automatically creates the database and 'bse_mock_trades' table if they don't exist.
// 4. Inserts all trade records into the database in batches of 500.
// ============================================================================

import fs from "node:fs";               // Node.js file system module
import path from "node:path";           // Node.js file path helper
import readline from "node:readline";   // Reads the CSV line-by-line
import mysql from "mysql2/promise";      // MySQL library supporting async/await
import { fileURLToPath } from "node:url";

// Get current directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File path to the CSV and database connection string from environment
const CSV_PATH = path.resolve(__dirname, "../bse_mock_trades_2000.csv");
const DB_URL = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/trades_db";

async function seedDatabase() {
  console.log("🌱 Starting BSE Mock Trades Database Seeder...");
  console.log(`📂 CSV Path: ${CSV_PATH}`);
  console.log(`🔗 Database URL: ${DB_URL}`);

  // Step 1: Check if the CSV file exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found at: ${CSV_PATH}`);
    process.exit(1);
  }

  // Step 2: Parse database URL to get host, port, user, password, and database name
  const dbUrl = new URL(DB_URL);
  const host = dbUrl.hostname || "localhost";
  const port = parseInt(dbUrl.port || "3306", 10);
  const user = dbUrl.username || "root";
  const password = dbUrl.password || "root";
  const database = dbUrl.pathname.replace(/^\//, "") || "trades_db";

  // Step 3: Create database if it doesn't already exist
  console.log(`🔨 Ensuring database '${database}' exists...`);
  const initialConnection = await mysql.createConnection({ host, port, user, password });
  await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await initialConnection.end();

  // Step 4: Connect directly to the database
  const dbConnection = await mysql.createConnection({ host, port, user, password, database });

  // Step 5: Create the trades table if it doesn't exist
  console.log("🔨 Ensuring table 'bse_mock_trades' exists...");
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS \`bse_mock_trades\` (
      \`trade_id\` VARCHAR(20) NOT NULL,
      \`client_id\` VARCHAR(10) NOT NULL,
      \`client_name\` VARCHAR(150) NOT NULL,
      \`client_contact\` VARCHAR(150) NOT NULL,
      \`client_email\` VARCHAR(255) NOT NULL,
      \`client_city\` VARCHAR(100) NOT NULL,
      \`client_segment\` ENUM('Retail', 'HNI', 'Institutional') NOT NULL,
      \`employee_id\` VARCHAR(10) NOT NULL,
      \`employee_name\` VARCHAR(150) NOT NULL,
      \`employee_department\` ENUM('Equities', 'Derivatives', 'Operations', 'Risk') NOT NULL,
      \`employee_location\` VARCHAR(100) NOT NULL,
      \`symbol\` VARCHAR(20) NOT NULL,
      \`trade_name\` VARCHAR(150) NOT NULL,
      \`exchange\` ENUM('NSE', 'BSE') NOT NULL,
      \`side\` ENUM('BUY', 'SELL') NOT NULL,
      \`quantity\` INT NOT NULL,
      \`price\` DECIMAL(12, 2) NOT NULL,
      \`trade_value\` DECIMAL(15, 2) NOT NULL,
      \`trade_type\` ENUM('DELIVERY', 'INTRADAY') NOT NULL,
      \`order_type\` ENUM('LIMIT', 'MARKET') NOT NULL,
      \`status\` ENUM('EXECUTED', 'PARTIALLY_EXECUTED') NOT NULL,
      \`trade_timestamp\` DATETIME NOT NULL,
      PRIMARY KEY (\`trade_id\`),
      INDEX \`bse_trades_client_idx\` (\`client_id\`),
      INDEX \`bse_trades_employee_idx\` (\`employee_id\`),
      INDEX \`bse_trades_symbol_idx\` (\`symbol\`),
      INDEX \`bse_trades_timestamp_idx\` (\`trade_timestamp\`),
      INDEX \`bse_trades_status_idx\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await dbConnection.query(createTableSQL);

  // Step 6: Stream the CSV file line-by-line to avoid loading everything in memory at once
  console.log("📄 Reading and inserting records from CSV file...");
  const fileStream = fs.createReadStream(CSV_PATH);
  const lineReader = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // SQL Query for inserting multiple rows at once
  const insertSQL = `
    INSERT INTO \`bse_mock_trades\` (
      \`trade_id\`, \`client_id\`, \`client_name\`, \`client_contact\`, \`client_email\`,
      \`client_city\`, \`client_segment\`, \`employee_id\`, \`employee_name\`,
      \`employee_department\`, \`employee_location\`, \`symbol\`, \`trade_name\`,
      \`exchange\`, \`side\`, \`quantity\`, \`price\`, \`trade_value\`,
      \`trade_type\`, \`order_type\`, \`status\`, \`trade_timestamp\`
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
      \`client_id\` = VALUES(\`client_id\`),
      \`client_name\` = VALUES(\`client_name\`),
      \`client_contact\` = VALUES(\`client_contact\`),
      \`client_email\` = VALUES(\`client_email\`),
      \`client_city\` = VALUES(\`client_city\`),
      \`client_segment\` = VALUES(\`client_segment\`),
      \`employee_id\` = VALUES(\`employee_id\`),
      \`employee_name\` = VALUES(\`employee_name\`),
      \`employee_department\` = VALUES(\`employee_department\`),
      \`employee_location\` = VALUES(\`employee_location\`),
      \`symbol\` = VALUES(\`symbol\`),
      \`trade_name\` = VALUES(\`trade_name\`),
      \`exchange\` = VALUES(\`exchange\`),
      \`side\` = VALUES(\`side\`),
      \`quantity\` = VALUES(\`quantity\`),
      \`price\` = VALUES(\`price\`),
      \`trade_value\` = VALUES(\`trade_value\`),
      \`trade_type\` = VALUES(\`trade_type\`),
      \`order_type\` = VALUES(\`order_type\`),
      \`status\` = VALUES(\`status\`),
      \`trade_timestamp\` = VALUES(\`trade_timestamp\`);
  `;

  let isFirstLine = true;
  let batch = [];
  let totalInserted = 0;

  for await (const line of lineReader) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Skip header line
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    const columns = line.split(",").map((c) => c.trim());
    if (columns.length < 21) continue;

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

    batch.push([
      trade_id, client_id, client_name, client_contact, client_email,
      client_city, client_segment, employee_id, employee_name, employee_department,
      employee_location, symbol, trade_name, exchange, side, parseInt(quantity, 10),
      parseFloat(price), parseFloat(trade_value), trade_type, order_type, status,
      trade_timestamp
    ]);

    // Insert in batches of 500 rows for high performance
    if (batch.length >= 500) {
      await dbConnection.query(insertSQL, [batch]);
      totalInserted += batch.length;
      console.log(`   ↳ Inserted ${totalInserted} records so far...`);
      batch = [];
    }
  }

  // Insert any remaining rows in the final batch
  if (batch.length > 0) {
    await dbConnection.query(insertSQL, [batch]);
    totalInserted += batch.length;
  }

  await dbConnection.end();
  console.log(`✅ Seed completed successfully! Total records inserted: ${totalInserted}`);
}

// Run the seeder and catch any unhandled errors
seedDatabase().catch((error) => {
  console.error("❌ Seed error:", error);
  process.exit(1);
});
