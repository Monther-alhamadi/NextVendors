
import { withProfiler } from "@sentry/react";

/**
 * Higher Order Component to wrap pages/components with Sentry Profiler.
 * @param {React.Component} Component - The component to wrap
 * @param {string} name - The name of the component for Sentry
 */
const withMonitoring = (Component, name) => {
  return withProfiler(Component, { name: name || Component.displayName || Component.name });
};

export default withMonitoring;
