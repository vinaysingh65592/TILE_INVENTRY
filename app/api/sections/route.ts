import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const sections = await db.sectionConfig.findMany({
      orderBy: [{ prefix: 'asc' }, { code: 'asc' }],
    });

    // Custom sort helper to order numerical parts accurately (A1, A2 ... A10 instead of A1, A10, A2)
    const sortedSections = sections.sort((a, b) => {
      if (a.prefix !== b.prefix) return a.prefix.localeCompare(b.prefix);
      const numA = parseInt(a.code.replace(/^\D+/g, ''), 10) || 0;
      const numB = parseInt(b.code.replace(/^\D+/g, ''), 10) || 0;
      return numA - numB;
    });

    return NextResponse.json({
      success: true,
      data: sortedSections,
    });
  } catch (error: any) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load warehouse sections.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, prefix, rangeStart, rangeEnd } = body;

    // Handle range creation (e.g., D1 to D15)
    if (prefix && rangeStart && rangeEnd) {
      const cleanPrefix = prefix.trim().toUpperCase();
      const start = parseInt(rangeStart, 10);
      const end = parseInt(rangeEnd, 10);

      if (isNaN(start) || isNaN(end) || start > end) {
        return NextResponse.json(
          { success: false, error: 'Invalid section range values.' },
          { status: 400 }
        );
      }

      const created: string[] = [];
      for (let i = start; i <= end; i++) {
        const secCode = `${cleanPrefix}${i}`;
        await db.sectionConfig.upsert({
          where: { code: secCode },
          update: {},
          create: {
            code: secCode,
            prefix: cleanPrefix,
          },
        });
        created.push(secCode);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully created ${created.length} sections (${cleanPrefix}${start} to ${cleanPrefix}${end}).`,
      });
    }

    // Handle single section creation
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid section code.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const inferredPrefix = cleanCode.match(/^[A-Za-z]+/)?.[0] || 'GENERAL';

    const newSection = await db.sectionConfig.upsert({
      where: { code: cleanCode },
      update: {},
      create: {
        code: cleanCode,
        prefix: inferredPrefix,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Section ${cleanCode} added successfully.`,
        data: newSection,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding section:', error);
    return NextResponse.json(
      { success: false, error: 'Could not add section. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Section code is required for deletion.' },
        { status: 400 }
      );
    }

    // Check if section is currently in use by any tiles
    const inUseCount = await db.tileInventory.count({
      where: { section: code },
    });

    if (inUseCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete Section ${code} because it contains ${inUseCount} tile record(s).`,
        },
        { status: 400 }
      );
    }

    await db.sectionConfig.delete({
      where: { code },
    });

    return NextResponse.json({
      success: true,
      message: `Section ${code} deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { success: false, error: 'Could not delete section. Please try again.' },
      { status: 500 }
    );
  }
}
