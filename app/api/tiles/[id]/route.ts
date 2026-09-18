import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tileSchema } from '@/lib/types';
import { ZodError } from 'zod';

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

    const updatedTile = await db.tileInventory.update({
      where: { id },
      data: {
        tileDesignName: validatedData.tileDesignName,
        section: validatedData.section,
        position: validatedData.position,
        note: validatedData.note,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tile updated successfully.',
      data: updatedTile,
    });
  } catch (error: any) {
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
    const { id } = await params;
    const existingTile = await db.tileInventory.findUnique({
      where: { id },
    });

    if (!existingTile) {
      return NextResponse.json({ success: false, error: 'Tile record not found.' }, { status: 404 });
    }

    await db.tileInventory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tile removed from inventory.',
    });
  } catch (error: any) {
    console.error('Error deleting tile:', error);
    return NextResponse.json(
      { success: false, error: 'Could not delete tile. Please try again.' },
      { status: 500 }
    );
  }
}
