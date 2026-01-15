import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

    if (error) {
        return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(error_description || 'Authentication failed')}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
        if (!sessionError) {
            return NextResponse.redirect(`${siteUrl}${next}`)
        } else {
            return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(sessionError.message)}`)
        }
    }

    // Return to login with generic error if no code
    return NextResponse.redirect(`${siteUrl}/login?error=invalid_request`)
}
