
import { Lucia } from 'lucia';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Session, User } from 'lucia';
import { getDb } from './db';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import type { Database } from 'sqlite';

export interface DatabaseUser {
	id: string; 
	name: string;
	coins: number;
  isAdmin: boolean;
  password?: string;
  telegramId?: string | null;
}

// This is a bit of a hack to get the raw driver instance for the adapter.
// The adapter needs the raw `better-sqlite3` database object, not the `sqlite` wrapper.
const adapter = new BetterSqlite3Adapter((await getDb()).driver, {
    user: 'users',
    session: 'sessions'
});


export const lucia = new Lucia(adapter, {
	sessionCookie: {
		// this sets cookies with super long expiration
		// since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
		expires: false,
		attributes: {
			// set to `true` when using HTTPS
			secure: process.env.NODE_ENV === 'production'
		}
	},
    getUserAttributes: (attributes) => {
		return {
			name: attributes.name,
			coins: attributes.coins,
      isAdmin: attributes.isAdmin,
      telegramId: attributes.telegramId,
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
		// next.js throws when you attempt to set cookie when rendering page
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
    DatabaseUserAttributes: Omit<DatabaseUser, "id" | "password">;
	}
}
