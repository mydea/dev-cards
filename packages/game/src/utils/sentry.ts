import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://c3f41b332ff3e90d5a937138eb0c72c2@o4504009877553152.ingest.us.sentry.io/4509876437778433',

  // Adds request headers and IP for users
  sendDefaultPii: true,

  // Environment configuration
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',

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
