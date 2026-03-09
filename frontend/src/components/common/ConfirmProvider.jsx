import React, { createContext, useContext, useState, useCallback } from "react";

const ConfirmContext = createContext(null);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export default function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setOptions({ message, opts, resolve });
    });
  }, []);

  function handleClose(result) {
    if (options?.resolve) options.resolve(result);
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
            }}
          />
          <div
            style={{
              background: "var(--bg)",
              padding: 20,
              borderRadius: "var(--radius)",
              maxWidth: 480,
              width: "90%",
              boxShadow: "var(--shadow-md)",
              zIndex: 2001,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ marginBottom: 12 }}>{options.message}</div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                onClick={() => handleClose(false)}
                style={{ padding: "6px 12px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleClose(true)}
                style={{
                  padding: "6px 12px",
                  background: "var(--danger)",
                  color: "var(--primary-contrast)",
                  border: "none",
                  borderRadius: "var(--radius)",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
