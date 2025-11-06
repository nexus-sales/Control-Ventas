import React from "react";

export default function Toast({ message, type = "info", onClose }) {
  if (!message) return null;
  let color = "bg-sky-600";
  if (type === "error") color = "bg-red-600";
  if (type === "success") color = "bg-emerald-600";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${color} flex items-center gap-3 animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-3 text-white/80 hover:text-white font-bold text-lg"
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}
