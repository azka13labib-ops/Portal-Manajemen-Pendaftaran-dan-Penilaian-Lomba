import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes - no auth required
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/callback', '/events'];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/events/')
  );

  // If no user and trying to access a protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If logged in, check role-based access
  if (user) {
    // Fetch ALL roles (user may have multiple)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleNames: string[] = (userRoles ?? []).map((r: any) => r.roles?.name).filter(Boolean);
    let roleName = 'PARTICIPANT';
    if (roleNames.includes('ADMIN')) roleName = 'ADMIN';
    else if (roleNames.includes('JUDGE')) roleName = 'JUDGE';

    // Redirect away from auth pages if already logged in
    if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
      const url = request.nextUrl.clone();
      if (roleName === 'ADMIN') url.pathname = '/admin';
      else if (roleName === 'JUDGE') url.pathname = '/judge';
      else url.pathname = '/participant';
      return NextResponse.redirect(url);
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && roleName !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = roleName === 'JUDGE' ? '/judge' : '/participant';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/judge') && roleName !== 'JUDGE' && roleName !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/participant';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
