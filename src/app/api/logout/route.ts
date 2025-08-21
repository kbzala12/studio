
import { lucia, validateRequest } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const { session } = await validateRequest();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await lucia.invalidateSession(session.id);

        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return NextResponse.json({ message: "Logged out" });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }
}
