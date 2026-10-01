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
    const { newQuantity } = body;

    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a whole number (0 or more).' },
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

      const difference = newQuantity - tile.quantity;

      const updatedTile = await tx.tileInventory.update({
        where: { id },
        data: {
          quantity: newQuantity,
          lastUpdatedById: user.id,
          lastUpdatedByName: user.name,
        },
      });

      await tx.inventoryAuditLog.create({
        data: {
          actionType: 'QUANTITY_UPDATE',
          previousQuantity: tile.quantity,
          newQuantity: newQuantity,
          quantityChanged: difference,
          userNameSnapshot: user.name,
          userRole: user.role,
          userId: user.id,
          tileId: id,
        },
      });

      return {
        previous: tile.quantity,
        current: newQuantity,
        difference,
        tile: updatedTile,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully.',
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
      { success: false, error: error instanceof Error ? error.message : 'Could not update stock.' },
      { status: 500 }
    );
  }
}
