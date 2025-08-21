
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const signupSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const ADMIN_USERNAME = 'Zala kb 101';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = signupSchema.safeParse(body);
    
    if(!parsedBody.success) {
        return NextResponse.json({ message: parsedBody.error.errors[0].message }, { status: 400 });
    }

    const { name, password } = parsedBody.data;

    const db = await getDb();

    // Prevent users from signing up with the admin's name
    if (name.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
         return NextResponse.json({ message: 'This name is reserved.' }, { status: 400 });
    }

    const existingUser = await db.get('SELECT id FROM users WHERE name = ?', name);
    if (existingUser) {
      return NextResponse.json({ message: 'This name is already in use.' }, { status: 400 });
    }
    
    const userId = randomBytes(16).toString('hex');

    await db.run(
      'INSERT INTO users (id, name, password, coins, isAdmin) VALUES (?, ?, ?, ?, ?)',
      userId,
      name,
      password, // Storing password in plain text as per app's original design
      0,
      false
    );

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
	  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    
    const newUser = await db.get('SELECT id, name, coins, isAdmin FROM users WHERE id = ?', userId);

    return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });
  
  } catch (error: any) {
    console.error('Signup Error:', error);
    // Generic error for unexpected issues
    return NextResponse.json({ message: 'An error occurred during signup.' }, { status: 500 });
  }
}
