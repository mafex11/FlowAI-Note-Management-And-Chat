import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  try {
    // Manage route protection
    // Pass the NEXTAUTH_SECRET directly rather than referencing environment variable
    // This can sometimes be an issue due to how Next.js handles environment variables in middleware
    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req });
    
    console.log(`Middleware: Path: ${pathname}, Token exists: ${!!token}`);
    
    const isAuth = !!token;
    const isAuthPage = pathname.startsWith('/auth');
    const isDashboardPage = pathname.startsWith('/dashboard');
    
    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      console.log('Middleware: Authenticated user trying to access auth page, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Redirect unauthenticated users to login page
    if (isDashboardPage && !isAuth) {
      console.log('Middleware: Unauthenticated user trying to access dashboard, redirecting to signin');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    // For all other cases, proceed normally
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, allow the request to continue to avoid blocking users
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}; 