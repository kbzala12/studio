
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const db = await getDb();

    // Simplified query without user join
    const videos = await db.all(`
        SELECT id, url, submittedByUserId as submittedBy, submittedAt, status
        FROM videos
        ORDER BY submittedAt DESC
    `);
    
    // No users to fetch
    const users: any[] = [];

    return NextResponse.json({ videos, users });

  } catch (error) {
    console.error("Admin Data Fetching Error:", error);
    return NextResponse.json({ message: 'An error occurred while fetching admin data' }, { status: 500 });
  }
}
