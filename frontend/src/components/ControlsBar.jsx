import React from "react";
import { Search, X, RotateCcw, Download, Sparkles } from "lucide-react";

export function ControlsBar({
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  onResetFilters,
  onExportCsv,
  onExportJson,
  totalCount,
  filteredCount,
  pageSize,
}) {
  const isFiltered =
    filters.search !== "" ||
    filters.side !== "ALL" ||
    filters.segment !== "ALL" ||
    filters.status !== "ALL" ||
    filters.exchange !== "ALL" ||
    sortBy !== "timestamp_desc";

  return (
    <section className="controls-card">
      <div className="search-filter-row">
        {/* Search input with quick clear */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            id="search-input"
            className="form-input"
            placeholder="Search by Symbol, Trade ID, Client, Employee..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
          />
          {filters.search && (
            <button
              id="search-clear"
              className="btn-clear"
              onClick={() => onFilterChange("search", "")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filter-controls">
          {/* Side */}
          <select
            id="filter-side"
            className="form-select select-sm"
            value={filters.side}
            onChange={(e) => onFilterChange("side", e.target.value)}
          >
            <option value="ALL">All Sides (BUY & SELL)</option>
            <option value="BUY">🟢 BUY Only</option>
            <option value="SELL">🔴 SELL Only</option>
          </select>

          {/* Segment */}
          <select
            id="filter-segment"
            className="form-select select-sm"
            value={filters.segment}
            onChange={(e) => onFilterChange("segment", e.target.value)}
          >
            <option value="ALL">All Segments</option>
            <option value="Institutional">Institutional</option>
            <option value="HNI">HNI</option>
            <option value="Retail">Retail</option>
          </select>

          {/* Status */}
          <select
            id="filter-status"
            className="form-select select-sm"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="EXECUTED">Executed</option>
            <option value="PARTIALLY_EXECUTED">Partially Executed</option>
          </select>

          {/* Exchange */}
          <select
            id="filter-exchange"
            className="form-select select-sm"
            value={filters.exchange}
            onChange={(e) => onFilterChange("exchange", e.target.value)}
          >
            <option value="ALL">All Exchanges</option>
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>

          {/* Sort */}
          <select
            id="sort-select"
            className="form-select select-sm"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="timestamp_desc">🕒 Newest First</option>
            <option value="timestamp_asc">🕒 Oldest First</option>
            <option value="value_desc">💰 Value: High to Low</option>
            <option value="value_asc">💰 Value: Low to High</option>
            <option value="quantity_desc">📦 Quantity: High to Low</option>
            <option value="symbol_asc">🔤 Symbol: A to Z</option>
          </select>

          {/* Reset Filters button */}
          <button
            id="btn-reset-filters"
            className={`btn btn-secondary btn-sm ${isFiltered ? "btn-highlight" : ""}`}
            onClick={onResetFilters}
            title="Reset all filters and sorting"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Export actions */}
        <div className="export-controls">
          <button
            id="btn-export-csv"
            className="btn btn-ghost btn-sm"
            onClick={onExportCsv}
            disabled={filteredCount === 0}
            title="Export filtered trades to CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
          <button
            id="btn-export-json"
            className="btn btn-ghost btn-sm"
            onClick={onExportJson}
            disabled={filteredCount === 0}
            title="Export filtered trades to JSON"
          >
            <Download size={13} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="filter-summary-bar">
        <span id="filter-count-badge" className="count-badge">
          Showing {Math.min(filteredCount, pageSize).toLocaleString()} of {filteredCount.toLocaleString()} trades
          {filteredCount !== totalCount && ` (filtered from ${totalCount.toLocaleString()} total)`}
        </span>
        <span className="live-notice">
          <Sparkles size={12} className="text-cyan animate-pulse" />
          <span>Real-time updates active • No polling • Zero refresh</span>
        </span>
      </div>
    </section>
  );
}
