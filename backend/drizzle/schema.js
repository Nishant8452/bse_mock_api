import {
  mysqlTable,
  varchar,
  int,
  decimal,
  mysqlEnum,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
 
// ---------------------------------------------------------------------------
// bse_mock_trades
// One flat table matching every column in bse_mock_trades_2000.csv.
//
// NOTE on the source file: its header row is missing a column. The header
// lists 21 fields but every data row has 22 values — everything after
// "client_contact" is shifted by one. The real (missing) column is
// "client_email" (e.g. "priya.nair@delta.example"), sitting between
// client_contact and client_city. That's accounted for below and must be
// accounted for the same way in any import/seed script that reads the CSV.
// ---------------------------------------------------------------------------
export const bseMockTrades = mysqlTable(
  "bse_mock_trades",
  {
    tradeId: varchar("trade_id", { length: 20 }).primaryKey(), // e.g. TRD000001
 
    // client fields
    clientId: varchar("client_id", { length: 10 }).notNull(), // e.g. C001
    clientName: varchar("client_name", { length: 150 }).notNull(),
    clientContact: varchar("client_contact", { length: 150 }).notNull(),
    clientEmail: varchar("client_email", { length: 255 }).notNull(), // missing from CSV header, present in data
    clientCity: varchar("client_city", { length: 100 }).notNull(),
    clientSegment: mysqlEnum("client_segment", [
      "Retail",
      "HNI",
      "Institutional",
    ]).notNull(),
 
    // employee fields
    employeeId: varchar("employee_id", { length: 10 }).notNull(), // e.g. E001
    employeeName: varchar("employee_name", { length: 150 }).notNull(),
    employeeDepartment: mysqlEnum("employee_department", [
      "Equities",
      "Derivatives",
      "Operations",
      "Risk",
    ]).notNull(),
    employeeLocation: varchar("employee_location", { length: 100 }).notNull(),
 
    // instrument fields
    symbol: varchar("symbol", { length: 20 }).notNull(), // e.g. WIPRO
    tradeName: varchar("trade_name", { length: 150 }).notNull(), // e.g. Wipro Ltd
    exchange: mysqlEnum("exchange", ["NSE", "BSE"]).notNull(),
 
    // trade fields
    side: mysqlEnum("side", ["BUY", "SELL"]).notNull(),
    quantity: int("quantity").notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    tradeValue: decimal("trade_value", { precision: 15, scale: 2 }).notNull(),
    tradeType: mysqlEnum("trade_type", ["DELIVERY", "INTRADAY"]).notNull(),
    orderType: mysqlEnum("order_type", ["LIMIT", "MARKET"]).notNull(),
    status: mysqlEnum("status", [
      "EXECUTED",
      "PARTIALLY_EXECUTED",
    ]).notNull(),
    tradeTimestamp: datetime("trade_timestamp").notNull(),
  },
  (table) => ({
    clientIdx: index("bse_trades_client_idx").on(table.clientId),
    employeeIdx: index("bse_trades_employee_idx").on(table.employeeId),
    symbolIdx: index("bse_trades_symbol_idx").on(table.symbol),
    timestampIdx: index("bse_trades_timestamp_idx").on(table.tradeTimestamp),
    statusIdx: index("bse_trades_status_idx").on(table.status),
  })
);