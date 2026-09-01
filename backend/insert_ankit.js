import mysql from "mysql2/promise";

async function insertAnkit() {
  const DB_URL = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/trades_db";
  const conn = await mysql.createConnection(DB_URL);

  const newTrade = {
    trade_id: "TRD002001",
    client_id: "C001",
    client_name: "Apex Capital Advisors",
    client_contact: "Raj Mehta",
    client_email: "raj.mehta@apexcapital.example",
    client_city: "Mumbai",
    client_segment: "Institutional",
    employee_id: "E011",
    employee_name: "Ankit",
    employee_department: "Equities",
    employee_location: "Mumbai",
    symbol: "TCS",
    trade_name: "Tata Consultancy Services Ltd",
    exchange: "BSE",
    side: "BUY",
    quantity: 100,
    price: 3850.00,
    trade_value: 385000.00,
    trade_type: "DELIVERY",
    order_type: "LIMIT",
    status: "EXECUTED",
    trade_timestamp: "2026-09-01 13:30:00",
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
      \`employee_name\` = VALUES(\`employee_name\`),
      \`employee_id\` = VALUES(\`employee_id\`),
      \`employee_department\` = VALUES(\`employee_department\`),
      \`employee_location\` = VALUES(\`employee_location\`);
  `;

  const values = [
    newTrade.trade_id,
    newTrade.client_id,
    newTrade.client_name,
    newTrade.client_contact,
    newTrade.client_email,
    newTrade.client_city,
    newTrade.client_segment,
    newTrade.employee_id,
    newTrade.employee_name,
    newTrade.employee_department,
    newTrade.employee_location,
    newTrade.symbol,
    newTrade.trade_name,
    newTrade.exchange,
    newTrade.side,
    newTrade.quantity,
    newTrade.price,
    newTrade.trade_value,
    newTrade.trade_type,
    newTrade.order_type,
    newTrade.status,
    newTrade.trade_timestamp,
  ];

  const [result] = await conn.query(sql, values);
  console.log("Insert result:", result);

  const [rows] = await conn.query("SELECT * FROM `bse_mock_trades` WHERE `employee_name` = 'Ankit'");
  console.log("Verified row:", rows);

  const [count] = await conn.query("SELECT COUNT(*) as total FROM `bse_mock_trades`");
  console.log("Total trades count in DB:", count[0].total);

  await conn.end();
}

insertAnkit().catch(console.error);
