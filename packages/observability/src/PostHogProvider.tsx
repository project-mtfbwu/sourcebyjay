'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

import type { PortalId } from './events';

function readPostHogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

function readPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
}

let initialized = false;

export function initPostHog(portal: PortalId): void {
  if (typeof window === 'undefined' || initialized) return;
  const key = readPostHogKey();
  if (!key) return;

  posthog.init(key, {
    api_host: readPostHogHost(),
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    loaded: (client) => {
      client.register({ portal });
    },
  });
  initialized = true;
}

export function captureAnalyticsEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === 'undefined') return;
  const key = readPostHogKey();
  if (!key) return;
  posthog.capture(event, properties);
}

export function PostHogProvider({
  portal,
  children,
}: {
  portal: PortalId;
  children: React.ReactNode;
}) {
  useEffect(() => {
    initPostHog(portal);
  }, [portal]);

  return children;
}
