
import { Lucia } from 'lucia';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Session, User } from 'lucia';
import { getDb } from './db';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';

export interface DatabaseUser {
	id: number;
	name: string;
	coins: number;
    isAdmin: boolean;
    password?: string;
}

const db = await getDb();
const adapter = new BetterSqlite3Adapter(db, {
    user: 'users',
    session: 'sessions'
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production'
		}
	},
    getUserAttributes: (attributes) => {
		return {
			name: attributes.name,
			coins: attributes.coins,
            isAdmin: attributes.isAdmin
		};
	}
});

export const validateRequest = cache(
	async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
		const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
		if (!sessionId) {
			return {
				user: null,
				session: null
			};
		}

		const result = await lucia.validateSession(sessionId);
		try {
			if (result.session && result.session.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id);
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
			if (!result.session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			}
		} catch {}
		return result;
	}
);


declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
        DatabaseUserAttributes: Omit<DatabaseUser, "id">;
	}
}
