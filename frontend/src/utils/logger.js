import Sentry from "../sentry";
import axios from "axios";

const API_LOG_ENDPOINT = import.meta.env.VITE_API_BASE_URL || "";

export function logToServer(payload){
  try {
    axios.post(`${API_LOG_ENDPOINT}/api/v1/logs`, payload).catch(()=>{});
  } catch(e) {}
}

export function info(message, data){
  if (Sentry && Sentry.addBreadcrumb){
    Sentry.addBreadcrumb({ category: 'info', message: message, data });
  }
  logToServer({level:'info', message, data});
}

export function warn(message, data){
  if (Sentry && Sentry.addBreadcrumb){
    Sentry.addBreadcrumb({ category: 'warning', message: message, data });
  }
  logToServer({level:'warning', message, data});
}

export function error(message, data){
  if (Sentry && Sentry.captureException){
    Sentry.captureException(message, { extra: data });
  }
  logToServer({level:'error', message, data});
}
