// ============================================================================
// Storage Module: Instant offline/cache persistence for trades & pull state
// ============================================================================

const STORAGE_KEYS = {
  TRADES: "bse_dashboard_trades",
  LAST_PULL_META: "bse_dashboard_last_pull",
  ACTIVE_PULL: "bse_dashboard_active_pull",
  SETTINGS: "bse_dashboard_settings",
};

export const storage = {
  getStoredTrades() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Error reading trades from localStorage:", e);
      return [];
    }
  },

  saveTrades(trades) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    } catch (e) {
      console.warn("Error saving trades to localStorage (may exceed quota):", e);
    }
  },

  getLastPullMeta() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_PULL_META);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveLastPullMeta(meta) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PULL_META, JSON.stringify(meta));
    } catch {}
  },

  getActivePull() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PULL);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveActivePull(pullData) {
    try {
      if (pullData) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PULL, JSON.stringify(pullData));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PULL);
      }
    } catch {}
  },

  clearActivePull() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PULL);
    } catch {}
  },
};
