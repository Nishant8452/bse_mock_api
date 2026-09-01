import mysql from "mysql2/promise";

async function testRealtimeInsert() {
  const DB_URL = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/trades_db";
  const conn = await mysql.createConnection(DB_URL);

  const testTrade = {
    trade_id: `TRD${Date.now().toString().slice(-6)}`,
    client_id: "C002",
    client_name: "Bajaj Finserv Asset Management",
    client_contact: "Kavita Rao",
    client_email: "kavita.rao@bajajfinserv.example",
    client_city: "Pune",
    client_segment: "HNI",
    employee_id: "E011",
    employee_name: "Ankit",
    employee_department: "Equities",
    employee_location: "Mumbai",
    symbol: "INFY",
    trade_name: "Infosys Ltd",
    exchange: "BSE",
    side: "BUY",
    quantity: 300,
    price: 1850.50,
    trade_value: 555150.00,
    trade_type: "DELIVERY",
    order_type: "LIMIT",
    status: "EXECUTED",
    trade_timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
  };

  const sql = `
    INSERT INTO \`bse_mock_trades\` (
      \`trade_id\`, \`client_id\`, \`client_name\`, \`client_contact\`, \`client_email\`,
      \`client_city\`, \`client_segment\`, \`employee_id\`, \`employee_name\`,
      \`employee_department\`, \`employee_location\`, \`symbol\`, \`trade_name\`,
      \`exchange\`, \`side\`, \`quantity\`, \`price\`, \`trade_value\`,
      \`trade_type\`, \`order_type\`, \`status\`, \`trade_timestamp\`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const values = [
    testTrade.trade_id, testTrade.client_id, testTrade.client_name,
    testTrade.client_contact, testTrade.client_email, testTrade.client_city,
    testTrade.client_segment, testTrade.employee_id, testTrade.employee_name,
    testTrade.employee_department, testTrade.employee_location,
    testTrade.symbol, testTrade.trade_name, testTrade.exchange,
    testTrade.side, testTrade.quantity, testTrade.price,
    testTrade.trade_value, testTrade.trade_type, testTrade.order_type,
    testTrade.status, testTrade.trade_timestamp
  ];

  console.log(`🚀 Inserting new test trade directly into MySQL: ${testTrade.trade_id} (${testTrade.symbol} - ${testTrade.employee_name})...`);
  await conn.query(sql, values);

  const [count] = await conn.query("SELECT COUNT(*) as total FROM `bse_mock_trades`");
  console.log(`✅ Trade inserted successfully! Total trades in MySQL DB now: ${count[0].total}`);

  await conn.end();
}

testRealtimeInsert().catch(console.error);
