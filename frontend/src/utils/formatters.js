// ============================================================================
// Data Formatting Utilities for Financial Dashboard
// ============================================================================

/**
 * Formats a numeric value in Indian Rupees (INR) with Crores/Lakhs abbreviations
 * @param {number} val
 * @returns {string}
 */
export function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  const num = Number(val);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats full numeric values with standard Indian commas
 * @param {number} val
 * @returns {string}
 */
export function formatFullINR(val) {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats an ISO or DB timestamp into readable format
 * @param {string|Date} timestamp
 * @param {boolean} [includeSeconds=true]
 * @returns {string}
 */
export function formatDateTime(timestamp, includeSeconds = true) {
  if (!timestamp) return "-";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: includeSeconds ? "2-digit" : undefined,
    });
  } catch {
    return String(timestamp);
  }
}

/**
 * Formats a timestamp into a long human-friendly string for detail modal
 * @param {string|Date} timestamp
 * @returns {string}
 */
export function formatFullDateTime(timestamp) {
  if (!timestamp) return "-";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    return d.toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "medium",
    });
  } catch {
    return String(timestamp);
  }
}

/**
 * Formats seconds into MM:SS format
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatSecondsToMMSS(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
}
