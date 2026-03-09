import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const t = { id, ...toast };
    setToasts((s) => [t, ...s]);
    if (!toast.stay) {
      const ttl = toast.duration ?? 4000;
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id));
        toast.onClose && toast.onClose();
      }, ttl);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="toast-root" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <div className="toast-msg">{t.message}</div>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  try {
                    t.action.onClick();
                  } finally {
                    remove(t.id);
                    t.onClose && t.onClose();
                  }
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
