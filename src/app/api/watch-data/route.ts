
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';

const DAILY_COIN_LIMIT = 650;
const DAILY_SUBSCRIBE_COIN_LIMIT = 150;

function getStartOfDay() {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return now.toISOString();
}

export async function GET(request: Request) {
    try {
        const { user } = await validateRequest();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');
        if (!videoId) {
            return NextResponse.json({ message: 'Video ID is required' }, { status: 400 });
        }
        
        const db = await getDb();
        const startOfToday = getStartOfDay();

        // Get user's current coins
        const userData = await db.get('SELECT * FROM users WHERE id = ?', user.id);

        // Get total coins earned today from watching videos
        const dailyWatchData = await db.get(
            `SELECT SUM(amount) as total FROM rewards WHERE userId = ? AND type = 'video' AND claimedAt >= ?`,
            user.id,
            startOfToday
        );
        const dailyCoinsEarned = dailyWatchData?.total || 0;

        // Get total coins earned today from subscriptions
        const dailySubscribeData = await db.get(
            `SELECT SUM(amount) as total FROM rewards WHERE userId = ? AND type = 'subscribe' AND claimedAt >= ?`,
            user.id,
            startOfToday
        );
        const dailySubscribeCoinsEarned = dailySubscribeData?.total || 0;

        // Check if daily gift has been claimed
        const lastGiftClaim = await db.get(
            `SELECT claimedAt FROM rewards WHERE userId = ? AND type = 'gift' AND claimedAt >= ?`,
            user.id,
            startOfToday
        );
        let nextGiftTimestamp: number | null = null;
        if(lastGiftClaim) {
            // Can claim again in 24 hours
            nextGiftTimestamp = new Date(lastGiftClaim.claimedAt).getTime() + 24 * 60 * 60 * 1000;
        }

        // Check if reward for this specific video has been claimed today
        const videoRewardClaim = await db.get(
            `SELECT id FROM rewards WHERE userId = ? AND type = 'video' AND entityId = ? AND claimedAt >= ?`,
            user.id,
            videoId,
            startOfToday
        );
        const rewardClaimedForVideo = !!videoRewardClaim;

        // Check if user is subscribed to the channel
        const { searchParams: videoParams } = new URL(request.url.replace('/api/watch-data', ''));
        const channelId = videoParams.get('channel');
        let isSubscribedToChannel = false;
        if (channelId) {
            const subscription = await db.get('SELECT id FROM subscriptions WHERE userId = ? AND channelId = ?', user.id, channelId);
            isSubscribedToChannel = !!subscription;
        }

        return NextResponse.json({
            user: { id: userData.id, name: userData.name, coins: userData.coins, isAdmin: userData.isAdmin },
            dailyCoinsEarned,
            dailySubscribeCoinsEarned,
            nextGiftTimestamp,
            rewardClaimedForVideo,
            isSubscribedToChannel
        });

    } catch (error) {
        console.error("Watch Data Fetching Error:", error);
        return NextResponse.json({ message: 'An error occurred while fetching watch data' }, { status: 500 });
    }
}
