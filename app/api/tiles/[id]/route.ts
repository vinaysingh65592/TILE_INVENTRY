import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tileSchema } from '@/lib/types';
import { ZodError } from 'zod';
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tile = await db.tileInventory.findUnique({
      where: { id },
    });

    if (!tile) {
      return NextResponse.json({ success: false, error: 'Tile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tile });
  } catch (error: any) {
    console.error('Error fetching tile by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load tile record.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const validatedData = tileSchema.parse(body);

    const existingTile = await db.tileInventory.findUnique({
      where: { id },
    });

    if (!existingTile) {
      return NextResponse.json({ success: false, error: 'Tile record not found.' }, { status: 404 });
    }

    // Ensure section exists or create it
    const existingSection = await db.sectionConfig.findFirst({
      where: { code: validatedData.section },
    });

    if (!existingSection) {
      const prefix = validatedData.section.match(/^[A-Za-z]+/)?.[0] || 'GENERAL';
      await db.sectionConfig.create({
        data: {
          code: validatedData.section,
          prefix: prefix,
        },
      });
    }

    // Use transaction for update + audit log
    const result = await db.$transaction(async (tx) => {
      const updatedTile = await tx.tileInventory.update({
        where: { id },
        data: {
          tileDesignName: validatedData.tileDesignName,
          section: validatedData.section,
          position: validatedData.position,
          note: validatedData.note,
          lastUpdatedById: user.id,
          lastUpdatedByName: user.name,
        },
      });

      // Create audit log for tile edit
      await tx.inventoryAuditLog.create({
        data: {
          tileId: id,
          userId: user.id,
          userNameSnapshot: user.name,
          userRole: user.role,
          actionType: 'TILE_EDITED',
          previousQuantity: existingTile.quantity,
          newQuantity: existingTile.quantity,
          quantityChanged: 0,
          note: `Tile details edited by ${user.name}`,
        },
      });

      return updatedTile;
    });

    return NextResponse.json({
      success: true,
      message: 'Tile updated successfully.',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }

    if (error instanceof ZodError) {
      const issue = error.issues[0]?.message || 'Validation error';
      return NextResponse.json({ success: false, error: issue }, { status: 400 });
    }

    console.error('Error updating tile:', error);
    return NextResponse.json(
      { success: false, error: 'Could not update tile. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['SUPERVISOR']);
    const { id } = await params;

    const existingTile = await db.tileInventory.findUnique({
      where: { id },
    });

    if (!existingTile) {
      return NextResponse.json({ success: false, error: 'Tile record not found.' }, { status: 404 });
    }

    // Create audit log before deleting (cascade will delete logs too, so log the deletion action)
    // We'll do this in a transaction
    await db.$transaction(async (tx) => {
      // Create the deletion audit log
      await tx.inventoryAuditLog.create({
        data: {
          tileId: id,
          userId: user.id,
          userNameSnapshot: user.name,
          userRole: user.role,
          actionType: 'TILE_DELETED',
          previousQuantity: existingTile.quantity,
          newQuantity: 0,
          quantityChanged: -existingTile.quantity,
          note: `Tile "${existingTile.tileDesignName}" deleted from inventory by ${user.name}`,
        },
      });

      // Delete tile (this will cascade delete audit logs)
      await tx.tileInventory.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Tile removed from inventory.',
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      const errRes = authErrorResponse(error);
      return NextResponse.json(
        { success: false, error: errRes.error },
        { status: errRes.statusCode }
      );
    }

    console.error('Error deleting tile:', error);
    return NextResponse.json(
      { success: false, error: 'Could not delete tile. Please try again.' },
      { status: 500 }
    );
  }
}
