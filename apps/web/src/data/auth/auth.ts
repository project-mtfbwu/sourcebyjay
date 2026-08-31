'use server';
import { actionClient } from '@/lib/safe-action';
import { assertRateLimit } from '@/lib/rate-limit';
import { createSupabaseClient } from '@/supabase-clients/server';
import { toSiteURL } from '@/utils/helpers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const requestBuyerPhoneOtpSchema = z.object({
  phone: z.string().min(8, 'Phone number is required').max(40),
});

/** Sends a phone OTP for buyer signup. Local/dev returns code 123456. */
export const requestBuyerPhoneOtpAction = actionClient
  .schema(requestBuyerPhoneOtpSchema)
  .action(async ({ parsedInput: { phone } }) => {
    assertRateLimit(`auth:otp:${phone}`, 8, 60 * 60 * 1000);
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.rpc('request_phone_otp', {
      p_phone: phone.trim(),
      p_purpose: 'buyer_signup',
    });
    if (error) throw new Error(error.message);
    const payload = data as { ok?: boolean; dev_code?: string; error?: string };
    if (!payload?.ok) throw new Error(payload?.error ?? 'OTP failed');
    return { ok: true as const, devCode: payload.dev_code ?? null };
  });

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(8, 'Phone number is required').max(40),
  otpCode: z.string().min(4).max(8),
  fullName: z.string().min(1).max(120).optional(),
});

/**
 * Signs up a new buyer with email, password, phone, and verified OTP.
 */
export const signUpAction = actionClient
  .schema(signUpSchema)
  .action(async ({ parsedInput: { email, password, phone, otpCode, fullName } }) => {
    assertRateLimit(`auth:signup:${email.toLowerCase()}`, 5, 60 * 60 * 1000);

    const supabase = await createSupabaseClient();

    const { data: verifyRaw, error: verifyError } = await supabase.rpc('verify_phone_otp', {
      p_phone: phone.trim(),
      p_purpose: 'buyer_signup',
      p_code: otpCode.trim(),
    });
    if (verifyError) throw new Error(verifyError.message);
    const verify = verifyRaw as { ok?: boolean; error?: string };
    if (!verify?.ok) throw new Error(verify?.error ?? 'Phone OTP failed');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: toSiteURL('/auth/callback'),
        data: {
          account_type: 'buyer',
          phone,
          full_name: fullName ?? undefined,
        },
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('already registered') ||
        message.includes('already been registered') ||
        error.code === 'user_already_exists'
      ) {
        throw new Error(
          'This email is already registered. Please log in instead.',
        );
      }
      throw new Error(error.message);
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({ phone, phone_verified_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return data;
  });

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * Signs in a user with email and password.
 * @param {Object} params - The parameters for sign in.
 * @param {string} params.email - The user's email address.
 * @param {string} params.password - The user's password.
 * @throws {Error} If there's an error during sign in.
 */
export const signInWithPasswordAction = actionClient
  .schema(signInSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    assertRateLimit(`auth:signin:${email.toLowerCase()}`, 10, 15 * 60 * 1000);

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('invalid login credentials') ||
        error.code === 'invalid_credentials'
      ) {
        throw new Error('Wrong email or password. Try again or use Forgot password.');
      }
      throw new Error(error.message);
    }

    const userId = data.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role === 'seller') {
        await supabase.auth.signOut();
        throw new Error(
          'That email is a seller account. Open the Seller portal (localhost:3001) to log in, or create a separate buyer account with a different email on Sign up.',
        );
      }

      const { data: isStaff } = await supabase.rpc('is_active_staff');
      if (isStaff) {
        await supabase.auth.signOut();
        throw new Error(
          'That email is an ops staff account. Open the ops portal (localhost:3002), or create a separate buyer account with a different email.',
        );
      }
    }

    revalidatePath('/', 'layout');
  });

const signInWithMagicLinkSchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

/**
 * Sends a magic link to the user's email for passwordless sign in.
 * @param {Object} params - The parameters for magic link sign in.
 * @param {string} params.email - The user's email address.
 * @param {string} [params.next] - The URL to redirect to after successful sign in.
 * @throws {Error} If there's an error sending the magic link.
 */
export const signInWithMagicLinkAction = actionClient
  .schema(signInWithMagicLinkSchema)
  .action(async ({ parsedInput: { email, next } }) => {
    assertRateLimit(`auth:magic:${email.toLowerCase()}`, 5, 60 * 60 * 1000);

    const supabase = await createSupabaseClient();
    const redirectUrl = new URL(toSiteURL('/auth/callback'));
    if (next) {
      redirectUrl.searchParams.set('next', next);
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  });

const signInWithProviderSchema = z.object({
  provider: z.enum(['google', 'github', 'twitter']),
  next: z.string().optional(),
});

/**
 * Initiates OAuth sign in with a specified provider.
 * @param {Object} params - The parameters for OAuth sign in.
 * @param {('google'|'github'|'twitter')} params.provider - The OAuth provider.
 * @param {string} [params.next] - The URL to redirect to after successful sign in.
 * @returns {Promise<{url: string}>} The URL to redirect the user to for OAuth sign in.
 * @throws {Error} If there's an error initiating OAuth sign in.
 */
export const signInWithProviderAction = actionClient
  .schema(signInWithProviderSchema)
  .action(async ({ parsedInput: { provider, next } }) => {
    assertRateLimit(`auth:oauth:${provider}`, 30, 60 * 60 * 1000);

    const supabase = await createSupabaseClient();
    const redirectToURL = new URL(toSiteURL('/auth/callback'));
    if (next) {
      redirectToURL.searchParams.set('next', next);
    }
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectToURL.toString(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { url: data.url };
  });

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

/**
 * Initiates the password reset process for a user.
 * @param {Object} params - The parameters for password reset.
 * @param {string} params.email - The email address of the user requesting password reset.
 * @throws {Error} If there's an error initiating the password reset.
 */
export const resetPasswordAction = actionClient
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput: { email } }) => {
    assertRateLimit(`auth:reset:${email.toLowerCase()}`, 3, 60 * 60 * 1000);

    const supabase = await createSupabaseClient();
    const redirectToURL = new URL(toSiteURL('/auth/callback'));
    redirectToURL.searchParams.set('next', '/update-password');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToURL.toString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  });
