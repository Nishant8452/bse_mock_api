import React, { useMemo } from "react";
import { BarChart3, DollarSign, Scale, Building2, Clock } from "lucide-react";
import { formatINR } from "../utils/formatters.js";

export function KpiGrid({ allTrades = [], filteredTrades = [], lastPullMeta = null }) {
  // Memoized KPI computations for high-performance rendering on 2000+ items
  const stats = useMemo(() => {
    if (!allTrades || allTrades.length === 0) {
      return {
        totalTrades: 0,
        filteredCount: 0,
        turnover: 0,
        avgPrice: 0,
        buyCount: 0,
        sellCount: 0,
        buyPct: 50,
        sellPct: 50,
        topSymbols: [],
        nseCount: 0,
        bseCount: 0,
      };
    }

    let totalTurnover = 0;
    let totalQty = 0;
    let buys = 0;
    let sells = 0;
    let nse = 0;
    let bse = 0;
    const symbolMap = {};

    for (let i = 0; i < allTrades.length; i++) {
      const t = allTrades[i];
      const val = Number(t.trade_value) || 0;
      const qty = Number(t.quantity) || 0;

      totalTurnover += val;
      totalQty += qty;

      if (t.side === "BUY") buys++;
      else if (t.side === "SELL") sells++;

      if (t.exchange === "NSE") nse++;
      else if (t.exchange === "BSE") bse++;

      if (t.symbol) {
        symbolMap[t.symbol] = (symbolMap[t.symbol] || 0) + 1;
      }
    }

    const buyPct = Math.round((buys / allTrades.length) * 100) || 0;
    const sellPct = 100 - buyPct;
    const avgPrice = totalQty > 0 ? totalTurnover / totalQty : 0;

    const topSymbols = Object.entries(symbolMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      totalTrades: allTrades.length,
      filteredCount: filteredTrades.length,
      turnover: totalTurnover,
      avgPrice,
      buyCount: buys,
      sellCount: sells,
      buyPct,
      sellPct,
      topSymbols,
      nseCount: nse,
      bseCount: bse,
    };
  }, [allTrades, filteredTrades]);

  return (
    <section className="kpi-grid">
      {/* 1. Total Trades */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">TOTAL TRADES</span>
          <span className="kpi-icon"><BarChart3 size={18} className="text-cyan" /></span>
        </div>
        <div className="kpi-value" id="kpi-total-trades">
          {stats.totalTrades.toLocaleString()}
        </div>
        <div className="kpi-subtext" id="kpi-total-trades-sub">
          {stats.totalTrades === 0
            ? "No trades loaded"
            : stats.filteredCount !== stats.totalTrades
            ? `Showing ${stats.filteredCount.toLocaleString()} filtered`
            : "Instant cached data available"}
        </div>
      </div>

      {/* 2. Total Turnover */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">TOTAL TURNOVER</span>
          <span className="kpi-icon"><DollarSign size={18} className="text-emerald" /></span>
        </div>
        <div className="kpi-value font-mono text-emerald" id="kpi-total-turnover">
          {formatINR(stats.turnover)}
        </div>
        <div className="kpi-subtext" id="kpi-avg-price">
          Avg Price: ₹{stats.avgPrice.toFixed(2)}
        </div>
      </div>

      {/* 3. Buy vs Sell Ratio */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">BUY / SELL VOLUME</span>
          <span className="kpi-icon"><Scale size={18} className="text-purple" /></span>
        </div>
        <div className="ratio-bar-wrapper">
          <div className="ratio-bar">
            <div
              id="ratio-buy-bar"
              className="ratio-buy"
              style={{ width: `${stats.buyPct}%` }}
            ></div>
            <div
              id="ratio-sell-bar"
              className="ratio-sell"
              style={{ width: `${stats.sellPct}%` }}
            ></div>
          </div>
          <div className="ratio-labels">
            <span className="text-buy font-mono" id="kpi-buy-pct">
              BUY: {stats.buyPct}% ({stats.buyCount.toLocaleString()})
            </span>
            <span className="text-sell font-mono" id="kpi-sell-pct">
              SELL: {stats.sellPct}% ({stats.sellCount.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* 4. Top Symbols */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">TOP SYMBOLS</span>
          <span className="kpi-icon"><Building2 size={18} className="text-amber" /></span>
        </div>
        <div className="top-symbols-list" id="kpi-top-symbols">
          {stats.topSymbols.length > 0 ? (
            stats.topSymbols.map(([sym, count]) => (
              <span key={sym} className="symbol-tag" title={`${count} trades in total`}>
                {sym} <span className="symbol-tag-count">({count})</span>
              </span>
            ))
          ) : (
            <span className="symbol-tag">-</span>
          )}
        </div>
        <div className="kpi-subtext" id="kpi-exchange-split">
          NSE: {stats.nseCount.toLocaleString()} • BSE: {stats.bseCount.toLocaleString()}
        </div>
      </div>

      {/* 5. Last Sync Metric */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">LAST SYNC METRIC</span>
          <span className="kpi-icon"><Clock size={18} className="text-cyan" /></span>
        </div>
        <div className="kpi-value font-mono text-cyan" id="kpi-last-pull-time">
          {lastPullMeta ? new Date(lastPullMeta.timestamp).toLocaleTimeString() : "Never"}
        </div>
        <div className="kpi-subtext" id="kpi-last-pull-meta">
          {lastPullMeta
            ? `${(lastPullMeta.total || stats.totalTrades).toLocaleString()} records • ${lastPullMeta.elapsed || 0}s duration`
            : "Ready to trigger pull"}
        </div>
      </div>
    </section>
  );
}
