
import { lucia, validateRequest } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const { session } = await validateRequest();
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await lucia.invalidateSession(session.id);

        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return NextResponse.json({ message: 'Logged out successfully' });
    } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}
