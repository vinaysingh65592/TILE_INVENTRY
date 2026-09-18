import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PositionEnum = {
  STARTING: 'STARTING',
  MIDDLE: 'MIDDLE',
  LAST: 'LAST',
} as const;

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Section Configurations
  const defaultSections: { code: string; prefix: string }[] = [];

  // A1 to A15
  for (let i = 1; i <= 15; i++) {
    defaultSections.push({ code: `A${i}`, prefix: 'A' });
  }
  // B1 to B15
  for (let i = 1; i <= 15; i++) {
    defaultSections.push({ code: `B${i}`, prefix: 'B' });
  }
  // C1 to C15
  for (let i = 1; i <= 15; i++) {
    defaultSections.push({ code: `C${i}`, prefix: 'C' });
  }

  console.log(`Seeding ${defaultSections.length} default warehouse sections...`);
  for (const sec of defaultSections) {
    await prisma.sectionConfig.upsert({
      where: { code: sec.code },
      update: {},
      create: sec,
    });
  }

  // 2. Seed Sample Tile Inventory
  const sampleTiles = [
    {
      tileDesignName: 'Jet Black',
      section: 'A1',
      position: PositionEnum.STARTING,
      note: 'Main entrance palette batch #102',
    },
    {
      tileDesignName: 'Jet Black',
      section: 'B4',
      position: PositionEnum.MIDDLE,
      note: 'Backup rack overflow',
    },
    {
      tileDesignName: 'Jet Black',
      section: 'C2',
      position: PositionEnum.LAST,
      note: 'High-gloss finish tiles',
    },
    {
      tileDesignName: 'Italian Marble',
      section: 'A2',
      position: PositionEnum.MIDDLE,
      note: 'Premium 60x120cm slabs',
    },
    {
      tileDesignName: 'Italian Marble',
      section: 'B3',
      position: PositionEnum.MIDDLE,
      note: 'Polished white Italian marble',
    },
    {
      tileDesignName: 'Royal White',
      section: 'B3',
      position: PositionEnum.LAST,
      note: 'Matte white ceramic',
    },
    {
      tileDesignName: 'Royal White',
      section: 'C1',
      position: PositionEnum.LAST,
      note: 'Standard floor tile',
    },
    {
      tileDesignName: 'Carrara Gold',
      section: 'C2',
      position: PositionEnum.MIDDLE,
      note: 'Gold veined white tile',
    },
    {
      tileDesignName: 'Premium Beige',
      section: 'A5',
      position: PositionEnum.STARTING,
      note: 'Beige anti-skid bathroom tile',
    },
    {
      tileDesignName: 'Spanish Slate',
      section: 'A3',
      position: PositionEnum.STARTING,
      note: 'Textured outdoor tile',
    },
    {
      tileDesignName: 'Travertine Classico',
      section: 'B12',
      position: PositionEnum.MIDDLE,
      note: 'Unfilled honed natural stone',
    },
    {
      tileDesignName: 'Calacatta Luxe',
      section: 'C5',
      position: PositionEnum.STARTING,
      note: 'Large format porcelain',
    },
  ];

  // Seed sample tiles if database is empty
  const existingCount = await prisma.tileInventory.count();
  if (existingCount === 0) {
    console.log('Seeding sample tile inventory...');
    for (const tile of sampleTiles) {
      await prisma.tileInventory.create({
        data: tile,
      });
    }
  } else {
    console.log(`Inventory already contains ${existingCount} records.`);
  }

  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
