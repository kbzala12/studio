
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    
    // Selecting all users but excluding the password for security.
    const users = await db.all('SELECT id, name, coins, isAdmin FROM users');

    return NextResponse.json(users);

  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ message: 'An error occurred while fetching users' }, { status: 500 });
  }
}
