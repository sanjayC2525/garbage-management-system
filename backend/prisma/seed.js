const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const workerPassword = await bcrypt.hash('worker123', 10);
  const citizenPassword = await bcrypt.hash('citizen123', 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'Admin',
    },
  });

  // Create 10 worker users
  const workers = [];
  for (let i = 1; i <= 10; i++) {
    const worker = await prisma.user.upsert({
      where: { email: `worker${i}@example.com` },
      update: {},
      create: {
        name: `Worker ${i}`,
        email: `worker${i}@example.com`,
        password: workerPassword,
        role: 'Worker',
      },
    });
    workers.push(worker);
  }

  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@example.com' },
    update: {},
    create: {
      name: 'John Citizen',
      email: 'citizen@example.com',
      password: citizenPassword,
      role: 'Citizen',
    },
  });

  // Create Worker entries for each worker user
  for (const worker of workers) {
    await prisma.worker.upsert({
      where: { userId: worker.id },
      update: {},
      create: {
        userId: worker.id,
        currentWorkload: 0,
        maxTasks: 10,
      },
    });
  }

  // Create sample pickup requests
  await prisma.pickupRequest.createMany({
    data: [
      {
        address: '123 Main St',
        garbageType: 'Dry',
        pickupDate: new Date('2026-01-25'),
        status: 'Pending',
        citizenId: citizen.id,
      },
      {
        address: '456 Oak Ave',
        garbageType: 'Wet',
        pickupDate: new Date('2026-01-26'),
        status: 'Assigned',
        citizenId: citizen.id,
        workerId: workers[0].id,
      },
      {
        address: '789 Pine Rd',
        garbageType: 'E-waste',
        pickupDate: new Date('2026-01-20'),
        status: 'Collected',
        citizenId: citizen.id,
        workerId: workers[0].id,
      },
    ],
  });

  // Create sample garbage report
  await prisma.garbageReport.create({
    data: {
      imagePath: '/uploads/sample.jpg',
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'REPORTED',
      citizenId: citizen.id,
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });