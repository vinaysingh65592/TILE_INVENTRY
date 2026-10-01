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

    const material = await db.material.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json({ success: false, error: 'Material not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Failed to retrieve material.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN', 'SALESMAN', 'SUPERVISOR']);
    const { id } = await params;

    const existing = await db.material.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Material not found.' }, { status: 404 });
    }

    const body = await request.json();
    const {
      company,
      materialName,
      weight,
      category,
      mrp,
      finalMrp,
      note,
    } = body;

    const updateData: any = {};
    if (company !== undefined) updateData.company = company.trim();
    if (materialName !== undefined) updateData.materialName = materialName.trim();
    if (weight !== undefined) updateData.weight = weight.trim();
    if (category !== undefined) updateData.category = category ? category.trim() : null;
    if (mrp !== undefined) updateData.mrp = parseFloat(mrp);
    if (finalMrp !== undefined) updateData.finalMrp = parseFloat(finalMrp);
    if (note !== undefined) updateData.note = note ? note.trim() : null;

    const updatedMaterial = await db.material.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedMaterial,
      message: 'Material updated successfully.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error updating material:', error);
    return NextResponse.json({ success: false, error: 'Failed to update material.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN', 'SALESMAN', 'SUPERVISOR']);
    const { id } = await params;

    const existing = await db.material.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Material not found.' }, { status: 404 });
    }

    await db.material.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully from material panel.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error deleting material:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete material.' }, { status: 500 });
  }
}
