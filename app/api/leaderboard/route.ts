import { NextResponse } from 'next/server'
import { getGlobalLeaderboard } from '@/lib/leaderboard'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const country = searchParams.get('country') || undefined

    const leaderboard = await getGlobalLeaderboard(limit, country)

    return NextResponse.json(leaderboard)
}
