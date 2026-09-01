import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "./components/Header.jsx";
import { KpiGrid } from "./components/KpiGrid.jsx";
import { ControlsBar } from "./components/ControlsBar.jsx";
import { TradesTable } from "./components/TradesTable.jsx";
import { Pagination } from "./components/Pagination.jsx";
import { TradeDetailModal } from "./components/TradeDetailModal.jsx";
import { InsertTradeModal } from "./components/InsertTradeModal.jsx";
import { ToastContainer } from "./components/ToastContainer.jsx";

import { api } from "./services/api.js";
import { storage } from "./utils/storage.js";

export function App() {
  // 1. Core Trade Data & Sync Meta
  const [allTrades, setAllTrades] = useState(() => storage.getStoredTrades() || []);
  const [lastPullMeta, setLastPullMeta] = useState(() => storage.getLastPullMeta());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 2. Server & SSE Status
  const [apiStatus, setApiStatus] = useState({ online: false, port: 7777, mysql: "" });
  const [sseStatus, setSseStatus] = useState("connecting"); // "connecting" | "live" | "reconnecting"

  // 3. Filters, Sorting & Pagination
  const [filters, setFilters] = useState({
    search: "",
    side: "ALL",
    segment: "ALL",
    status: "ALL",
    exchange: "ALL",
  });
  const [sortBy, setSortBy] = useState("timestamp_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 4. Modals & Toasts
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Notification Helper
  const showToast = useCallback((message, type = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Update trades & persist to storage
  const commitTrades = useCallback((trades, meta = {}) => {
    setAllTrades(trades);
    storage.saveTrades(trades);

    const pullMeta = {
      total: trades.length,
      timestamp: new Date().toISOString(),
      delay: 0,
      elapsed: meta?.elapsed_seconds || 0,
    };
    setLastPullMeta(pullMeta);
    storage.saveLastPullMeta(pullMeta);
  }, []);

  // --------------------------------------------------------------------------
  // Check API Server & Database Status
  // --------------------------------------------------------------------------
  const checkServer = useCallback(async () => {
    const status = await api.getStatus();
    if (status.status === "online") {
      setApiStatus({
        online: true,
        port: status.port || 7777,
        mysql: status.mysql?.status === "connected" 
          ? `DB Connected (${status.mysql.trade_count?.toLocaleString()} rows)` 
          : status.mysql?.status || "DB Ready",
      });
    } else {
      setApiStatus({ online: false, port: 7777, mysql: "Offline" });
    }
  }, []);

  // --------------------------------------------------------------------------
  // Fetch Latest Trades directly from Database
  // --------------------------------------------------------------------------
  const fetchLatestTrades = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const response = await api.getTrades();
      if (response && response.success && response.data) {
        commitTrades(response.data, response.meta);
        if (isManual) {
          showToast(`⚡ Synced ${response.data.length.toLocaleString()} trades directly from database!`, "success");
        }
      }
    } catch (err) {
      console.error("Fetch trades error:", err);
      if (isManual) {
        showToast(`❌ Database sync failed: ${err.message}`, "error");
      }
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [commitTrades, showToast]);

  // --------------------------------------------------------------------------
  // Setup Real-time SSE Stream & Auto-load on Mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 1. Initial health check and automatic fetch
    checkServer();
    fetchLatestTrades(false);

    const serverInterval = setInterval(checkServer, 10000);

    // 2. Real-time Live SSE Stream Subscription
    const sseHandler = api.initSSE({
      onConnected: () => {
        setSseStatus("live");
      },
      onTradesUpdated: (data) => {
        console.log("⚡ Real-time DB change event received:", data);
        if (data.trades && Array.isArray(data.trades) && data.trades.length > 0) {
          commitTrades(data.trades);
          const newCount = data.totalTrades || data.trades.length;
          const insertedSymbol = data.insertedTrade ? `(${data.insertedTrade.symbol})` : "";
          showToast(`⚡ Real-Time DB Sync: ${newCount.toLocaleString()} trades updated live ${insertedSymbol}!`, "success");
        }
      },
      onPullComplete: (data) => {
        if (data.trades && Array.isArray(data.trades) && data.trades.length > 0) {
          commitTrades(data.trades);
        }
      },
      onError: () => {
        setSseStatus("reconnecting");
      },
    });

    return () => {
      clearInterval(serverInterval);
      sseHandler.disconnect();
    };
  }, [checkServer, fetchLatestTrades, commitTrades, showToast]);

  // --------------------------------------------------------------------------
  // Handle Insert New Trade
  // --------------------------------------------------------------------------
  const handleInsertTrade = useCallback(async (tradeData) => {
    try {
      const result = await api.insertTrade(tradeData);
      showToast(`🎉 New Trade ${result.data?.trade_id || ""} inserted into MySQL & synced in real-time!`, "success");
      // Immediate fresh fetch as backup
      await fetchLatestTrades(false);
      return result;
    } catch (err) {
      console.error("Insert trade error:", err);
      showToast(`❌ Failed to insert trade: ${err.message}`, "error");
      throw err;
    }
  }, [showToast, fetchLatestTrades]);

  // --------------------------------------------------------------------------
  // Filtering & Sorting Logic
  // --------------------------------------------------------------------------
  const filteredTrades = useMemo(() => {
    let list = [...allTrades];

    // 1. Search Query
    const q = filters.search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const empName = t.employee_name || t.employee?.employee_name || "";
        const empId = t.employee_id || t.employee?.employee_id || "";
        const empDept = t.employee_department || t.employee?.employee_department || "";
        const empLoc = t.employee_location || t.employee?.employee_location || "";
        const clientName = t.client_name || t.client?.client_name || "";
        const clientId = t.client_id || t.client?.client_id || "";
        const clientContact = t.client_contact || t.client?.client_contact || "";
        const clientCity = t.client_city || t.client?.client_city || "";

        return (
          (t.trade_id && t.trade_id.toLowerCase().includes(q)) ||
          (t.symbol && t.symbol.toLowerCase().includes(q)) ||
          (t.trade_name && t.trade_name.toLowerCase().includes(q)) ||
          clientId.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q) ||
          clientContact.toLowerCase().includes(q) ||
          clientCity.toLowerCase().includes(q) ||
          empId.toLowerCase().includes(q) ||
          empName.toLowerCase().includes(q) ||
          empDept.toLowerCase().includes(q) ||
          empLoc.toLowerCase().includes(q)
        );
      });
    }

    // 2. Filter Side
    if (filters.side !== "ALL") {
      list = list.filter((t) => t.side === filters.side);
    }

    // 3. Filter Segment
    if (filters.segment !== "ALL") {
      list = list.filter(
        (t) => (t.client_segment || t.client?.client_segment) === filters.segment
      );
    }

    // 4. Filter Status
    if (filters.status !== "ALL") {
      list = list.filter((t) => t.status === filters.status);
    }

    // 5. Filter Exchange
    if (filters.exchange !== "ALL") {
      list = list.filter((t) => t.exchange === filters.exchange);
    }

    // 6. Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case "timestamp_desc":
          return new Date(b.trade_timestamp) - new Date(a.trade_timestamp);
        case "timestamp_asc":
          return new Date(a.trade_timestamp) - new Date(b.trade_timestamp);
        case "value_desc":
          return Number(b.trade_value || 0) - Number(a.trade_value || 0);
        case "value_asc":
          return Number(a.trade_value || 0) - Number(b.trade_value || 0);
        case "quantity_desc":
          return Number(b.quantity || 0) - Number(a.quantity || 0);
        case "symbol_asc":
          return (a.symbol || "").localeCompare(b.symbol || "");
        default:
          return 0;
      }
    });

    return list;
  }, [allTrades, filters, sortBy]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      side: "ALL",
      segment: "ALL",
      status: "ALL",
      exchange: "ALL",
    });
    setSortBy("timestamp_desc");
    setCurrentPage(1);
    showToast("Filters reset to default.", "info");
  };

  // --------------------------------------------------------------------------
  // Exports (CSV & JSON)
  // --------------------------------------------------------------------------
  const handleExportCsv = useCallback(() => {
    if (!filteredTrades || filteredTrades.length === 0) {
      showToast("⚠️ No trades to export!", "warning");
      return;
    }

    const headers = [
      "trade_id", "symbol", "trade_name", "exchange", "side", "quantity",
      "price", "trade_value", "trade_type", "order_type", "status",
      "client_id", "client_name", "client_contact", "client_email", "client_city", "client_segment",
      "employee_id", "employee_name", "employee_department", "employee_location",
      "trade_timestamp"
    ];

    const rows = filteredTrades.map((t) => [
      t.trade_id,
      t.symbol,
      `"${(t.trade_name || "").replace(/"/g, '""')}"`,
      t.exchange,
      t.side,
      t.quantity,
      t.price,
      t.trade_value,
      t.trade_type,
      t.order_type,
      t.status,
      t.client_id || t.client?.client_id || "",
      `"${(t.client_name || t.client?.client_name || "").replace(/"/g, '""')}"`,
      `"${(t.client_contact || t.client?.client_contact || "").replace(/"/g, '""')}"`,
      t.client_email || t.client?.client_email || "",
      t.client_city || t.client?.client_city || "",
      t.client_segment || t.client?.client_segment || "",
      t.employee_id || t.employee?.employee_id || "",
      `"${(t.employee_name || t.employee?.employee_name || "").replace(/"/g, '""')}"`,
      t.employee_department || t.employee?.employee_department || "",
      t.employee_location || t.employee?.employee_location || "",
      t.trade_timestamp
    ].join(","));

    const content = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bse_trades_export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`📁 Exported ${filteredTrades.length.toLocaleString()} trades to CSV!`, "success");
  }, [filteredTrades, showToast]);

  const handleExportJson = useCallback(() => {
    if (!filteredTrades || filteredTrades.length === 0) {
      showToast("⚠️ No trades to export!", "warning");
      return;
    }

    const content = JSON.stringify(filteredTrades, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bse_trades_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`📁 Exported ${filteredTrades.length.toLocaleString()} trades to JSON!`, "success");
  }, [filteredTrades, showToast]);

  return (
    <div className="app-container">
      {/* 1. Header with Real-Time Live DB Status and Controls */}
      <Header
        apiStatus={apiStatus}
        sseStatus={sseStatus}
        totalTradesCount={allTrades.length}
        onOpenInsertModal={() => setIsInsertModalOpen(true)}
        onRefresh={() => fetchLatestTrades(true)}
        isRefreshing={isRefreshing}
      />

      {/* 2. Main Dashboard */}
      <main className="main-content">
        {/* KPI Metrics */}
        <KpiGrid
          allTrades={allTrades}
          filteredTrades={filteredTrades}
          lastPullMeta={lastPullMeta}
        />

        {/* Controls & Filter Bar */}
        <ControlsBar
          filters={filters}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={handleResetFilters}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          totalCount={allTrades.length}
          filteredCount={filteredTrades.length}
          pageSize={pageSize}
        />

        {/* High-Performance Trades Data Table */}
        <TradesTable
          trades={filteredTrades}
          currentPage={currentPage}
          pageSize={pageSize}
          onInspectTrade={setSelectedTrade}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Pagination Bar */}
        {filteredTrades.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredTrades.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </main>

      {/* 3. Trade Inspector Drawer / Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />

      {/* 4. Insert Trade into Database Modal */}
      <InsertTradeModal
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
        onInsertTrade={handleInsertTrade}
      />

      {/* 5. Floating Toast Alerts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
