import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/projects', '/tasks', '/requests', '/invoices', '/clients', '/team', '/settings'];

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Root path - redirect to dashboard if authenticated, else to login
  if (pathname === '/') {
    if (session) {
      return Response.redirect(new URL('/dashboard', request.url));
    }
    return Response.redirect(new URL('/login', request.url));
  }

  // Protected routes - redirect to login if not authenticated
  if (isProtectedRoute && !session) {
    return Response.redirect(new URL('/login', request.url));
  }

  // Login page - redirect to dashboard if already authenticated
  if (pathname === '/login' && session) {
    return Response.redirect(new URL('/dashboard', request.url));
  }

  // Allow all other requests to pass through
  return new Response(null, { status: 200 });
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/projects/:path*',
    '/tasks/:path*',
    '/requests/:path*',
    '/invoices/:path*',
    '/clients/:path*',
    '/team/:path*',
    '/settings/:path*',
    '/login',
  ],
};