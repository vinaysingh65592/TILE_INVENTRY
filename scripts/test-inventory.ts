import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Automated System Verification Tests...\n');

  try {
    // TEST 1: Database Connection & Seed Check
    console.log('1️⃣ Checking Database Connection & Sections...');
    const sectionCount = await prisma.sectionConfig.count();
    console.log(`   ✓ Found ${sectionCount} configured warehouse sections.`);
    if (sectionCount === 0) {
      throw new Error('No sections found in database! Seed step might have failed.');
    }

    // TEST 2: Add Tile to Inventory (Single & Multi-Location)
    console.log('\n2️⃣ Testing Add Tile Functionality (Multi-Location Support)...');
    const tile1 = await prisma.tileInventory.create({
      data: {
        tileDesignName: 'Test Onyx Gold',
        section: 'A1',
        position: 'STARTING',
        note: 'Automated Test Record #1',
      },
    });
    console.log(`   ✓ Added Tile "${tile1.tileDesignName}" at Section ${tile1.section} (${tile1.position}).`);

    const tile2 = await prisma.tileInventory.create({
      data: {
        tileDesignName: 'Test Onyx Gold',
        section: 'B5',
        position: 'LAST',
        note: 'Automated Test Record #2 - Multi Location',
      },
    });
    console.log(`   ✓ Added Tile "${tile2.tileDesignName}" at Section ${tile2.section} (${tile2.position}).`);

    // TEST 3: Search Tiles (Case-Insensitive & Live Filter)
    console.log('\n3️⃣ Testing Search & Locator (Case-Insensitive)...');
    const searchResultsLower = await prisma.tileInventory.findMany({
      where: {
        tileDesignName: { contains: 'test onyx' },
      },
    });
    console.log(`   ✓ Searching "test onyx" (lowercase) found ${searchResultsLower.length} locations:`);
    searchResultsLower.forEach((t) => {
      console.log(`     - [${t.tileDesignName}] -> SECTION: ${t.section} | POSITION: ${t.position}`);
    });

    if (searchResultsLower.length < 2) {
      throw new Error('Multi-location search failed! Expected at least 2 records.');
    }

    // TEST 4: Filter by Section and Position
    console.log('\n4️⃣ Testing Section & Position Filters...');
    const filtered = await prisma.tileInventory.findMany({
      where: {
        section: 'A1',
        position: 'STARTING',
      },
    });
    console.log(`   ✓ Filter Section=A1 & Position=STARTING found ${filtered.length} matching tile(s).`);

    // TEST 5: Section Management (Add New Section & Delete)
    console.log('\n5️⃣ Testing Section Management System...');
    const newSec = await prisma.sectionConfig.upsert({
      where: { code: 'TEST1' },
      update: {},
      create: { code: 'TEST1', prefix: 'TEST' },
    });
    console.log(`   ✓ Created dynamic section "${newSec.code}".`);

    // TEST 6: Dynamic Dashboard Statistics
    console.log('\n6️⃣ Testing Dynamic Dashboard Statistics...');
    const totalTiles = await prisma.tileInventory.count();
    console.log(`   ✓ Dynamic Total Inventory Count: ${totalTiles}`);

    // TEST 7: Edit Tile Record
    console.log('\n7️⃣ Testing Edit Tile Record...');
    const updated = await prisma.tileInventory.update({
      where: { id: tile1.id },
      data: {
        position: 'MIDDLE',
        note: 'Updated via Automated Test',
      },
    });
    console.log(`   ✓ Updated Tile "${updated.tileDesignName}" position to ${updated.position}.`);

    // TEST 8: Delete Tile Record
    console.log('\n8️⃣ Testing Delete Tile Record...');
    await prisma.tileInventory.delete({ where: { id: tile1.id } });
    await prisma.tileInventory.delete({ where: { id: tile2.id } });
    await prisma.sectionConfig.delete({ where: { code: 'TEST1' } });
    console.log(`   ✓ Cleaned up test tile records and test section successfully.`);

    console.log('\n🎉 ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! ✅');
  } catch (err: any) {
    console.error('\n❌ Test failure:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
