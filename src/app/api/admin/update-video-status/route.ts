
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest } from '@/lib/auth';

const updateStatusSchema = z.object({
  videoId: z.number(),
  status: z.enum(['approved', 'rejected']),
});

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user || !user.isAdmin) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
      
    const body = await request.json();
    const { videoId, status } = updateStatusSchema.parse(body);

    const db = await getDb();
    
    await db.run(
        'UPDATE videos SET status = ? WHERE id = ?',
        status,
        videoId
    );

    return NextResponse.json({ message: 'Video status updated successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Update Video Status Error:", error);
    return NextResponse.json({ message: 'An error occurred while updating video status' }, { status: 500 });
  }
}
