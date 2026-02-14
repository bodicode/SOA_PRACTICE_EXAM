import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './routing';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 100;
const WINDOW = 60 * 1000;

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

    // Explicit redirect for root path to /en
    if (request.nextUrl.pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/vi';
        return NextResponse.redirect(url);
    }

    const handleI18nResponse = intlMiddleware(request);

    const supabaseResponse = await updateSession(request);

    if (supabaseResponse.headers.has('set-cookie')) {
        const newCookies = supabaseResponse.cookies.getAll();
        newCookies.forEach(cookie => {
            handleI18nResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
    }

    return handleI18nResponse;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$|.*\\.webp$|.*\\.ico$|.*\\.json$|.*\\.mjs$).*)',
    ],
}