
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest } from '@/lib/auth';

const submitVideoSchema = z.object({
  videoUrl: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
        return NextResponse.json({ message: "Login required" }, { status: 401 });
    }

    const body = await request.json();
    const { videoUrl } = submitVideoSchema.parse(body);

    const db = await getDb();
    
    await db.run(
        'INSERT INTO videos (url, submittedByUserId, submittedAt, status) VALUES (?, ?, ?, ?)',
        videoUrl,
        user.id,
        new Date().toISOString(),
        'pending'
    );

    return NextResponse.json({ message: 'Video submitted successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Video Submission Error:", error);
    return NextResponse.json({ message: 'An error occurred during video submission' }, { status: 500 });
  }
}
