
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const videos = await db.all(`
        SELECT v.id, v.url, u.name as submittedBy, v.submittedAt, v.status
        FROM videos v
        JOIN users u ON v.submittedByUserId = u.id
        ORDER BY v.submittedAt DESC
    `);

    const users = await db.all('SELECT id, name, coins, isAdmin FROM users');

    return NextResponse.json({ videos, users });

  } catch (error) {
    console.error("Admin Data Fetching Error:", error);
    return NextResponse.json({ message: 'An error occurred while fetching admin data' }, { status: 500 });
  }
}
