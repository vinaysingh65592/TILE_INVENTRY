import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth';

const VALID_ROLES = ['ADMIN', 'SUPERVISOR', 'SALESMAN'];
const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(['ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const { status, isActive, role } = body;

    const targetUser = await db.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User record not found.' },
        { status: 404 }
      );
    }

    // Safety check: Cannot deactivate or demote own admin account
    if (targetUser.id === admin.id) {
      if (isActive === false) {
        return NextResponse.json(
          { success: false, error: 'You cannot deactivate your own administrator account.' },
          { status: 400 }
        );
      }
      if (role && role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'You cannot change your own administrator role.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid verification status value.' },
          { status: 400 }
        );
      }
      updateData.status = status;
      // Auto-activate if approved
      if (status === 'APPROVED' && isActive === undefined) {
        updateData.isActive = true;
      } else if (status === 'REJECTED' && isActive === undefined) {
        updateData.isActive = false;
      }
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role value.' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name} updated successfully.`,
      data: updatedUser,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Could not update user settings.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(['ADMIN']);
    const { id } = await params;

    const targetUser = await db.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User record not found.' },
        { status: 404 }
      );
    }

    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own administrator account.' },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} has been removed.`,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Could not remove user.' },
      { status: 500 }
    );
  }
}
