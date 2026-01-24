import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Try to parse body content if available
        let bodyAvatarUrl = null;
        try {
            const body = await request.json();
            bodyAvatarUrl = body.avatarUrl || body.avatar_url;
        } catch (e) {
            // Ignore if body is not valid JSON
        }

        // Check if user already exists in DB
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
        })

        // Determine final avatar URL
        // Priority: 1. Request Body (Explicit update) -> 2. Database (Source of truth) -> 3. Metadata (Fallback/New)
        let finalAvatarUrl = bodyAvatarUrl;

        if (finalAvatarUrl === null || finalAvatarUrl === undefined) {
            if (existingUser) {
                finalAvatarUrl = existingUser.avatarUrl;
            } else {
                finalAvatarUrl = user.user_metadata?.avatar_url || null;
            }
        }

        // Sync avatar back to Supabase metadata if different
        // This ensures Supabase Auth always reflects the DB state (or the new update)
        if (finalAvatarUrl !== user.user_metadata?.avatar_url) {
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: finalAvatarUrl }
            });
            if (updateError) {
                console.error('Failed to update Supabase metadata:', updateError);
            }
        }

        if (existingUser) {
            // Update existing user
            const updatedUser = await prisma.user.update({
                where: { email: user.email! },
                data: {
                    fullName: existingUser.fullName || user.user_metadata?.full_name,
                    avatarUrl: finalAvatarUrl, // Use the determined authoritative URL
                }
            })
            return NextResponse.json({ user: updatedUser, action: 'updated' })
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email: user.email!,
                fullName: user.user_metadata?.full_name || null,
                role: 'STUDENT',
                avatarUrl: finalAvatarUrl,
            }
        })

        return NextResponse.json({ user: newUser, action: 'created' })
    } catch (error) {
        console.error('Sync user error:', error)
        return NextResponse.json(
            { error: 'Failed to sync user' },
            { status: 500 }
        )
    }
}
