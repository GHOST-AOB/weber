import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function handleProxy(request: NextRequest) {
  const response = await new Promise<Response>((resolve) => {
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      const url = request.nextUrl.clone();
      const pathname = url.pathname;
      
      // Protected routes
      const protectedRoutes = ['/dashboard', '/projects', '/tasks', '/requests', '/invoices', '/clients', '/team', '/settings'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      
      // Login page - redirect if authenticated
      if (pathname === '/login' || pathname === '/') {
        if (session) {
          resolve(Response.redirect(new URL('/dashboard', request.url)));
          return;
        }
        resolve(new Response(null, { status: 200 }));
        return;
      }
      
      // Protected routes - redirect to login if not authenticated
      if (isProtectedRoute && !session) {
        resolve(Response.redirect(new URL('/login', request.url)));
        return;
      }
      
      resolve(new Response(null, { status: 200 }));
    });
  });

  return response;
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