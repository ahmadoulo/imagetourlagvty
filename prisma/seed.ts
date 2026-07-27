import { PrismaClient, Visibility, EventType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create a Default Admin/Premium User
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const adminEmail = 'admin@imagetourl.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        id: 'admin_user_1',
        name: 'Admin User',
        email: adminEmail,
        emailVerified: true,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
        Account: {
          create: {
            id: 'admin_account_1',
            accountId: 'admin_account_1',
            providerId: 'credentials',
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      }
    });
    console.log('Created Admin user.');
  } else {
    console.log('Admin user already exists.');
  }

  // 2. Create some Folders/Collections
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
