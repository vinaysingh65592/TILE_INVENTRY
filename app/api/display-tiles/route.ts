import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const company = searchParams.get('company')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const sort = searchParams.get('sort')?.trim() || 'newest';

    const where: any = {};

    if (search) {
      where.OR = [
        { tileDesign: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (company && company !== 'ALL') {
      where.company = { equals: company, mode: 'insensitive' };
    }

    if (category && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'price_asc') {
      orderBy = { finalMrp: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { finalMrp: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { tileDesign: 'asc' };
    } else if (sort === 'company_asc') {
      orderBy = { company: 'asc' };
    }

    const displayTiles = await db.displayTile.findMany({
      where,
      orderBy,
    });

    return NextResponse.json({
      success: true,
      data: displayTiles,
      count: displayTiles.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error fetching display tiles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve display tiles.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Both ADMIN and SALESMAN can add tiles to display panel
    const user = await requireAuth(['ADMIN', 'SALESMAN', 'SUPERVISOR']);

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
      tileInventoryId,
    } = body;

    if (!company || !company.trim()) {
      return NextResponse.json({ success: false, error: 'Company / Brand is required.' }, { status: 400 });
    }

    if (!tileDesign || !tileDesign.trim()) {
      return NextResponse.json({ success: false, error: 'Tile design name is required.' }, { status: 400 });
    }

    if (!category || !category.trim()) {
      return NextResponse.json({ success: false, error: 'Tile category is required.' }, { status: 400 });
    }

    if (!size || !size.trim()) {
      return NextResponse.json({ success: false, error: 'Tile size is required.' }, { status: 400 });
    }

    const numMrp = parseFloat(mrp);
    const numFinalMrp = parseFloat(finalMrp);

    if (isNaN(numMrp) || numMrp < 0) {
      return NextResponse.json({ success: false, error: 'Valid MRP is required.' }, { status: 400 });
    }

    if (isNaN(numFinalMrp) || numFinalMrp < 0) {
      return NextResponse.json({ success: false, error: 'Valid Final MRP is required.' }, { status: 400 });
    }

    const newDisplayTile = await db.displayTile.create({
      data: {
        company: company.trim(),
        tileDesign: tileDesign.trim(),
        category: category.trim(),
        size: size.trim(),
        imageUrl: imageUrl?.trim() || null,
        mrp: numMrp,
        finalMrp: numFinalMrp,
        note: note?.trim() || null,
        tileInventoryId: tileInventoryId?.trim() || null,
        addedById: user.id,
        addedByName: user.name,
        addedByRole: user.role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newDisplayTile,
        message: 'Tile successfully added to customer display panel.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error adding tile to display:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add tile to display panel.' },
      { status: 500 }
    );
  }
}
