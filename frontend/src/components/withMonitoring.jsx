import React from "react";
import Sentry from "../sentry";

export default function withMonitoring(Component, name) {
  return function Wrapped(props) {
    try {
      return <Component {...props} />;
    } catch (e) {
      // forward to Sentry
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(e, { extra: { component: name } });
      }
      throw e;
    }
  };
}
