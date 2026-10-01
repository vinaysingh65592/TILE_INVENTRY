import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

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
        { materialName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { weight: { contains: search, mode: 'insensitive' } },
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
      orderBy = { materialName: 'asc' };
    } else if (sort === 'company_asc') {
      orderBy = { company: 'asc' };
    }

    const materials = await db.material.findMany({
      where,
      orderBy,
    });

    return NextResponse.json({
      success: true,
      data: materials,
      count: materials.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve materials.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Both ADMIN and SALESMAN can record materials
    const user = await requireAuth(['ADMIN', 'SALESMAN', 'SUPERVISOR']);

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

    if (!company || !company.trim()) {
      return NextResponse.json({ success: false, error: 'Material company / brand is required.' }, { status: 400 });
    }

    if (!materialName || !materialName.trim()) {
      return NextResponse.json({ success: false, error: 'Material name is required.' }, { status: 400 });
    }

    if (!weight || !weight.trim()) {
      return NextResponse.json({ success: false, error: 'Weight / pack size is required (e.g. 20 kg).' }, { status: 400 });
    }

    const numMrp = parseFloat(mrp);
    const numFinalMrp = parseFloat(finalMrp);

    if (isNaN(numMrp) || numMrp < 0) {
      return NextResponse.json({ success: false, error: 'Valid MRP is required.' }, { status: 400 });
    }

    if (isNaN(numFinalMrp) || numFinalMrp < 0) {
      return NextResponse.json({ success: false, error: 'Valid Final MRP is required.' }, { status: 400 });
    }

    const newMaterial = await db.material.create({
      data: {
        company: company.trim(),
        materialName: materialName.trim(),
        weight: weight.trim(),
        category: category?.trim() || null,
        mrp: numMrp,
        finalMrp: numFinalMrp,
        note: note?.trim() || null,
        addedById: user.id,
        addedByName: user.name,
        addedByRole: user.role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newMaterial,
        message: 'Material recorded successfully in material panel.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error adding material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record material.' },
      { status: 500 }
    );
  }
}
