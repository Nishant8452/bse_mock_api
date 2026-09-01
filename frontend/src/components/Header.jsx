import React from "react";
import { TrendingUp, Activity, Radio, Database, PlusCircle, RotateCw, Sparkles } from "lucide-react";

export function Header({
  apiStatus,
  sseStatus,
  totalTradesCount,
  onOpenInsertModal,
  onRefresh,
  isRefreshing,
}) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="brand-logo">
          <div className="logo-icon-wrapper">
            <TrendingUp className="logo-icon text-cyan" size={24} />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1>BSE Mock Trades</h1>
              <span className="badge-terminal">Terminal</span>
              <span className="badge-realtime">
                <span className="live-pulse-dot"></span>
                Real-Time Live DB
              </span>
            </div>
            <p className="subtitle">
              Live Real-Time Database Synchronization • Automatic push on new records
            </p>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="status-group">
          {/* API Server & MySQL Status */}
          <div
            className={`status-pill ${apiStatus.online ? "pill-online" : "pill-offline"}`}
            title={`Backend Server: ${apiStatus.online ? `Port ${apiStatus.port || 7777} Online (${apiStatus.mysql || "DB Connected"})` : "Offline"}`}
          >
            <span className={`status-dot ${apiStatus.online ? "dot-green" : "dot-red"}`}></span>
            <Activity size={13} className="status-icon" />
            <span className="status-label">
              {apiStatus.online
                ? `API :${apiStatus.port || 7777} • ${apiStatus.mysql || "DB Ready"}`
                : "API :7777 Offline"}
            </span>
          </div>

          {/* SSE Live Stream Status */}
          <div
            className={`status-pill ${sseStatus === "live" ? "pill-online" : "pill-warning"}`}
            title="Server-Sent Events (SSE) stream for zero-polling instant push updates from MySQL"
          >
            <span
              className={`status-dot ${
                sseStatus === "live"
                  ? "dot-green"
                  : sseStatus === "reconnecting"
                  ? "dot-yellow"
                  : "dot-yellow"
              }`}
            ></span>
            <Radio size={13} className={`status-icon ${sseStatus === "live" ? "text-emerald" : "text-amber"}`} />
            <span className="status-label">
              {sseStatus === "live" ? "SSE Stream: Live" : "SSE Stream: Connecting"}
            </span>
          </div>

          {/* Total DB Records Pill */}
          <div className="status-pill pill-db" title="Total real-time records in database">
            <Database size={13} className="status-icon text-cyan" />
            <span className="status-label font-mono">
              {totalTradesCount > 0 ? `${totalTradesCount.toLocaleString()} Records` : "Syncing..."}
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="realtime-action-panel">
          {/* Subtle Refresh button */}
          <button
            id="btn-refresh-trades"
            className="btn btn-secondary btn-icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Force immediate database sync"
          >
            <RotateCw size={15} className={isRefreshing ? "animate-spin" : ""} />
          </button>

          {/* Insert Trade to DB Button */}
          <button
            id="btn-insert-trade-modal"
            className="btn btn-primary"
            onClick={onOpenInsertModal}
            title="Insert new trade into database to see real-time sync in action"
          >
            <PlusCircle size={15} />
            <span className="btn-text">Insert Trade to DB</span>
          </button>
        </div>
      </div>
    </header>
  );
}
