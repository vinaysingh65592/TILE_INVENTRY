import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const { quantitySold } = body;

    if (!Number.isInteger(quantitySold) || quantitySold <= 0) {
      return NextResponse.json(
        { success: false, error: 'Sale quantity must be a whole number greater than 0.' },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const tile = await tx.tileInventory.findUnique({
        where: { id },
      });

      if (!tile) {
        throw new Error('Tile not found.');
      }

      if (quantitySold > tile.quantity) {
        throw new Error('Sale quantity cannot exceed available stock.');
      }

      const newQty = tile.quantity - quantitySold;

      const updatedTile = await tx.tileInventory.update({
        where: { id },
        data: {
          quantity: newQty,
          lastUpdatedById: user.id,
          lastUpdatedByName: user.name,
        },
      });

      await tx.inventoryAuditLog.create({
        data: {
          actionType: 'SALE',
          previousQuantity: tile.quantity,
          newQuantity: newQty,
          quantitySold: quantitySold,
          quantityChanged: -quantitySold,
          userNameSnapshot: user.name,
          userRole: user.role,
          userId: user.id,
          tileId: id,
        },
      });

      return {
        previousStock: tile.quantity,
        sold: quantitySold,
        currentStock: newQty,
        tile: updatedTile,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Sale recorded: ${result.sold} boxes sold.`,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not record sale.' },
      { status: 500 }
    );
  }
}
