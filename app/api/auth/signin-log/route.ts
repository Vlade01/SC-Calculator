import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SigninAttempt from '@/models/SigninAttempt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, success, error } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required.' }, { status: 400 });
    }

    await dbConnect();

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    await SigninAttempt.create({
      email,
      userId: userId || undefined,
      success,
      ipAddress,
      userAgent,
      error: error || undefined
    });

    return NextResponse.json({ logged: true }, { status: 201 });
  } catch (err: unknown) {
    console.error('Signin log error', err);
    return NextResponse.json({ error: 'Failed to log signin attempt.' }, { status: 500 });
  }
}
