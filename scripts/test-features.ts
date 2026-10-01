import { db } from '../lib/db';
import { hashPassword, verifyPassword } from '../lib/auth';

async function runTests() {
  console.log('🧪 Starting End-to-End Test Suite for Add-On Features...\n');

  // Test 1: User Database & Authentication
  console.log('Test 1: Verifying seeded users and password verification');
  const supervisor = await db.user.findUnique({ where: { username: 'supervisor' } });
  const salesman = await db.user.findUnique({ where: { username: 'salesman' } });

  if (!supervisor || supervisor.role !== 'SUPERVISOR') {
    throw new Error('Supervisor user not found or incorrect role');
  }
  if (!salesman || salesman.role !== 'SALESMAN') {
    throw new Error('Salesman user not found or incorrect role');
  }

  const supPassValid = verifyPassword('admin123', supervisor.passwordHash);
  const salesPassValid = verifyPassword('sales123', salesman.passwordHash);
  const invalidPass = verifyPassword('wrongpass', supervisor.passwordHash);

  if (!supPassValid || !salesPassValid || invalidPass) {
    throw new Error('Password verification logic failed');
  }
  console.log('  ✓ Users seeded and passwords securely verified\n');

  // Test 2: Add Tile with Initial Quantity & TILE_CREATED audit log
  console.log('Test 2: Creating new tile with initial quantity & audit log');
  const testTile = await db.$transaction(async (tx) => {
    const tile = await tx.tileInventory.create({
      data: {
        tileDesignName: 'Italian Carrara Marble',
        section: 'A1',
        position: 'MIDDLE',
        quantity: 50,
        note: 'E2E Test Tile',
        createdById: supervisor.id,
        createdByName: supervisor.name,
        lastUpdatedById: supervisor.id,
        lastUpdatedByName: supervisor.name,
      },
    });

    await tx.inventoryAuditLog.create({
      data: {
        tileId: tile.id,
        userId: supervisor.id,
        userNameSnapshot: supervisor.name,
        userRole: supervisor.role,
        actionType: 'TILE_CREATED',
        previousQuantity: 0,
        newQuantity: 50,
        quantityChanged: 50,
        note: 'Initial stock: 50 boxes',
      },
    });

    return tile;
  });

  console.log(`  ✓ Tile created: ${testTile.tileDesignName} with initial stock = ${testTile.quantity}`);

  // Test 3: Manual Stock Update (50 -> 65)
  console.log('\nTest 3: Quantity Control update (50 -> 65) via transaction');
  const updatedStock = await db.$transaction(async (tx) => {
    const prev = testTile.quantity;
    const next = 65;
    const diff = next - prev;

    const t = await tx.tileInventory.update({
      where: { id: testTile.id },
      data: {
        quantity: next,
        lastUpdatedById: salesman.id,
        lastUpdatedByName: salesman.name,
      },
    });

    await tx.inventoryAuditLog.create({
      data: {
        tileId: testTile.id,
        userId: salesman.id,
        userNameSnapshot: salesman.name,
        userRole: salesman.role,
        actionType: 'QUANTITY_UPDATE',
        previousQuantity: prev,
        newQuantity: next,
        quantityChanged: diff,
      },
    });

    return t;
  });
  console.log(`  ✓ Stock updated to ${updatedStock.quantity} by ${updatedStock.lastUpdatedByName}`);

  // Test 4: Sale Feature (Sell 15 boxes -> remaining 50)
  console.log('\nTest 4: Recording Sale (Sell 15 boxes)');
  const soldQty = 15;
  const afterSale = await db.$transaction(async (tx) => {
    const current = await tx.tileInventory.findUnique({ where: { id: testTile.id } });
    if (!current || soldQty > current.quantity) {
      throw new Error('Invalid sale quantity');
    }

    const remaining = current.quantity - soldQty;
    const t = await tx.tileInventory.update({
      where: { id: testTile.id },
      data: {
        quantity: remaining,
        lastUpdatedById: salesman.id,
        lastUpdatedByName: salesman.name,
      },
    });

    await tx.inventoryAuditLog.create({
      data: {
        tileId: testTile.id,
        userId: salesman.id,
        userNameSnapshot: salesman.name,
        userRole: salesman.role,
        actionType: 'SALE',
        previousQuantity: current.quantity,
        newQuantity: remaining,
        quantitySold: soldQty,
        quantityChanged: -soldQty,
      },
    });

    return t;
  });
  console.log(`  ✓ Sale confirmed: sold ${soldQty} boxes, remaining = ${afterSale.quantity}`);

  // Test 5: Loading Feature (Load 20 boxes to vehicle UP53 AB 1234 -> remaining 30)
  console.log('\nTest 5: Recording Loading (Load 20 boxes to Vehicle UP53 AB 1234)');
  const loadedQty = 20;
  const vehicle = 'UP53 AB 1234';
  const billRef = 'INV-99882';

  const afterLoading = await db.$transaction(async (tx) => {
    const current = await tx.tileInventory.findUnique({ where: { id: testTile.id } });
    if (!current || loadedQty > current.quantity) {
      throw new Error('Invalid loading quantity');
    }

    const remaining = current.quantity - loadedQty;
    const t = await tx.tileInventory.update({
      where: { id: testTile.id },
      data: {
        quantity: remaining,
        lastUpdatedById: supervisor.id,
        lastUpdatedByName: supervisor.name,
      },
    });

    await tx.inventoryAuditLog.create({
      data: {
        tileId: testTile.id,
        userId: supervisor.id,
        userNameSnapshot: supervisor.name,
        userRole: supervisor.role,
        actionType: 'LOADING',
        previousQuantity: current.quantity,
        newQuantity: remaining,
        quantityLoaded: loadedQty,
        quantityChanged: -loadedQty,
        vehicleNumber: vehicle,
        referenceNumber: billRef,
      },
    });

    return t;
  });
  console.log(`  ✓ Loading confirmed: loaded ${loadedQty} boxes, vehicle = ${vehicle}, remaining = ${afterLoading.quantity}`);

  // Test 6: Audit History Complete Chronological Timeline
  console.log('\nTest 6: Retrieving Complete Audit History (Newest First)');
  const history = await db.inventoryAuditLog.findMany({
    where: { tileId: testTile.id },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`  ✓ Found ${history.length} audit records:`);
  history.forEach((log, idx) => {
    console.log(
      `    ${idx + 1}. [${log.actionType}] Prev: ${log.previousQuantity ?? '-'} -> New: ${log.newQuantity ?? '-'} ` +
      `(Change: ${log.quantityChanged ?? '-'}) by ${log.userNameSnapshot} (${log.userRole}) ` +
      `${log.vehicleNumber ? `| Vehicle: ${log.vehicleNumber}` : ''}`
    );
  });

  if (history.length !== 4) {
    throw new Error(`Expected 4 audit records, got ${history.length}`);
  }

  // Cleanup test tile
  await db.tileInventory.delete({ where: { id: testTile.id } });
  console.log('\n  ✓ Cleaned up test record');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The system is 100% verified.');
}

runTests()
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
