import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/projects', '/tasks', '/requests', '/invoices', '/clients', '/team', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Login page - redirect if already logged in
  if (request.nextUrl.pathname === '/login') {
    if (session) {
      return Response.redirect(new URL('/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // Protected routes - redirect to login if not authenticated
  if (isProtectedRoute && !session) {
    return Response.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
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
  ],
};