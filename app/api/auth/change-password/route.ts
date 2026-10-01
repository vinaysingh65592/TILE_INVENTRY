import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse, AuthError, hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 4 characters long.' },
        { status: 400 }
      );
    }

    // Retrieve fresh user record with passwordHash
    const user = await db.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    // Verify current password
    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password is required.' },
        { status: 400 }
      );
    }

    const isCurrentValid = verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    // Prevent reusing identical password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password.' },
        { status: 400 }
      );
    }

    // Hash new password and clear mustChangePassword flag
    const newPasswordHash = hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully! Your account is now secured with your new password.',
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not change password. Please try again.' },
      { status: 500 }
    );
  }
}
