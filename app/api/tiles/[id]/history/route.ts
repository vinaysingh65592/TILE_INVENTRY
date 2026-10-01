import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth();

    const logs = await db.inventoryAuditLog.findMany({
      where: { tileId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json({ success: false, error: errRes.error }, { status: errRes.statusCode });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
