import React from "react";
import { Eye, ArrowUpDown } from "lucide-react";
import { formatFullINR, formatDateTime } from "../utils/formatters.js";

export function TradesTable({
  trades,
  currentPage,
  pageSize,
  onInspectTrade,
  sortBy,
  onSortChange,
}) {
  const startIndex = (currentPage - 1) * pageSize;
  const pageTrades = trades.slice(startIndex, startIndex + pageSize);

  const handleHeaderSort = (sortKey) => {
    if (sortBy === `${sortKey}_desc`) {
      onSortChange(`${sortKey}_asc`);
    } else {
      onSortChange(`${sortKey}_desc`);
    }
  };

  return (
    <section className="table-card">
      <div className="table-responsive">
        <table className="trades-table" id="trades-table">
          <thead>
            <tr>
              <th onClick={() => handleHeaderSort("symbol")} className="sortable">
                <div className="th-content">
                  <span>Trade ID</span>
                </div>
              </th>
              <th onClick={() => handleHeaderSort("symbol")} className="sortable">
                <div className="th-content">
                  <span>Symbol & Security</span>
                  <ArrowUpDown size={12} className="sort-icon" />
                </div>
              </th>
              <th>Exch</th>
              <th>Side</th>
              <th onClick={() => handleHeaderSort("quantity")} className="sortable text-right">
                <div className="th-content justify-end">
                  <span>Quantity</span>
                  <ArrowUpDown size={12} className="sort-icon" />
                </div>
              </th>
              <th className="text-right">Price (₹)</th>
              <th onClick={() => handleHeaderSort("value")} className="sortable text-right">
                <div className="th-content justify-end">
                  <span>Trade Value (₹)</span>
                  <ArrowUpDown size={12} className="sort-icon" />
                </div>
              </th>
              <th>Client Details</th>
              <th>Employee / Dept</th>
              <th>Status</th>
              <th onClick={() => handleHeaderSort("timestamp")} className="sortable">
                <div className="th-content">
                  <span>Timestamp</span>
                  <ArrowUpDown size={12} className="sort-icon" />
                </div>
              </th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody id="trades-table-body">
            {pageTrades.length === 0 ? (
              <tr>
                <td colSpan={12} className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-icon">📊</div>
                    <h3>No trades to display</h3>
                    <p>
                      Trades are automatically synced in real time from the MySQL database. Insert a trade or adjust your search filters to view records.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pageTrades.map((trade) => {
                const isBuy = trade.side === "BUY";
                const sideClass = isBuy ? "badge-side-buy" : "badge-side-sell";
                const statusClass =
                  trade.status === "EXECUTED" ? "badge-status-executed" : "badge-status-partial";

                const clientName = trade.client_name || trade.client?.client_name || "-";
                const clientCity = trade.client_city || trade.client?.client_city || "";
                const clientSegment = trade.client_segment || trade.client?.client_segment || "";
                const employeeName = trade.employee_name || trade.employee?.employee_name || "-";
                const employeeDept =
                  trade.employee_department || trade.employee?.employee_department || "";

                return (
                  <tr
                    key={trade.trade_id}
                    data-trade-id={trade.trade_id}
                    onClick={() => onInspectTrade(trade)}
                    className="trade-row"
                  >
                    {/* Trade ID */}
                    <td className="font-mono text-trade-id">
                      {trade.trade_id}
                    </td>

                    {/* Symbol & Security */}
                    <td>
                      <div className="symbol-cell">
                        <span className="symbol-name">{trade.symbol}</span>
                        <span className="company-name">{trade.trade_name || ""}</span>
                      </div>
                    </td>

                    {/* Exchange */}
                    <td>
                      <span className="badge-exchange">{trade.exchange}</span>
                    </td>

                    {/* Side */}
                    <td>
                      <span className={sideClass}>{trade.side}</span>
                    </td>

                    {/* Quantity */}
                    <td className="font-mono text-right">
                      {Number(trade.quantity || 0).toLocaleString()}
                    </td>

                    {/* Price */}
                    <td className="font-mono text-right">
                      ₹{Number(trade.price || 0).toFixed(2)}
                    </td>

                    {/* Trade Value */}
                    <td className="font-mono text-right text-value">
                      {formatFullINR(trade.trade_value)}
                    </td>

                    {/* Client */}
                    <td>
                      <div className="client-cell-title">{clientName}</div>
                      <div className="cell-subtext">
                        {clientCity && <span>{clientCity} • </span>}
                        {clientSegment && <span className="badge-segment">{clientSegment}</span>}
                      </div>
                    </td>

                    {/* Employee */}
                    <td>
                      <div className="employee-cell-title">{employeeName}</div>
                      <div className="cell-subtext">{employeeDept}</div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={statusClass}>{trade.status}</span>
                    </td>

                    {/* Timestamp */}
                    <td className="font-mono text-timestamp">
                      {formatDateTime(trade.trade_timestamp)}
                    </td>

                    {/* Action */}
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm btn-inspect"
                        onClick={() => onInspectTrade(trade)}
                        title="Inspect trade & client details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
