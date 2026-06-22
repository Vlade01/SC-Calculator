import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    await dbConnect();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // generate a simple unique username (email local part + timestamp suffix)
    const local = email.split('@')[0] || 'user';
    const username = `${local}_${Date.now().toString(36)}`;
    await User.create({ username, email, password: hashedPassword });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error("Signup error", error);
    return NextResponse.json({ error: "Unable to create user." }, { status: 500 });
  }
}
