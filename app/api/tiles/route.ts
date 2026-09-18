import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tileSchema } from '@/lib/types';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const section = searchParams.get('section')?.trim() || '';
    const position = searchParams.get('position')?.trim() || '';
    const sort = searchParams.get('sort')?.trim() || 'newest';

    // Build Prisma query clauses
    const where: any = {};

    if (search) {
      where.tileDesignName = {
        contains: search,
      };
    }

    if (section && section !== 'ALL') {
      // If section is a prefix like "SECTION_A", filter by section starting with "A"
      if (section.startsWith('PREFIX_')) {
        const prefix = section.replace('PREFIX_', '');
        where.section = { startsWith: prefix };
      } else {
        where.section = { equals: section };
      }
    }

    if (position && position !== 'ALL') {
      where.position = position;
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'name_asc') {
      orderBy = { tileDesignName: 'asc' };
    } else if (sort === 'name_desc') {
      orderBy = { tileDesignName: 'desc' };
    } else if (sort === 'section') {
      orderBy = { section: 'asc' };
    }

    const tiles = await db.tileInventory.findMany({
      where,
      orderBy,
    });

    return NextResponse.json({
      success: true,
      data: tiles,
      count: tiles.length,
    });
  } catch (error: any) {
    console.error('Error fetching tiles:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load inventory. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate body schema
    const validatedData = tileSchema.parse(body);

    // 2. Validate that the section exists in sectionConfig
    const existingSection = await db.sectionConfig.findFirst({
      where: { code: validatedData.section },
    });

    if (!existingSection) {
      // Auto-create section if it's a valid code structure or return error
      // Let's create it automatically so warehouse worker flow is uninterrupted
      const prefix = validatedData.section.match(/^[A-Za-z]+/)?.[0] || 'GENERAL';
      await db.sectionConfig.create({
        data: {
          code: validatedData.section,
          prefix: prefix,
        },
      });
    }

    // 3. Create tile inventory record
    const newTile = await db.tileInventory.create({
      data: {
        tileDesignName: validatedData.tileDesignName,
        section: validatedData.section,
        position: validatedData.position,
        note: validatedData.note,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Tile successfully added to inventory.',
        data: newTile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      const issue = error.issues[0]?.message || 'Validation error';
      return NextResponse.json({ success: false, error: issue }, { status: 400 });
    }

    console.error('Error adding tile:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save tile. Please try again.' },
      { status: 500 }
    );
  }
}
