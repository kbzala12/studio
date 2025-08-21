
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';
import type { DatabaseUser } from '@/lib/auth';

const loginSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = loginSchema.parse(body);

    const db = await getDb();
    const existingUser = await db.get<DatabaseUser>(
      'SELECT * FROM users WHERE name = ?',
      name
    );
    
    if (!existingUser) {
      return NextResponse.json(
        { message: 'Incorrect username or password' },
        { status: 400 }
      );
    }
    
    // In a real app, you MUST hash passwords. For this demo, we're using plain text.
    const validPassword = password === existingUser.password;
    if (!validPassword) {
      return NextResponse.json(
        { message: 'Incorrect username or password' },
        { status: 400 }
      );
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    
    const { password: _, ...user } = existingUser;
    return NextResponse.json({ message: 'Logged in successfully', user });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    console.error("Login Error:", error);
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}
