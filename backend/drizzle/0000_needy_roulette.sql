CREATE TABLE `bse_mock_trades` (
	`trade_id` varchar(20) NOT NULL,
	`client_id` varchar(10) NOT NULL,
	`client_name` varchar(150) NOT NULL,
	`client_contact` varchar(150) NOT NULL,
	`client_email` varchar(255) NOT NULL,
	`client_city` varchar(100) NOT NULL,
	`client_segment` enum('Retail','HNI','Institutional') NOT NULL,
	`employee_id` varchar(10) NOT NULL,
	`employee_name` varchar(150) NOT NULL,
	`employee_department` enum('Equities','Derivatives','Operations','Risk') NOT NULL,
	`employee_location` varchar(100) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`trade_name` varchar(150) NOT NULL,
	`exchange` enum('NSE','BSE') NOT NULL,
	`side` enum('BUY','SELL') NOT NULL,
	`quantity` int NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`trade_value` decimal(15,2) NOT NULL,
	`trade_type` enum('DELIVERY','INTRADAY') NOT NULL,
	`order_type` enum('LIMIT','MARKET') NOT NULL,
	`status` enum('EXECUTED','PARTIALLY_EXECUTED') NOT NULL,
	`trade_timestamp` datetime NOT NULL,
	CONSTRAINT `bse_mock_trades_trade_id` PRIMARY KEY(`trade_id`)
);
--> statement-breakpoint
CREATE INDEX `bse_trades_client_idx` ON `bse_mock_trades` (`client_id`);--> statement-breakpoint
CREATE INDEX `bse_trades_employee_idx` ON `bse_mock_trades` (`employee_id`);--> statement-breakpoint
CREATE INDEX `bse_trades_symbol_idx` ON `bse_mock_trades` (`symbol`);--> statement-breakpoint
CREATE INDEX `bse_trades_timestamp_idx` ON `bse_mock_trades` (`trade_timestamp`);--> statement-breakpoint
CREATE INDEX `bse_trades_status_idx` ON `bse_mock_trades` (`status`);