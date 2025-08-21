
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest } from '@/lib/auth';

const REWARD_AMOUNT = 30;
const DAILY_COIN_LIMIT = 650;
const DAILY_GIFT_AMOUNT = 10;
const SUBSCRIBE_REWARD = 5;
const DAILY_SUBSCRIBE_COIN_LIMIT = 150;

const claimSchema = z.object({
  type: z.enum(['video', 'gift', 'subscribe']),
  entityId: z.string().optional(),
});

function getStartOfDay() {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return now.toISOString();
}

export async function POST(request: Request) {
    try {
        const { user } = await validateRequest();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, entityId } = claimSchema.parse(body);

        const db = await getDb();
        const now = new Date().toISOString();
        const startOfToday = getStartOfDay();
        let rewardAmount = 0;
        let responseData: any = {};

        const currentUser = await db.get('SELECT * FROM users WHERE id = ?', user.id);
        if (!currentUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (type === 'gift') {
            const lastGiftClaim = await db.get(`SELECT id FROM rewards WHERE userId = ? AND type = 'gift' AND claimedAt >= ?`, user.id, startOfToday);
            if (lastGiftClaim) {
                return NextResponse.json({ message: 'Daily gift already claimed.' }, { status: 400 });
            }
            rewardAmount = DAILY_GIFT_AMOUNT;
            responseData.nextGiftTimestamp = new Date().getTime() + 24 * 60 * 60 * 1000;
        } 
        else if (type === 'video') {
            if (!entityId) return NextResponse.json({ message: 'Video ID is required' }, { status: 400 });
            
            const dailyWatchData = await db.get(`SELECT SUM(amount) as total FROM rewards WHERE userId = ? AND type = 'video' AND claimedAt >= ?`, user.id, startOfToday);
            const dailyCoinsEarned = dailyWatchData?.total || 0;
            if (dailyCoinsEarned >= DAILY_COIN_LIMIT) {
                return NextResponse.json({ message: `Daily watch limit of ${DAILY_COIN_LIMIT} coins reached.` }, { status: 400 });
            }

            const videoRewardClaim = await db.get(`SELECT id FROM rewards WHERE userId = ? AND type = 'video' AND entityId = ? AND claimedAt >= ?`, user.id, entityId, startOfToday);
            if (videoRewardClaim) {
                return NextResponse.json({ message: 'Reward for this video already claimed today.' }, { status: 400 });
            }
            
            rewardAmount = REWARD_AMOUNT;
            responseData.newDailyAmount = dailyCoinsEarned + rewardAmount;
        } 
        else if (type === 'subscribe') {
            if (!entityId) return NextResponse.json({ message: 'Channel ID is required' }, { status: 400 });

            const dailySubData = await db.get(`SELECT SUM(amount) as total FROM rewards WHERE userId = ? AND type = 'subscribe' AND claimedAt >= ?`, user.id, startOfToday);
            const dailySubscribeCoinsEarned = dailySubData?.total || 0;
            if (dailySubscribeCoinsEarned >= DAILY_SUBSCRIBE_COIN_LIMIT) {
                return NextResponse.json({ message: `Daily subscription limit of ${DAILY_SUBSCRIBE_COIN_LIMIT} coins reached.` }, { status: 400 });
            }
            
            const existingSubscription = await db.get('SELECT id FROM subscriptions WHERE userId = ? AND channelId = ?', user.id, entityId);
            if(existingSubscription) {
                return NextResponse.json({ message: 'Already subscribed to this channel.' }, { status: 400 });
            }
            
            await db.run('INSERT INTO subscriptions (userId, channelId) VALUES (?, ?)', user.id, entityId);
            rewardAmount = SUBSCRIBE_REWARD;
            responseData.newDailySubAmount = dailySubscribeCoinsEarned + rewardAmount;
        }

        if (rewardAmount > 0) {
            await db.run('INSERT INTO rewards (userId, type, entityId, claimedAt, amount) VALUES (?, ?, ?, ?, ?)', user.id, type, entityId, now, rewardAmount);
            const newTotalCoins = currentUser.coins + rewardAmount;
            await db.run('UPDATE users SET coins = ? WHERE id = ?', newTotalCoins, user.id);
            responseData.newTotalCoins = newTotalCoins;
        }

        return NextResponse.json({ message: 'Reward claimed successfully', ...responseData });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
        }
        console.error("Claim Reward Error:", error);
        return NextResponse.json({ message: 'An error occurred while claiming reward' }, { status: 500 });
    }
}
