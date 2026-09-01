import React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

export function ToastContainer({ toasts = [] }) {
  if (!toasts || toasts.length === 0) return null;

  const renderIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} className="text-emerald shrink-0" />;
      case "warning":
        return <AlertTriangle size={16} className="text-amber shrink-0" />;
      case "error":
        return <XCircle size={16} className="text-rose shrink-0" />;
      case "info":
      default:
        return <Info size={16} className="text-cyan shrink-0" />;
    }
  };

  return (
    <div id="toast-container" className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || "info"}`}>
          {renderIcon(toast.type)}
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
