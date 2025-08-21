
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
    const parsedBody = loginSchema.safeParse(body);
    
    if(!parsedBody.success) {
        return NextResponse.json({ message: parsedBody.error.errors[0].message }, { status: 400 });
    }

    const { name, password } = parsedBody.data;

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
    
    // Plain text password comparison as per app's original design
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

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}
