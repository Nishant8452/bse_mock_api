import React, { useEffect, useState } from "react";
import { Loader2, XCircle, Clock, Globe } from "lucide-react";
import { formatSecondsToMMSS } from "../utils/formatters.js";

export function ProgressBanner({ activePull, onAbort }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!activePull) return;

    const updateTimer = () => {
      const ms = Date.now() - activePull.startTime;
      setElapsedSec(Math.floor(ms / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activePull]);

  if (!activePull) return null;

  const { delayParam, delayMs, startTime } = activePull;
  const isInstant = delayParam === "0" || !delayParam;
  const totalTargetSec = delayMs > 0 ? delayMs / 1000 : 0;
  const remainingSec = Math.max(0, totalTargetSec - elapsedSec);

  const progressPct = delayMs > 0
    ? Math.min(100, Math.max(5, ((Date.now() - startTime) / delayMs) * 100))
    : 85;

  const endpointText = delayParam !== "0" ? `/getTrades?delay=${delayParam}` : `/getTrades`;
  const delayLabel = delayParam === "0" ? "0s (Instant)" : delayParam;

  return (
    <div id="pull-progress-banner" className="progress-banner">
      <div className="banner-content">
        <div className="banner-info">
          <div className="spinner-pulse">
            <Loader2 size={24} className="animate-spin text-cyan" />
          </div>
          <div>
            <div className="banner-title">
              <strong id="banner-status-text">BSE Pull In Progress...</strong>
              <span className="badge-delay" id="banner-delay-badge">
                <Clock size={12} /> Delay: {delayLabel}
              </span>
              <span className="badge-time" id="banner-timer-badge">
                Elapsed: {formatSecondsToMMSS(elapsedSec)}
                {delayMs > 0 && ` • Remaining: ~${formatSecondsToMMSS(remainingSec)}`}
              </span>
            </div>
            <p className="banner-desc">
              Request active in background on <code id="banner-endpoint">{endpointText}</code>. The terminal is{" "}
              <strong>open & fully interactive</strong> with existing data. New trades will sync automatically upon completion with{" "}
              <strong>zero page refresh and no polling loop</strong>.
            </p>
          </div>
        </div>

        <div className="banner-actions">
          <button
            id="btn-abort-pull"
            className="btn btn-outline-danger btn-sm"
            onClick={onAbort}
            title="Abort in-flight pull request"
          >
            <XCircle size={14} />
            <span>Abort Pull</span>
          </button>
        </div>
      </div>

      <div className="progress-track">
        <div
          id="banner-progress-fill"
          className="progress-fill animated-stripes"
          style={{ width: `${progressPct}%` }}
        ></div>
      </div>
    </div>
  );
}
