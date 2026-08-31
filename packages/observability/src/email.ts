import 'server-only';

import { Resend } from 'resend';

import { getResendApiKey, getResendFromEmail } from './env';

export type SendTransactionalEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

export type SendTransactionalEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[resend:dev] skipped email — RESEND_API_KEY not set', {
        to: input.to,
        subject: input.subject,
      });
    }
    return { ok: false, error: 'RESEND_API_KEY not configured', skipped: true };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    tags: input.tags,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? 'unknown' };
}
