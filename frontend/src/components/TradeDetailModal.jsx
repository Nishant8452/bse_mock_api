import React, { useEffect } from "react";
import { X, User, Briefcase, FileText, CheckCircle2, ShieldCheck, Mail, MapPin, Tag } from "lucide-react";
import { formatFullINR, formatFullDateTime } from "../utils/formatters.js";

export function TradeDetailModal({ trade, onClose }) {
  useEffect(() => {
    if (!trade) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trade, onClose]);

  if (!trade) return null;

  const isBuy = trade.side === "BUY";
  const sideClass = isBuy ? "badge-side-buy" : "badge-side-sell";

  const clientName = trade.client_name || trade.client?.client_name || "N/A";
  const clientId = trade.client_id || trade.client?.client_id || "-";
  const clientSegment = trade.client_segment || trade.client?.client_segment || "Retail";
  const clientContact = trade.client_contact || trade.client?.client_contact || "N/A";
  const clientEmail = trade.client_email || trade.client?.client_email || "N/A";
  const clientCity = trade.client_city || trade.client?.client_city || "N/A";

  const employeeName = trade.employee_name || trade.employee?.employee_name || "N/A";
  const employeeId = trade.employee_id || trade.employee?.employee_id || "-";
  const employeeDept = trade.employee_department || trade.employee?.employee_department || "Trading";
  const employeeLoc = trade.employee_location || trade.employee?.employee_location || "Headquarters";

  return (
    <div id="trade-modal" className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={sideClass}>{trade.side}</span>
            <h2 id="modal-trade-id" className="font-mono">{trade.trade_id}</h2>
            <span className="badge-symbol">
              {trade.symbol} • {trade.exchange}
            </span>
          </div>
          <button id="btn-close-modal" className="btn-close" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" id="modal-content">
          {/* Section 1: Execution Details */}
          <div className="modal-section">
            <div className="modal-section-title">
              <FileText size={15} className="text-cyan" />
              <span>Trade Execution Details</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Security Name</span>
                <span className="detail-value">{trade.trade_name || trade.symbol}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Exchange & Side</span>
                <span className="detail-value font-mono">
                  {trade.exchange} — {trade.side}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Quantity</span>
                <span className="detail-value font-mono">
                  {Number(trade.quantity || 0).toLocaleString()} units
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Executed Price</span>
                <span className="detail-value font-mono">
                  ₹{Number(trade.price || 0).toFixed(2)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Trade Value</span>
                <span className="detail-value font-mono text-emerald" style={{ fontSize: "16px", fontWeight: "700" }}>
                  {formatFullINR(trade.trade_value)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Order / Trade Type</span>
                <span className="detail-value">
                  {trade.order_type || "LIMIT"} / {trade.trade_type || "EQUITY"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Execution Status</span>
                <span className="detail-value">
                  <span className={trade.status === "EXECUTED" ? "badge-status-executed" : "badge-status-partial"}>
                    {trade.status}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Execution Timestamp</span>
                <span className="detail-value font-mono" style={{ fontSize: "12px" }}>
                  {formatFullDateTime(trade.trade_timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Client Information */}
          <div className="modal-section">
            <div className="modal-section-title">
              <User size={15} className="text-emerald" />
              <span>Client Information</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Client ID & Name</span>
                <span className="detail-value">
                  <strong className="font-mono text-cyan">{clientId}</strong> — {clientName}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Client Segment</span>
                <span className="detail-value">
                  <span className="badge-segment">{clientSegment}</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Contact Person</span>
                <span className="detail-value">{clientContact}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-value font-mono text-cyan" style={{ fontSize: "12px" }}>
                  {clientEmail}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">City / Region</span>
                <span className="detail-value">{clientCity}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Servicing Employee */}
          <div className="modal-section">
            <div className="modal-section-title">
              <Briefcase size={15} className="text-purple" />
              <span>Servicing Employee</span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Employee ID & Name</span>
                <span className="detail-value">
                  <strong className="font-mono text-purple">{employeeId}</strong> — {employeeName}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department</span>
                <span className="detail-value">{employeeDept}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Branch Location</span>
                <span className="detail-value">{employeeLoc}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button id="btn-modal-done" className="btn btn-secondary" onClick={onClose}>
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
