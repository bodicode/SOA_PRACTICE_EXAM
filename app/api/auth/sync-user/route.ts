import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
        })

        if (existingUser) {
            // Update existing user
            const updatedUser = await prisma.user.update({
                where: { email: user.email! },
                data: {
                    fullName: user.user_metadata?.full_name || existingUser.fullName,
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
