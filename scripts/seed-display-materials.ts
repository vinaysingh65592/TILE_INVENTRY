import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial display tiles and materials...');

  const countDisplay = await prisma.displayTile.count();
  if (countDisplay === 0) {
    await prisma.displayTile.createMany({
      data: [
        {
          company: 'Kajaria',
          tileDesign: 'Statuario White Polished GVT',
          category: 'GVT / PGVT',
          size: '600 x 1200 mm (2x4 ft)',
          mrp: 850,
          finalMrp: 680,
          note: 'Mirror polished finish, white marble texture, 9mm thickness',
          addedByName: 'Admin',
          addedByRole: 'ADMIN',
        },
        {
          company: 'Somany',
          tileDesign: 'Royal Marfil Cream Glazed',
          category: 'Floor Tile',
          size: '600 x 600 mm (2x2 ft)',
          mrp: 520,
          finalMrp: 425,
          note: 'Warm beige Italian marble design, anti-skid surface',
          addedByName: 'Salesman',
          addedByRole: 'SALESMAN',
        },
        {
          company: 'Simpolo',
          tileDesign: 'Onyx Blue Super Polish Slab',
          category: 'Slab / Large Format',
          size: '800 x 1600 mm (2.6x5.2 ft)',
          mrp: 1450,
          finalMrp: 1180,
          note: 'Exotic translucent blue onyx pattern, bookmatch option available',
          addedByName: 'Salesman',
          addedByRole: 'SALESMAN',
        },
      ],
    });
    console.log('✓ Seeded 3 showcase display tiles');
  } else {
    console.log(`Display showcase already contains ${countDisplay} tiles`);
  }

  const countMaterials = await prisma.material.count();
  if (countMaterials === 0) {
    await prisma.material.createMany({
      data: [
        {
          company: 'Roff (Pidilite)',
          materialName: 'Roff New Construction Tile Adhesive (T01)',
          weight: '20 kg bag',
          category: 'Tile Adhesive',
          mrp: 450,
          finalMrp: 380,
          note: 'Grey polymer modified adhesive suitable for ceramic & vitrified floor tiles',
          addedByName: 'Admin',
          addedByRole: 'ADMIN',
        },
        {
          company: 'Roff (Pidilite)',
          materialName: 'Roff Powerfix Non-Skid Adhesive (T02)',
          weight: '20 kg bag',
          category: 'Tile Adhesive',
          mrp: 580,
          finalMrp: 490,
          note: 'High bond strength for large format tiles (2x4) and wall cladding',
          addedByName: 'Salesman',
          addedByRole: 'SALESMAN',
        },
        {
          company: 'MYK Laticrete',
          materialName: 'Stellar Epoxy Tile Joint Grout',
          weight: '5 kg bucket',
          category: 'Epoxy Grout',
          mrp: 1250,
          finalMrp: 1050,
          note: '100% stain-free, waterproof 3-component epoxy grout (Ivory / Grey)',
          addedByName: 'Salesman',
          addedByRole: 'SALESMAN',
        },
        {
          company: 'Asian Paints SmartCare',
          materialName: 'Tile Precision Spacers (2mm / 3mm)',
          weight: '100 pcs pack',
          category: 'Tile Spacers & Levellers',
          mrp: 120,
          finalMrp: 85,
          note: 'High-density plastic cross spacers for uniform grout joints',
          addedByName: 'Admin',
          addedByRole: 'ADMIN',
        },
      ],
    });
    console.log('✓ Seeded 4 installation materials');
  } else {
    console.log(`Material panel already contains ${countMaterials} items`);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
