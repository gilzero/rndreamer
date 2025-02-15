/**
 * @fileoverview Datadog configuration and monitoring utilities.
 * @filepath src/config/datadog.ts
 * Provides functionality to initialize Datadog APM and RUM services.
 * 
 * @module config/datadog
 * @requires dd-trace
 * @requires @datadog/browser-logs
 */

import tracer from 'dd-trace';
import { datadogLogs } from '@datadog/browser-logs';

/** Flag indicating whether Datadog monitoring is enabled */
export const DATADOG_ENABLED = process.env['ENABLE_DATADOG'] === 'true';

/** Current environment for Datadog reporting */
export const DATADOG_ENV = process.env['DATADOG_ENV'] || 'development';

/** Service name for Datadog reporting */
export const DATADOG_SERVICE_NAME = process.env['DATADOG_SERVICE_NAME'] || 'ai-chat-app';

/**
 * Initializes Datadog APM (Application Performance Monitoring) tracer.
 * Sets up distributed tracing with environment-specific configuration.
 * No-op if Datadog is disabled via environment variables.
 */
export const initializeDatadog = () => {
    if (!DATADOG_ENABLED) {
        console.log('Datadog is disabled');
        return;
    }

    // Initialize the tracer
    tracer.init({
        env: DATADOG_ENV,
        service: DATADOG_SERVICE_NAME,
        version: process.env['npm_package_version'] || '1.0.0',
        logInjection: true,
    });

    console.log('Datadog initialized');
};

/**
 * Initializes Datadog RUM (Real User Monitoring) for client-side monitoring.
 * Configures browser-based logging and performance tracking.
 * No-op if Datadog is disabled via environment variables.
 */
export const initializeDatadogRUM = () => {
    if (!DATADOG_ENABLED) {
        console.log('Datadog RUM is disabled');
        return;
    }

    datadogLogs.init({
        clientToken: process.env['DATADOG_CLIENT_TOKEN']!,
        site: process.env['DATADOG_SITE'] || 'datadoghq.com',
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
        service: DATADOG_SERVICE_NAME,
        env: DATADOG_ENV,
    });
};

/**
 * Custom logging middleware that integrates with Datadog APM.
 * Traces application requests and logs data with proper context.
 * Falls back to console logging when Datadog is disabled.
 * 
 * @param data - The data to be logged and traced
 */
export const datadogLogger = (data: any) => {
    if (!DATADOG_ENABLED) {
        // Fallback to console logging when Datadog is disabled
        console.log(JSON.stringify(data));
        return;
    }

    tracer.trace('app.request', (span) => {
        span.setTag('data', data);
    });
}; 