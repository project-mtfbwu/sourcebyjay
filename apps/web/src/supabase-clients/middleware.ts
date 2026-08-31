import { PORTAL_AUTH_COOKIE } from '@sourcebyjay/auth';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { match } from 'path-to-regexp';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        name: PORTAL_AUTH_COOKIE.web,
        path: '/',
        sameSite: 'lax',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid adding logic between createServerClient and
  // supabase.auth.getUser(). Extra work here can make session refresh bugs hard
  // to diagnose.

  const protectedPages = [
    '/dashboard{/*path}',
    '/account{/*path}',
    '/private-item{/*path}',
    '/private-items{/*path}',
    '/items{/*path}',
    '/item{/*path}',
  ] as const;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/auth/callback');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ops staff and sellers must not keep a buyer-portal session (Amazon.com ≠ staff tools).
  if (user && !isAuthRoute) {
    const { data: isStaff } = await supabase.rpc('is_active_staff');
    if (isStaff) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'staff_account');
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'seller') {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'seller_account');
      return NextResponse.redirect(url);
    }
  }

  if (!user && protectedPages.some((page) => match(page)(request.nextUrl.pathname))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
