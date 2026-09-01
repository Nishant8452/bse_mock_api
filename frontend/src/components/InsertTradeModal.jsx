import React, { useState } from "react";
import { X, PlusCircle, Sparkles, Database, Zap } from "lucide-react";

const DEMO_PRESETS = [
  {
    symbol: "RELIANCE",
    trade_name: "Reliance Industries Ltd",
    exchange: "BSE",
    side: "BUY",
    quantity: 150,
    price: 2980.50,
    client_name: "Kotak Mahindra Prime",
    client_contact: "Amitabh Sen",
    client_email: "amitabh.sen@kotakprime.example",
    client_city: "Mumbai",
    client_segment: "Institutional",
    employee_name: "Ankit Sharma",
    employee_department: "Equities",
    employee_location: "Mumbai",
  },
  {
    symbol: "TCS",
    trade_name: "Tata Consultancy Services Ltd",
    exchange: "BSE",
    side: "BUY",
    quantity: 100,
    price: 3920.00,
    client_name: "Motilal Oswal Financial",
    client_contact: "Sneha Kapoor",
    client_email: "sneha.k@motilal.example",
    client_city: "Bengaluru",
    client_segment: "HNI",
    employee_name: "Priya Nair",
    employee_department: "Derivatives",
    employee_location: "Bengaluru",
  },
  {
    symbol: "HDFCBANK",
    trade_name: "HDFC Bank Ltd",
    exchange: "BSE",
    side: "SELL",
    quantity: 200,
    price: 1640.75,
    client_name: "Axis Mutual Fund",
    client_contact: "Rahul Verma",
    client_email: "r.verma@axismf.example",
    client_city: "Delhi",
    client_segment: "Institutional",
    employee_name: "Vikram Malhotra",
    employee_department: "Risk",
    employee_location: "Delhi",
  },
  {
    symbol: "INFY",
    trade_name: "Infosys Ltd",
    exchange: "BSE",
    side: "BUY",
    quantity: 350,
    price: 1820.00,
    client_name: "Aditya Birla Capital",
    client_contact: "Rohan Das",
    client_email: "rohan.das@abcapital.example",
    client_city: "Pune",
    client_segment: "HNI",
    employee_name: "Ankit",
    employee_department: "Equities",
    employee_location: "Mumbai",
  },
];

export function InsertTradeModal({ isOpen, onClose, onInsertTrade }) {
  const [formData, setFormData] = useState({
    symbol: "TCS",
    trade_name: "Tata Consultancy Services Ltd",
    exchange: "BSE",
    side: "BUY",
    quantity: 100,
    price: 3850.00,
    trade_type: "DELIVERY",
    order_type: "LIMIT",
    status: "EXECUTED",
    client_name: "Apex Capital Advisors",
    client_contact: "Raj Mehta",
    client_email: "raj.mehta@apexcapital.example",
    client_city: "Mumbai",
    client_segment: "Institutional",
    employee_name: "Ankit",
    employee_department: "Equities",
    employee_location: "Mumbai",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        price: parseFloat(formData.price),
        trade_value: parseInt(formData.quantity, 10) * parseFloat(formData.price),
        trade_timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
      };

      await onInsertTrade(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to insert trade");
    } finally {
      setLoading(false);
    }
  };

  const tradeValue = (Number(formData.quantity || 0) * Number(formData.price || 0)).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    style: "currency",
    currency: "INR",
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container insert-trade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Database className="text-cyan" size={20} />
            <div>
              <h2>Insert Trade into Database</h2>
              <p className="modal-subtitle">
                Writes to MySQL <code>bse_mock_trades</code> — auto-syncs across all clients in real time!
              </p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Demo Presets */}
          <div className="preset-section">
            <span className="preset-label">
              <Sparkles size={13} className="text-cyan" /> Quick Presets:
            </span>
            <div className="preset-buttons">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.symbol}
                  type="button"
                  className="btn btn-secondary btn-xs preset-btn"
                  onClick={() => handleApplyPreset(p)}
                >
                  <Zap size={11} className="text-amber" />
                  {p.symbol} ({p.side})
                </button>
              ))}
            </div>
          </div>

          {error && <div className="modal-error-banner">{error}</div>}

          <form id="insert-trade-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Symbol */}
              <div className="form-group">
                <label>Symbol / Ticker</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.symbol}
                  onChange={(e) => handleChange("symbol", e.target.value.toUpperCase())}
                  required
                />
              </div>

              {/* Trade Name */}
              <div className="form-group">
                <label>Company / Security Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.trade_name}
                  onChange={(e) => handleChange("trade_name", e.target.value)}
                  required
                />
              </div>

              {/* Side */}
              <div className="form-group">
                <label>Side</label>
                <select
                  className="form-select"
                  value={formData.side}
                  onChange={(e) => handleChange("side", e.target.value)}
                >
                  <option value="BUY">🟢 BUY</option>
                  <option value="SELL">🔴 SELL</option>
                </select>
              </div>

              {/* Exchange */}
              <div className="form-group">
                <label>Exchange</label>
                <select
                  className="form-select"
                  value={formData.exchange}
                  onChange={(e) => handleChange("exchange", e.target.value)}
                >
                  <option value="BSE">BSE</option>
                  <option value="NSE">NSE</option>
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label>Quantity (Shares)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  required
                />
              </div>

              {/* Price */}
              <div className="form-group">
                <label>Price per Share (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </div>

              {/* Calculated Trade Value */}
              <div className="form-group span-2 calculated-value-box">
                <span className="label-text">Calculated Total Trade Value:</span>
                <span className="calculated-amount">{tradeValue}</span>
              </div>

              {/* Client Name */}
              <div className="form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.client_name}
                  onChange={(e) => handleChange("client_name", e.target.value)}
                  required
                />
              </div>

              {/* Client Segment */}
              <div className="form-group">
                <label>Client Segment</label>
                <select
                  className="form-select"
                  value={formData.client_segment}
                  onChange={(e) => handleChange("client_segment", e.target.value)}
                >
                  <option value="Institutional">Institutional</option>
                  <option value="HNI">HNI</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>

              {/* Employee Name */}
              <div className="form-group">
                <label>Dealer / Employee Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.employee_name}
                  onChange={(e) => handleChange("employee_name", e.target.value)}
                  required
                />
              </div>

              {/* Department */}
              <div className="form-group">
                <label>Employee Department</label>
                <select
                  className="form-select"
                  value={formData.employee_department}
                  onChange={(e) => handleChange("employee_department", e.target.value)}
                >
                  <option value="Equities">Equities</option>
                  <option value="Derivatives">Derivatives</option>
                  <option value="Operations">Operations</option>
                  <option value="Risk">Risk</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <PlusCircle size={15} />
                <span>{loading ? "Inserting..." : "Insert into Database & Live Sync"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
