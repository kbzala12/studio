
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lucia, validateRequest } from '@/lib/auth';
import type { DatabaseUser } from '@/lib/auth';

const updateProfileSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters." }),
    currentPassword: z.string().min(1, { message: "Current password is required." }),
    newPassword: z.string().optional(),
}).refine((data) => {
    if (data.newPassword) {
        return data.newPassword.length >= 6;
    }
    return true;
}, {
    message: "New password must be at least 6 characters.",
    path: ["newPassword"],
});

const ADMIN_USERNAME = 'Zala kb 101';

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = updateProfileSchema.safeParse(body);

    if (!parsedBody.success) {
        return NextResponse.json({ message: parsedBody.error.errors[0].message }, { status: 400 });
    }

    const { name, currentPassword, newPassword } = parsedBody.data;

    const db = await getDb();
    const existingUser = await db.get<DatabaseUser>(
      'SELECT * FROM users WHERE id = ?',
      user.id
    );

    if (!existingUser) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check current password
    if (existingUser.password !== currentPassword) {
        return NextResponse.json({ message: 'The current password you entered is incorrect.' }, { status: 400 });
    }
    
    // Prevent admin from changing their name
    if (existingUser.name.toLowerCase() === ADMIN_USERNAME.toLowerCase() && name.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) {
         return NextResponse.json({ message: 'Admin username cannot be changed.' }, { status: 403 });
    }

    // Handle name change
    if (name !== existingUser.name) {
        // Prevent normal user from taking admin name
        if (name.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
             return NextResponse.json({ message: 'This name is reserved.' }, { status: 400 });
        }
        const userWithNewName = await db.get('SELECT id FROM users WHERE name = ?', name);
        if (userWithNewName) {
            return NextResponse.json({ message: 'This name is already in use.' }, { status: 400 });
        }
        await db.run('UPDATE users SET name = ? WHERE id = ?', name, user.id);
    }
    
    // Handle password change
    if (newPassword) {
        await db.run('UPDATE users SET password = ? WHERE id = ?', newPassword, user.id);
    }

    // Invalidate all of the user's sessions
    await lucia.invalidateUserSessions(user.id);
    
    // Create a new session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    const response = NextResponse.json({ message: 'Profile updated successfully' });
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return response;


  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ message: 'An error occurred while updating the profile' }, { status: 500 });
  }
}

    