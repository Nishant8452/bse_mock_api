// ============================================================================
// API & SSE Real-time Communication Service
// Consumes http://localhost:7777/getTrades, /api/trades & /api/events
// ============================================================================

export const API_BASE_URL = "http://localhost:7777";

export const api = {
  /**
   * Fetches trades directly from backend MySQL database.
   * @param {Object} options
   * @param {string|number} [options.delay] - Optional delay (default 0 / instant)
   * @param {AbortSignal} [options.signal] - Abort signal to cancel request
   * @returns {Promise<Object>} API response JSON
   */
  async getTrades({ delay = 0, signal } = {}) {
    const url = new URL(`${API_BASE_URL}/getTrades`);
    if (delay !== undefined && delay !== null && delay !== "" && delay !== "0") {
      url.searchParams.set("delay", delay.toString());
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Inserts a new trade record into MySQL database via REST API.
   * Server broadcasts the new trade in real-time to all connected browser clients.
   * @param {Object} tradeData - Trade object to insert
   * @returns {Promise<Object>} Created trade response
   */
  async insertTrade(tradeData) {
    const response = await fetch(`${API_BASE_URL}/api/trades`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tradeData),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `HTTP ${response.status}: Failed to insert trade`);
    }

    return await response.json();
  },

  /**
   * Checks API and MySQL status
   */
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/status`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { status: "offline", error: e.message };
    }
  },

  /**
   * Initializes Server-Sent Events (SSE) stream for real-time live database updates.
   * Broadcasts when any trade is inserted or updated in MySQL.
   */
  initSSE({ onConnected, onTradesUpdated, onPullStart, onPullComplete, onError, onHeartbeat }) {
    let eventSource = null;
    let reconnectTimeout = null;
    let isClosedExplicitly = false;

    function connect() {
      if (isClosedExplicitly) return;
      try {
        eventSource = new EventSource(`${API_BASE_URL}/api/events`);

        eventSource.addEventListener("open", () => {
          onConnected?.({ status: "connected" });
        });

        eventSource.addEventListener("connected", (e) => {
          try {
            const data = JSON.parse(e.data);
            onConnected?.(data);
          } catch {}
        });

        eventSource.addEventListener("trades_updated", (e) => {
          try {
            const data = JSON.parse(e.data);
            onTradesUpdated?.(data);
          } catch {}
        });

        eventSource.addEventListener("trade_pull_started", (e) => {
          try {
            const data = JSON.parse(e.data);
            onPullStart?.(data);
          } catch {}
        });

        eventSource.addEventListener("trade_pull_completed", (e) => {
          try {
            const data = JSON.parse(e.data);
            onPullComplete?.(data);
          } catch {}
        });

        eventSource.onerror = (err) => {
          onError?.(err);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isClosedExplicitly) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        onError?.(e);
        if (!isClosedExplicitly) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connect, 4000);
        }
      }
    }

    connect();

    return {
      disconnect() {
        isClosedExplicitly = true;
        clearTimeout(reconnectTimeout);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      },
    };
  },
};
