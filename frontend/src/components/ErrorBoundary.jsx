import React from "react";
import Sentry from "../sentry";
import { Translation } from "react-i18next";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // log to Sentry when configured
    if (Sentry && Sentry.captureException) {
      Sentry.captureException(error, { extra: errorInfo });
    }
    // console.error allows local debugging as a fallback
    console.error("Unhandled error in UI:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Translation>
          {t => (
            <div style={{ padding: 24, textAlign: "center" }} role="alert">
              <h2>{t('error_boundary.title')}</h2>
              <p>
                {t('error_boundary.desc')}
              </p>
            </div>
          )}
        </Translation>
      );
    }
    return this.props.children;
  }
}
