import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './routing';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 100; // requests
const WINDOW = 60 * 1000; // 1 minute

// Create intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

    if (request.nextUrl.pathname.startsWith('/api/debug-stats')) {
        return NextResponse.next();
    }

    const now = Date.now();
    const clientData = rateLimitMap.get(ip) ?? { count: 0, lastReset: now };

    if (now - clientData.lastReset > WINDOW) {
        clientData.count = 1;
        clientData.lastReset = now;
    } else {
        clientData.count++;
    }

    rateLimitMap.set(ip, clientData);

    if (clientData.count > LIMIT) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Too many requests. Please try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Handle locale routing with intl middleware
    const intlResponse = intlMiddleware(request);

    // If intl middleware returns a response (redirect), use it
    if (intlResponse) {
        return intlResponse;
    }

    // Otherwise handle Supabase session
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Static assets (images, etc.)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$|.*\\.webp$|.*\\.ico$).*)',
    ],
}
