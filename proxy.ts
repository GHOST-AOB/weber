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
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Login page - redirect if authenticated
  if (pathname === '/login' || pathname === '/') {
    if (session) {
      return Response.redirect(new URL('/dashboard', request.url));
    }
    return new Response(null, { status: 200 });
  }

  // Protected routes - redirect to login if not authenticated
  if (isProtectedRoute && !session) {
    return Response.redirect(new URL('/login', request.url));
  }

  return new Response(null, { status: 200 });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/tasks/:path*',
    '/requests/:path*',
    '/invoices/:path*',
    '/clients/:path*',
    '/team/:path*',
    '/settings/:path*',
    '/login',
    '/',
  ],
};