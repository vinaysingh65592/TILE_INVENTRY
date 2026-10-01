import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuth(['ADMIN']);

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            auditLogs: true,
          },
        },
      },
      orderBy: [
        { status: 'desc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve user list.' },
      { status: 500 }
    );
  }
}
