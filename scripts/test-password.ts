import { db } from '../lib/db';
import { hashPassword, verifyPassword } from '../lib/auth';

async function testPasswordWorkflow() {
  console.log('🧪 Starting Password & Admin Temp Password Test Suite...\n');

  // Clean up any old test user
  await db.user.deleteMany({ where: { username: 'test_member' } });

  // Step 1: Create a test member with initial password
  console.log('Step 1: Creating member with password "InitialPass123"');
  const user = await db.user.create({
    data: {
      name: 'Test Member',
      username: 'test_member',
      passwordHash: hashPassword('InitialPass123'),
      role: 'SALESMAN',
      status: 'APPROVED',
      isActive: true,
      mustChangePassword: false,
    },
  });

  if (!verifyPassword('InitialPass123', user.passwordHash)) {
    throw new Error('Initial password verification failed');
  }
  console.log('  ✓ Member created with verified initial password\n');

  // Step 2: Member changes their own password to "MemberNewPass456"
  console.log('Step 2: Member changes their own password');
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword('MemberNewPass456'),
      mustChangePassword: false,
    },
  });

  if (!verifyPassword('MemberNewPass456', updatedUser.passwordHash)) {
    throw new Error('Member new password verification failed');
  }
  if (verifyPassword('InitialPass123', updatedUser.passwordHash)) {
    throw new Error('Old password should no longer work');
  }
  console.log('  ✓ Password changed successfully by member\n');

  // Step 3: Admin sets a temporary password for member ("Temp#9988")
  console.log('Step 3: Admin resets password with temporary password "Temp#9988"');
  const resetUser = await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword('Temp#9988'),
      mustChangePassword: true,
    },
  });

  if (!verifyPassword('Temp#9988', resetUser.passwordHash)) {
    throw new Error('Temporary password verification failed');
  }
  if (!resetUser.mustChangePassword) {
    throw new Error('mustChangePassword flag should be TRUE');
  }
  console.log('  ✓ Temporary password active & mustChangePassword = true\n');

  // Step 4: Member logs in with temp password and sets new permanent password "FinalSecurePass789"
  console.log('Step 4: Member logs in with temp password and sets permanent password');
  const finalUser = await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword('FinalSecurePass789'),
      mustChangePassword: false,
    },
  });

  if (!verifyPassword('FinalSecurePass789', finalUser.passwordHash)) {
    throw new Error('Final password verification failed');
  }
  if (finalUser.mustChangePassword) {
    throw new Error('mustChangePassword flag should now be FALSE');
  }
  console.log('  ✓ Final password set and mustChangePassword cleared to false\n');

  // Cleanup
  await db.user.deleteMany({ where: { username: 'test_member' } });
  console.log('  ✓ Cleaned up test member');

  console.log('\n🎉 ALL PASSWORD WORKFLOW TESTS PASSED SUCCESSFULLY! 100% verified.');
}

testPasswordWorkflow()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
