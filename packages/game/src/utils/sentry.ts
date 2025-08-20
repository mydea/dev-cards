import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Environment configuration
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',

  // Release tracking
  release: import.meta.env.VITE_APP_VERSION,

  integrations: [
    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration(),

    // Session replay for debugging
    Sentry.replayIntegration(),

    // User feedback integration
    Sentry.feedbackIntegration({
      colorScheme: 'system',
    }),
  ],

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Set tracesSampleRate to capture performance data
  tracesSampleRate: 1,

  // Set tracePropagationTargets to control for which URLs trace propagation should be enabled
  tracePropagationTargets: [
    /^\//,
    /^https:\/\/dev-cards-api-production\.francesconovy\.workers\.dev\/api/,
    'localhost',
  ],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
