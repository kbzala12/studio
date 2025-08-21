
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
        return NextResponse.json({ message: "Login required to receive rewards." }, { status: 401 });
    }

    const db = await getDb();
    
    // Increment user's coins by 1
    await db.run(
        'UPDATE users SET coins = coins + 1 WHERE id = ?',
        user.id
    );
    
    const updatedUser = await db.get('SELECT coins FROM users WHERE id = ?', user.id);

    return NextResponse.json({ message: 'Coin awarded successfully', newCoinBalance: updatedUser.coins });

  } catch (error) {
    console.error("Coin Reward Error:", error);
    return NextResponse.json({ message: 'An error occurred while awarding coin' }, { status: 500 });
  }
}
