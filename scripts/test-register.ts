import { db } from '../lib/db';
import { hashPassword, verifyPassword } from '../lib/auth';

async function testRegister() {
  console.log('Testing Registration logic...');
  
  // Clean up any previous test users if exists
  await db.user.deleteMany({ where: { username: { in: ['test_sup', 'test_sal'] } } });

  // 1. Register Supervisor
  const supPass = hashPassword('supPass123');
  const sup = await db.user.create({
    data: {
      name: 'Test Supervisor Admin',
      username: 'test_sup',
      passwordHash: supPass,
      role: 'SUPERVISOR',
      isActive: true,
    }
  });
  console.log('✓ Registered Supervisor:', sup.name, '| Role:', sup.role);

  // 2. Register Salesman
  const salPass = hashPassword('salPass123');
  const sal = await db.user.create({
    data: {
      name: 'Test Salesman Ravi',
      username: 'test_sal',
      passwordHash: salPass,
      role: 'SALESMAN',
      isActive: true,
    }
  });
  console.log('✓ Registered Salesman:', sal.name, '| Role:', sal.role);

  // 3. Verify passwords
  if (!verifyPassword('supPass123', sup.passwordHash)) throw new Error('Supervisor password mismatch');
  if (!verifyPassword('salPass123', sal.passwordHash)) throw new Error('Salesman password mismatch');
  console.log('✓ Both passwords securely hashed and verified');

  // Clean up test users
  await db.user.deleteMany({ where: { username: { in: ['test_sup', 'test_sal'] } } });
  console.log('✓ Cleaned up test accounts');
  console.log('🎉 Registration logic verified successfully!');
}

testRegister()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
