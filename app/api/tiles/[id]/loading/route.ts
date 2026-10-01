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
    const { quantityLoaded, vehicleNumber, referenceNumber } = body;

    if (!Number.isInteger(quantityLoaded) || quantityLoaded <= 0) {
      return NextResponse.json(
        { success: false, error: 'Loading quantity must be a whole number greater than 0.' },
        { status: 400 }
      );
    }

    if (!vehicleNumber || typeof vehicleNumber !== 'string' || vehicleNumber.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Vehicle number is required.' },
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

      if (quantityLoaded > tile.quantity) {
        throw new Error('Loading quantity cannot exceed available stock.');
      }

      const remainingQty = tile.quantity - quantityLoaded;

      const updatedTile = await tx.tileInventory.update({
        where: { id },
        data: {
          quantity: remainingQty,
          lastUpdatedById: user.id,
          lastUpdatedByName: user.name,
        },
      });

      await tx.inventoryAuditLog.create({
        data: {
          actionType: 'LOADING',
          previousQuantity: tile.quantity,
          newQuantity: remainingQty,
          quantityLoaded: quantityLoaded,
          quantityChanged: -quantityLoaded,
          vehicleNumber: vehicleNumber.trim(),
          referenceNumber: referenceNumber?.trim() || null,
          userNameSnapshot: user.name,
          userRole: user.role,
          userId: user.id,
          tileId: id,
        },
      });

      return {
        previousStock: tile.quantity,
        loaded: quantityLoaded,
        remaining: remainingQty,
        vehicleNumber: vehicleNumber.trim(),
        tile: updatedTile,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Loading recorded: ${result.loaded} boxes loaded to vehicle ${result.vehicleNumber}.`,
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
      { success: false, error: error instanceof Error ? error.message : 'Could not record loading.' },
      { status: 500 }
    );
  }
}
