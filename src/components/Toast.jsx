import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="toast-icon text-emerald-500" size={20} />,
    error: <AlertCircle className="toast-icon text-rose-500" size={20} />,
    info: <Info className="toast-icon text-sky-500" size={20} />,
  };

  return (
    <div className={`toast-container toast-${toast.type || "info"}`}>
      <div className="toast-content">
        {icons[toast.type] || icons.info}
        <span className="toast-message">{toast.message}</span>
      </div>
      <button className="toast-close-btn" onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  );
}
