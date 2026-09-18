import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 1. Total Tiles
    const totalTiles = await db.tileInventory.count();

    // 2. Today's Entries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysEntries = await db.tileInventory.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    // 3. Section breakdown counts (A, B, C, etc.)
    const allTiles = await db.tileInventory.findMany({
      select: { section: true },
    });

    const sectionCounts: Record<string, number> = {};

    allTiles.forEach((tile) => {
      const prefix = tile.section.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || 'OTHER';
      sectionCounts[prefix] = (sectionCounts[prefix] || 0) + 1;
    });

    // 4. Total Configured Sections
    const totalSections = await db.sectionConfig.count();

    return NextResponse.json({
      success: true,
      data: {
        totalTiles,
        todaysEntries,
        sectionCounts,
        totalSections,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to calculate dashboard statistics.' },
      { status: 500 }
    );
  }
}
