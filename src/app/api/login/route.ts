
import { lucia } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as argon2 from 'argon2';

const loginSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, password } = loginSchema.parse(body);

        const db = await getDb();
        
        const existingUser = await db.get('SELECT * FROM users WHERE name = ?', name);
        if (!existingUser) {
            return NextResponse.json({ error: "Incorrect username or password" }, { status: 400 });
        }

        const validPassword = await argon2.verify(existingUser.password, password);
        if (!validPassword) {
            return NextResponse.json({ error: "Incorrect username or password" }, { status: 400 });
        }

        const session = await lucia.createSession(existingUser.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        
        const { password: _, ...user } = existingUser;
        return NextResponse.json({ user });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Login Error:", error);
        return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
    }
}
