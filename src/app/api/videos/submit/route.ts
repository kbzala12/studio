
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest } from '@/lib/auth';

const UPLOAD_COST = 1250;

const submitVideoSchema = z.object({
  videoUrl: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { videoUrl } = submitVideoSchema.parse(body);

    const db = await getDb();
    
    // Check if user has enough coins
    const currentUser = await db.get('SELECT * FROM users WHERE id = ?', user.id);
    if (!currentUser || currentUser.coins < UPLOAD_COST) {
        return NextResponse.json({ message: `You need at least ${UPLOAD_COST} coins to upload a video.` }, { status: 400 });
    }

    // Deduct coins
    const newTotalCoins = currentUser.coins - UPLOAD_COST;
    await db.run('UPDATE users SET coins = ? WHERE id = ?', newTotalCoins, user.id);
    
    // Add video to the database
    await db.run(
        'INSERT INTO videos (url, submittedByUserId, submittedAt, status) VALUES (?, ?, ?, ?)',
        videoUrl,
        user.id,
        new Date().toISOString(),
        'pending'
    );

    return NextResponse.json({ message: 'Video submitted successfully', newTotalCoins });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Video Submission Error:", error);
    return NextResponse.json({ message: 'An error occurred during video submission' }, { status: 500 });
  }
}
