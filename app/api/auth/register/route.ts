import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';

const ALLOWED_ROLES = ['SUPERVISOR', 'SALESMAN'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, password, role } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name is required (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check alphanumeric / underscores only
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, error: 'Username can only contain letters, numbers, and underscores.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    const upperRole = role?.trim()?.toUpperCase();
    if (!upperRole || !ALLOWED_ROLES.includes(upperRole as any)) {
      return NextResponse.json(
        { success: false, error: 'Role must be either SUPERVISOR or SALESMAN.' },
        { status: 400 }
      );
    }

    // 2. Check if username is already taken
    const existingUser = await db.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Username "${cleanUsername}" is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // 3. Hash password and create user with PENDING verification status
    const passwordHash = hashPassword(password);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        passwordHash,
        role: upperRole,
        isActive: false,
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        pendingApproval: true,
        message: `Registration submitted successfully for ${newUser.name}! Your account is pending verification by an administrator.`,
        user: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          status: newUser.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
