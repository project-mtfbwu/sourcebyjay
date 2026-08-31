import { PORTAL_AUTH_COOKIE } from '@sourcebyjay/auth';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookieOptions: {
          name: PORTAL_AUTH_COOKIE.web,
        },
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    try {
      await supabase.auth.exchangeCodeForSession(code);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        const { data: isStaff } = await supabase.rpc('is_active_staff');
        if (profile?.role === 'seller' || isStaff) {
          await supabase.auth.signOut();
          const login = new URL('/login', requestUrl.origin);
          login.searchParams.set(
            'error',
            profile?.role === 'seller'
              ? 'seller_account'
              : 'staff_account',
          );
          revalidatePath('/', 'layout');
          return NextResponse.redirect(login);
        }
      }
    } catch (error) {
      console.error('Failed to exchange code for session: ', error);
    }
  }

  revalidatePath('/', 'layout');

  let redirectTo = new URL('/dashboard', requestUrl.origin);

  if (next) {
    const decodedNext = decodeURIComponent(next);
    redirectTo = new URL(decodedNext, requestUrl.origin);
  }

  return NextResponse.redirect(redirectTo);
}
