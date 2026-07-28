import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres:password@localhost:5432/imagetourl?schema=public"
});

async function main() {
  const count = await prisma.account.updateMany({
    where: { providerId: 'credentials' },
    data: { providerId: 'credential' }
  });
  console.log(`Updated ${count.count} accounts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
