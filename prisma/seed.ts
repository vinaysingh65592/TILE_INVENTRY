import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const PositionEnum = {
  STARTING: 'STARTING',
  MIDDLE: 'MIDDLE',
  LAST: 'LAST',
} as const;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Default Users
  const defaultUsers = [
    {
      name: 'System Administrator',
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
      status: 'APPROVED',
      isActive: true,
    },
    {
      name: 'Supervisor Admin',
      username: 'supervisor',
      password: 'admin123',
      role: 'SUPERVISOR',
      status: 'APPROVED',
      isActive: true,
    },
    {
      name: 'Salesman Rahul',
      username: 'salesman',
      password: 'sales123',
      role: 'SALESMAN',
      status: 'APPROVED',
      isActive: true,
    },
  ];

  console.log('Seeding default users...');
  for (const user of defaultUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      },
      create: {
        name: user.name,
        username: user.username,
        passwordHash: hashPassword(user.password),
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      },
    });
    console.log(`  ✓ User "${user.username}" (${user.role}) ready`);
  }

  // 2. Seed Section Configurations
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

  // 3. Seed Sample Tile Inventory
  const sampleTiles = [
    {
      tileDesignName: 'Jet Black',
      section: 'A1',
      position: PositionEnum.STARTING,
      quantity: 50,
      note: 'Main entrance palette batch #102',
    },
    {
      tileDesignName: 'Jet Black',
      section: 'B4',
      position: PositionEnum.MIDDLE,
      quantity: 30,
      note: 'Backup rack overflow',
    },
    {
      tileDesignName: 'Jet Black',
      section: 'C2',
      position: PositionEnum.LAST,
      quantity: 25,
      note: 'High-gloss finish tiles',
    },
    {
      tileDesignName: 'Italian Marble',
      section: 'A2',
      position: PositionEnum.MIDDLE,
      quantity: 100,
      note: 'Premium 60x120cm slabs',
    },
    {
      tileDesignName: 'Italian Marble',
      section: 'B3',
      position: PositionEnum.MIDDLE,
      quantity: 75,
      note: 'Polished white Italian marble',
    },
    {
      tileDesignName: 'Royal White',
      section: 'B3',
      position: PositionEnum.LAST,
      quantity: 60,
      note: 'Matte white ceramic',
    },
    {
      tileDesignName: 'Royal White',
      section: 'C1',
      position: PositionEnum.LAST,
      quantity: 40,
      note: 'Standard floor tile',
    },
    {
      tileDesignName: 'Carrara Gold',
      section: 'C2',
      position: PositionEnum.MIDDLE,
      quantity: 80,
      note: 'Gold veined white tile',
    },
    {
      tileDesignName: 'Premium Beige',
      section: 'A5',
      position: PositionEnum.STARTING,
      quantity: 45,
      note: 'Beige anti-skid bathroom tile',
    },
    {
      tileDesignName: 'Spanish Slate',
      section: 'A3',
      position: PositionEnum.STARTING,
      quantity: 55,
      note: 'Textured outdoor tile',
    },
    {
      tileDesignName: 'Travertine Classico',
      section: 'B12',
      position: PositionEnum.MIDDLE,
      quantity: 35,
      note: 'Unfilled honed natural stone',
    },
    {
      tileDesignName: 'Calacatta Luxe',
      section: 'C5',
      position: PositionEnum.STARTING,
      quantity: 90,
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
  console.log('');
  console.log('📋 Default Login Credentials:');
  console.log('   Admin:      username=admin,      password=admin123');
  console.log('   Supervisor: username=supervisor, password=admin123');
  console.log('   Salesman:   username=salesman,   password=sales123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
