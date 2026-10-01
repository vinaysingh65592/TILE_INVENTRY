import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const tile = await db.displayTile.findUnique({
      where: { id },
    });

    if (!tile) {
      return NextResponse.json({ success: false, error: 'Display tile not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tile });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Failed to retrieve display tile.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['ADMIN', 'SALESMAN', 'SUPERVISOR']);
    const { id } = await params;

    const existing = await db.displayTile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Display tile not found.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      company,
      tileDesign,
      category,
      size,
      imageUrl,
      mrp,
      finalMrp,
      note,
    } = body;

    const updateData: any = {};
    if (company !== undefined) updateData.company = company.trim();
    if (tileDesign !== undefined) updateData.tileDesign = tileDesign.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (size !== undefined) updateData.size = size.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (mrp !== undefined) updateData.mrp = parseFloat(mrp);
    if (finalMrp !== undefined) updateData.finalMrp = parseFloat(finalMrp);
    if (note !== undefined) updateData.note = note ? note.trim() : null;

    const updatedTile = await db.displayTile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedTile,
      message: 'Display tile updated successfully.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error updating display tile:', error);
    return NextResponse.json({ success: false, error: 'Failed to update display tile.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN', 'SALESMAN', 'SUPERVISOR']);
    const { id } = await params;

    const existing = await db.displayTile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Display tile not found.' }, { status: 404 });
    }

    await db.displayTile.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tile removed from display panel successfully.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error deleting display tile:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove display tile.' }, { status: 500 });
  }
}
