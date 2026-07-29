import { PrismaClient, Visibility, EventType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Fix existing incorrect providerIds if any
  try {
    const updated = await prisma.account.updateMany({
      where: { providerId: 'credentials' },
      data: { providerId: 'credential' }
    });
    if (updated.count > 0) {
      console.log(`Fixed ${updated.count} accounts with wrong providerId`);
    }
  } catch (e) {
    console.error("Failed to fix providerIds", e);
  }

  // 1. Seed Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Super Administrator', permissions: '["*"]' },
    { name: 'ADMIN', description: 'Administrator', permissions: '["manage:users", "manage:plans", "manage:settings"]' },
    { name: 'USER', description: 'Standard User', permissions: '[]' }
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData
    });
  }
  console.log('Roles seeded.');

  // 1.5 Seed Plans
  const plans = [
    {
      name: 'Free',
      description: 'Perfect to get started',
      price: 0,
      currency: 'USD',
      billingCycle: 'MONTHLY',
      maxStorageMB: 1024,
      maxBandwidthMB: 10240,
      maxFileSizeMB: 10,
      maxUploadsPerDay: 50,
      maxFolders: 3,
      features: '["basic_support"]',
      isRecommended: false,
      order: 1
    },
    {
      name: 'Pro',
      description: 'For professionals and power users',
      price: 15,
      currency: 'USD',
      billingCycle: 'MONTHLY',
      maxStorageMB: 51200,
      maxBandwidthMB: 102400,
      maxFileSizeMB: 50,
      maxUploadsPerDay: 0, // unlimited
      maxFolders: 0, // unlimited
      features: '["priority_support", "custom_domains", "api_access"]',
      isRecommended: true,
      order: 2
    }
  ];

  for (const planData of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: planData.name } });
    if (!existing) {
      await prisma.plan.create({ data: planData });
    }
  }
  console.log('Plans seeded.');

  // 2. Create a Default Super Admin User
  const hashedPassword = await bcrypt.hash('SuperS3cure_2026_xY8p!', 10);
  
  const adminEmail = 'superadmin@pixora.app';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        id: 'admin_user_1',
        name: 'Admin User',
        email: adminEmail,
        emailVerified: true,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        Account: {
          create: {
            id: 'admin_account_1',
            accountId: 'admin_account_1',
            providerId: 'credential',
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      }
    });
    console.log(`Created Admin user: ${adminEmail} / SuperS3cure_2026_xY8p!`);
  } else {
    console.log(`Admin user already exists: ${adminEmail} / SuperS3cure_2026_xY8p!`);
    
    // Ensure existing admin is promoted to SUPER_ADMIN
    if (admin.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'SUPER_ADMIN', status: 'ACTIVE' }
      });
      console.log('Updated existing admin to SUPER_ADMIN role.');
    }
  }

  // 3. Create some Folders/Collections
  const folderNames = ['Vacation 2026', 'Work Assets', 'Public Gallery'];
  for (const name of folderNames) {
    const existing = await prisma.folder.findFirst({ where: { name, userId: admin.id } });
    if (!existing) {
      await prisma.folder.create({
        data: {
          name,
          description: `Seed folder for ${name}`,
          visibility: name === 'Public Gallery' ? Visibility.PUBLIC : Visibility.PRIVATE,
          userId: admin.id
        }
      });
      console.log(`Created folder: ${name}`);
    }
  }

  // 3. Create dummy analytics if none exist (for the dashboard)
  const existingAnalytics = await prisma.analyticsEvent.count();
  if (existingAnalytics === 0) {
    console.log('Creating dummy analytics data...');
    
    // Create a dummy upload just to attach events to
    const dummyUpload = await prisma.upload.create({
      data: {
        userId: admin.id,
        originalName: 'dummy-image.jpg',
        filename: 'dummy-image.jpg',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        size: 1024 * 1024 * 2, // 2MB
        url: '/storage/images/dummy-image.jpg',
        visibility: Visibility.PUBLIC,
      }
    });

    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Random views (10-100) per day
      const views = Math.floor(Math.random() * 90) + 10;
      for(let j=0; j<views; j++) {
         await prisma.analyticsEvent.create({
           data: {
             uploadId: dummyUpload.id,
             userId: admin.id,
             eventType: EventType.VIEW,
             bandwidth: dummyUpload.size,
             country: ['US', 'FR', 'DE', 'CA', 'GB'][Math.floor(Math.random() * 5)],
             browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
             referrer: ['https://twitter.com', 'Direct', 'https://google.com'][Math.floor(Math.random() * 3)],
             createdAt: date
           }
         });
      }
      
      // Random downloads (1-10) per day
      const downloads = Math.floor(Math.random() * 10) + 1;
      for(let j=0; j<downloads; j++) {
         await prisma.analyticsEvent.create({
           data: {
             uploadId: dummyUpload.id,
             userId: admin.id,
             eventType: EventType.DOWNLOAD,
             bandwidth: dummyUpload.size,
             country: ['US', 'FR', 'DE', 'CA', 'GB'][Math.floor(Math.random() * 5)],
             browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
             referrer: 'Direct',
             createdAt: date
           }
         });
      }
    }
    console.log('Created dummy analytics data.');
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
