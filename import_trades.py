"""
Script to import BSE mock trades CSV data into MySQL database `trades_db`.

Prerequisites (install one of the MySQL drivers):
    pip install mysql-connector-python
    # OR
    pip install pymysql
"""

import csv
import os
import sys
import time

# ==========================================
# Database Configuration
# ==========================================
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "root",
    "database": "trades_db",
}

CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bse_mock_trades_2000.csv")
BATCH_SIZE = 500


def get_mysql_connection():
    """
    Attempts to connect using mysql.connector or pymysql.
    First connects to MySQL server without database to ensure `trades_db` exists.
    """
    driver = None
    try:
        import mysql.connector
        driver = "mysql.connector"
    except ImportError:
        try:
            import pymysql
            driver = "pymysql"
        except ImportError:
            print("❌ Error: No MySQL driver found.")
            print("Please install either 'mysql-connector-python' or 'pymysql':")
            print("   pip install mysql-connector-python")
            print("   # or")
            print("   pip install pymysql")
            sys.exit(1)

    print(f"🔌 Using driver: {driver}")

    # 1. Connect without selecting database to create database if not exists
    if driver == "mysql.connector":
        conn_init = mysql.connector.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            autocommit=True,
        )
    else:
        conn_init = pymysql.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            autocommit=True,
        )

    cursor_init = conn_init.cursor()
    cursor_init.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_CONFIG['database']}`;")
    cursor_init.close()
    conn_init.close()

    # 2. Connect to the target database
    if driver == "mysql.connector":
        return mysql.connector.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"],
        )
    else:
        return pymysql.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"],
            autocommit=False,
        )


def create_table_if_not_exists(cursor):
    """Creates the bse_mock_trades table with indexes if it does not already exist."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS `bse_mock_trades` (
        `trade_id` VARCHAR(20) NOT NULL,
        `client_id` VARCHAR(10) NOT NULL,
        `client_name` VARCHAR(150) NOT NULL,
        `client_contact` VARCHAR(150) NOT NULL,
        `client_email` VARCHAR(255) NOT NULL,
        `client_city` VARCHAR(100) NOT NULL,
        `client_segment` ENUM('Retail', 'HNI', 'Institutional') NOT NULL,
        `employee_id` VARCHAR(10) NOT NULL,
        `employee_name` VARCHAR(150) NOT NULL,
        `employee_department` ENUM('Equities', 'Derivatives', 'Operations', 'Risk') NOT NULL,
        `employee_location` VARCHAR(100) NOT NULL,
        `symbol` VARCHAR(20) NOT NULL,
        `trade_name` VARCHAR(150) NOT NULL,
        `exchange` ENUM('NSE', 'BSE') NOT NULL,
        `side` ENUM('BUY', 'SELL') NOT NULL,
        `quantity` INT NOT NULL,
        `price` DECIMAL(12, 2) NOT NULL,
        `trade_value` DECIMAL(15, 2) NOT NULL,
        `trade_type` ENUM('DELIVERY', 'INTRADAY') NOT NULL,
        `order_type` ENUM('LIMIT', 'MARKET') NOT NULL,
        `status` ENUM('EXECUTED', 'PARTIALLY_EXECUTED') NOT NULL,
        `trade_timestamp` DATETIME NOT NULL,
        PRIMARY KEY (`trade_id`),
        INDEX `bse_trades_client_idx` (`client_id`),
        INDEX `bse_trades_employee_idx` (`employee_id`),
        INDEX `bse_trades_symbol_idx` (`symbol`),
        INDEX `bse_trades_timestamp_idx` (`trade_timestamp`),
        INDEX `bse_trades_status_idx` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """
    cursor.execute(create_table_sql)


def parse_and_insert_data(connection, csv_path):
    """
    Reads the CSV and batch-inserts records into `bse_mock_trades`.
    Handles the 22-column alignment (including client_email).
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found at: {csv_path}")

    insert_sql = """
    INSERT INTO `bse_mock_trades` (
        `trade_id`, `client_id`, `client_name`, `client_contact`, `client_email`,
        `client_city`, `client_segment`, `employee_id`, `employee_name`,
        `employee_department`, `employee_location`, `symbol`, `trade_name`,
        `exchange`, `side`, `quantity`, `price`, `trade_value`,
        `trade_type`, `order_type`, `status`, `trade_timestamp`
    ) VALUES (
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s
    )
    ON DUPLICATE KEY UPDATE
        `client_id` = VALUES(`client_id`),
        `client_name` = VALUES(`client_name`),
        `client_contact` = VALUES(`client_contact`),
        `client_email` = VALUES(`client_email`),
        `client_city` = VALUES(`client_city`),
        `client_segment` = VALUES(`client_segment`),
        `employee_id` = VALUES(`employee_id`),
        `employee_name` = VALUES(`employee_name`),
        `employee_department` = VALUES(`employee_department`),
        `employee_location` = VALUES(`employee_location`),
        `symbol` = VALUES(`symbol`),
        `trade_name` = VALUES(`trade_name`),
        `exchange` = VALUES(`exchange`),
        `side` = VALUES(`side`),
        `quantity` = VALUES(`quantity`),
        `price` = VALUES(`price`),
        `trade_value` = VALUES(`trade_value`),
        `trade_type` = VALUES(`trade_type`),
        `order_type` = VALUES(`order_type`),
        `status` = VALUES(`status`),
        `trade_timestamp` = VALUES(`trade_timestamp`);
    """

    cursor = connection.cursor()
    records_to_insert = []
    total_rows = 0
    start_time = time.time()

    print(f"📖 Reading data from '{csv_path}'...")

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader, None)  # Skip header row

        for line_num, row in enumerate(reader, start=2):
            if not row or not any(field.strip() for field in row):
                continue  # Skip blank lines

            # Ensure row length matches expected columns
            if len(row) == 22:
                (
                    trade_id, client_id, client_name, client_contact, client_email,
                    client_city, client_segment, employee_id, employee_name,
                    employee_department, employee_location, symbol, trade_name,
                    exchange, side, quantity, price, trade_value,
                    trade_type, order_type, status, trade_timestamp
                ) = [field.strip() for field in row]
            elif len(row) == 21:
                # In case email column was missing in data
                (
                    trade_id, client_id, client_name, client_contact,
                    client_city, client_segment, employee_id, employee_name,
                    employee_department, employee_location, symbol, trade_name,
                    exchange, side, quantity, price, trade_value,
                    trade_type, order_type, status, trade_timestamp
                ) = [field.strip() for field in row]
                client_email = ""
            else:
                print(f"⚠️ Warning: Row {line_num} has unexpected number of columns ({len(row)}). Skipping.")
                continue

            try:
                record = (
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
                    int(quantity),
                    float(price),
                    float(trade_value),
                    trade_type,
                    order_type,
                    status,
                    trade_timestamp,
                )
                records_to_insert.append(record)
            except ValueError as e:
                print(f"⚠️ Warning: Error parsing row {line_num}: {e}. Skipping row.")
                continue

            # Batch execute
            if len(records_to_insert) >= BATCH_SIZE:
                cursor.executemany(insert_sql, records_to_insert)
                connection.commit()
                total_rows += len(records_to_insert)
                print(f"   ↳ Inserted {total_rows} rows so far...")
                records_to_insert = []

    # Insert remaining rows
    if records_to_insert:
        cursor.executemany(insert_sql, records_to_insert)
        connection.commit()
        total_rows += len(records_to_insert)

    elapsed = time.time() - start_time
    cursor.close()
    print(f"✅ Successfully inserted/updated {total_rows} rows in {elapsed:.2f} seconds.")


def main():
    print("=" * 60)
    print("  BSE Mock Trades CSV -> MySQL Importer")
    print("=" * 60)
    print(f"Database: {DB_CONFIG['database']}")
    print(f"Host:     {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"User:     {DB_CONFIG['user']}")
    print(f"File:     {CSV_FILE_PATH}")
    print("-" * 60)

    try:
        conn = get_mysql_connection()
        print("Connected to MySQL successfully.")

        cursor = conn.cursor()
        create_table_if_not_exists(cursor)
        cursor.close()
        print("Table `bse_mock_trades` verified/created.")

        parse_and_insert_data(conn, CSV_FILE_PATH)

        conn.close()
        print("Connection closed. Import process completed successfully.")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
