import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse, AuthError, hashPassword } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const { temporaryPassword } = body;

    if (!temporaryPassword || typeof temporaryPassword !== 'string' || temporaryPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Temporary password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    const passwordHash = hashPassword(temporaryPassword);

    await db.user.update({
      where: { id: targetUser.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        isActive: true,
        status: 'APPROVED',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Temporary password set for ${targetUser.name}. They will be required to change it when signing in.`,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not reset member password.' },
      { status: 500 }
    );
  }
}
