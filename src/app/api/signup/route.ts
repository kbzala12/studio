
import { lucia } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';

const signupSchema = z.object({
    name: z.string().min(3).max(31),
    password: z.string().min(6).max(255),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, password } = signupSchema.parse(body);
        
        const db = await getDb();
        
        const existingUser = await db.get('SELECT id FROM users WHERE name = ?', name);
        if (existingUser) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }
        
        const userId = randomBytes(16).toString('hex');
        const hashedPassword = await argon2.hash(password);

        await db.run(
            'INSERT INTO users (id, name, password) VALUES (?, ?, ?)',
            userId,
            name,
            hashedPassword
        );
        
        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        const newUser = await db.get('SELECT id, name, coins, isAdmin FROM users WHERE id = ?', userId);

        return NextResponse.json({ user: newUser });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Signup Error:", error);
        return NextResponse.json({ error: 'An error occurred during signup' }, { status: 500 });
    }
}
