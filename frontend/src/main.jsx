import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { initSentry } from "./sentry";
import useWebVitals from "./hooks/useWebVitals";
import { Suspense } from "react";
import { startCartSync } from "./services/cartSync";
import "./i18n"; // Initialize i18n
import { ConfigProvider } from "./context/ConfigContext";

initSentry();
// hook will register web vitals once App renders
function Root() {
  useWebVitals();
  // start background cart sync (best-effort)
  try {
    startCartSync();
  } catch (e) {
    console.warn("Failed to start cart sync", e);
  }
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfigProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ConfigProvider>
    </Suspense>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
