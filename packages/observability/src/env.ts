export type ObservabilityStatus = {
  sentry: boolean;
  posthog: boolean;
  resend: boolean;
  inngest: boolean;
};

export function getSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? undefined;
}

export function getPostHogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY ?? undefined;
}

export function getPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
}

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY ?? undefined;
}

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'SourceByJay <noreply@sourcebyjay.com>';
}

export function getInngestEventKey(): string | undefined {
  return process.env.INNGEST_EVENT_KEY ?? undefined;
}

export function getInngestSigningKey(): string | undefined {
  return process.env.INNGEST_SIGNING_KEY ?? undefined;
}

export function observabilityStatus(): ObservabilityStatus {
  return {
    sentry: Boolean(getSentryDsn()),
    posthog: Boolean(getPostHogKey()),
    resend: Boolean(getResendApiKey()),
    inngest: Boolean(getInngestEventKey() && getInngestSigningKey()),
  };
}
