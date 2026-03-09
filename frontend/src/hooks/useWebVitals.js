import { useEffect } from "react";
import { getCLS, getFID, getLCP, getTTFB, getFCP } from "web-vitals";
import Sentry from "../sentry";

function sendToSentry(metric) {
  if (!Sentry || !Sentry.addBreadcrumb) return;
  // Add as breadcrumb to Sentry
  Sentry.addBreadcrumb({
    category: "performance",
    message: `${metric.name}=${metric.value}`,
    level: "info",
    data: metric,
  });
}

export default function useWebVitals() {
  useEffect(() => {
    getCLS(sendToSentry);
    getFID(sendToSentry);
    getLCP(sendToSentry);
    getTTFB(sendToSentry);
    getFCP(sendToSentry);
  }, []);
}
