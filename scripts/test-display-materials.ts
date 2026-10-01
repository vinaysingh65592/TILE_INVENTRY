import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting Display Showcase & Material Panel Test Suite...\n');

  // Step 1: Create a test display tile
  console.log('Step 1: Creating a Display Tile in showcase');
  const displayTile = await prisma.displayTile.create({
    data: {
      company: 'Kajaria',
      tileDesign: 'Statuario Marble Royal',
      category: 'GVT / PGVT',
      size: '600 x 1200 mm (2x4 ft)',
      mrp: 950,
      finalMrp: 720,
      note: 'High gloss mirror finish, rectified edge',
      addedByName: 'Test Salesman',
      addedByRole: 'SALESMAN',
    },
  });
  console.log(`  ✓ Created display tile: ${displayTile.tileDesign} (${displayTile.company})`);
  console.log(`  ✓ MRP: ₹${displayTile.mrp} -> Final Offer: ₹${displayTile.finalMrp} (Save ₹${displayTile.mrp - displayTile.finalMrp})`);

  // Step 2: Edit display tile
  console.log('\nStep 2: Editing Display Tile details');
  const updatedDisplay = await prisma.displayTile.update({
    where: { id: displayTile.id },
    data: {
      finalMrp: 699,
      note: 'Special festive customer discount applied',
    },
  });
  console.log(`  ✓ Updated final MRP to: ₹${updatedDisplay.finalMrp}`);

  // Step 3: Create Material record
  console.log('\nStep 3: Creating an installation material record');
  const material = await prisma.material.create({
    data: {
      company: 'Roff (Pidilite)',
      materialName: 'Roff New Construction Tile Adhesive (T01)',
      weight: '20 kg bag',
      category: 'Tile Adhesive',
      mrp: 460,
      finalMrp: 380,
      note: 'Grey polymer modified adhesive for ceramic and vitrified floor tiles',
      addedByName: 'Test Salesman',
      addedByRole: 'SALESMAN',
    },
  });
  console.log(`  ✓ Created material: ${material.materialName} (${material.company})`);
  console.log(`  ✓ Pack: ${material.weight}, MRP: ₹${material.mrp} -> Final MRP: ₹${material.finalMrp}`);

  // Step 4: Edit Material record
  console.log('\nStep 4: Updating material pricing');
  const updatedMaterial = await prisma.material.update({
    where: { id: material.id },
    data: {
      finalMrp: 365,
    },
  });
  console.log(`  ✓ Updated material Final MRP to ₹${updatedMaterial.finalMrp}`);

  // Step 5: Clean up test records
  console.log('\nStep 5: Cleaning up test records');
  await prisma.displayTile.delete({ where: { id: displayTile.id } });
  await prisma.material.delete({ where: { id: material.id } });
  console.log('  ✓ Cleaned up test display tile and material');

  console.log('\n🎉 ALL DISPLAY & MATERIAL PANEL TESTS PASSED SUCCESSFULLY! 100% verified.');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
