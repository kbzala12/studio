
import { validateRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse(null, { status: 204 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
