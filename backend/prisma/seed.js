const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 COMPLETE DATABASE RESET - Removing everything...');
  
  // Delete ALL data in correct order to avoid foreign key constraints
  await prisma.task.deleteMany({});
  await prisma.garbageReport.deleteMany({});
  await prisma.pickupRequest.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ All data deleted successfully');

  // SECURITY: Use environment variables for demo passwords
  // Default to secure random hashes if not provided (development only)
  const adminPassword = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD || 'admin_demo_change_me', 10);
  const workerPassword = await bcrypt.hash(process.env.DEMO_WORKER_PASSWORD || 'worker_demo_change_me', 10);
  const citizenPassword = await bcrypt.hash(process.env.DEMO_CITIZEN_PASSWORD || 'citizen_demo_change_me', 10);

  // PROTECTION: Disable demo accounts in production
  if (process.env.NODE_ENV === 'production' && !process.env.DEMO_ADMIN_PASSWORD) {
    console.log('🚨 Production mode detected - skipping demo account creation');
    return;
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'Admin',
    },
  });

  // Create 3 worker users (clean number for demo)
  const workers = [];
  for (let i = 1; i <= 3; i++) {
    const worker = await prisma.user.create({
      data: {
        name: `Worker ${i}`,
        email: `worker${i}@example.com`,
        password: workerPassword,
        role: 'Worker',
      },
    });
    workers.push(worker);
  }

  // Create citizen user
  const citizen = await prisma.user.create({
    data: {
      name: 'John Citizen',
      email: 'citizen@example.com',
      password: citizenPassword,
      role: 'Citizen',
    },
  });

  // Create Worker entries for each worker user
  for (const worker of workers) {
    await prisma.worker.create({
      data: {
        userId: worker.id,
      },
    });
  }

  console.log('👥 Created fresh users:');
  console.log(`   - 1 Admin: ${admin.email}`);
  console.log(`   - 3 Workers: ${workers.map(w => w.email).join(', ')}`);
  console.log(`   - 1 Citizen: ${citizen.email}`);

  console.log('');
  console.log('✨ Database is now COMPLETELY CLEAN!');
  console.log('📊 Status:');
  console.log(`   - 0 Garbage Reports`);
  console.log(`   - 0 Tasks`);
  console.log(`   - 0 Pickup Requests`);
  console.log(`   - Fresh user accounts ready`);
  console.log('');
  console.log('🚀 Ready for fresh start! Check environment variables for demo credentials.');
  console.log('   Admin: admin@example.com');
  console.log('   Workers: worker1@example.com (workers 1-3)');
  console.log('   Citizen: citizen@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });