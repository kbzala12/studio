
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHmac } from 'crypto';
import { getDb } from '@/lib/db';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const telegramAuthSchema = z.object({
  initData: z.string(),
});

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured in .env file");
}

// Function to validate the initData hash
function isValid(initData: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const dataCheckArr = [];
  // Important: The keys must be sorted alphabetically
  for (const [key, value] of Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    dataCheckArr.push(`${key}=${value}`);
  }
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  return hash === calculatedHash;
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData } = telegramAuthSchema.parse(body);

    if (!isValid(initData)) {
      return NextResponse.json({ message: 'Invalid data from Telegram. Hash does not match.' }, { status: 400 });
    }
    
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');

    if (!userParam) {
       return NextResponse.json({ message: 'User data not found in initData.' }, { status: 400 });
    }

    const telegramUser = JSON.parse(userParam);
    const telegramId = telegramUser.id.toString();
    
    const db = await getDb();
    let user = await db.get('SELECT * FROM users WHERE telegramId = ?', telegramId);
    
    if (!user) {
        // If user doesn't exist, create one. This matches the logic in the bot webhook.
        const name = telegramUser.username || `${telegramUser.first_name || ''}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`;
        
        // Check if name is already taken, if so, add a random suffix
        let finalName = name;
        const existingUserByName = await db.get('SELECT id FROM users WHERE name = ?', finalName);
        if (existingUserByName) {
            finalName = `${name}_${randomBytes(2).toString('hex')}`;
        }
        
        const userId = randomBytes(16).toString('hex');
        const password = randomBytes(4).toString('hex');
        
        await db.run(
            'INSERT INTO users (id, name, password, coins, isAdmin, telegramId) VALUES (?, ?, ?, ?, ?, ?)',
            userId,
            finalName,
            password,
            0,
            false,
            telegramId
        );
        user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    }
    
    if (!user) {
         return NextResponse.json({ message: 'Could not find or create user account.' }, { status: 500 });
    }

    // Create a session for the user
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return NextResponse.json({ message: 'Logged in successfully', userId: user.id });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Telegram Auth Error:", error);
    return NextResponse.json({ message: 'An error occurred during Telegram authentication' }, { status: 500 });
  }
}
