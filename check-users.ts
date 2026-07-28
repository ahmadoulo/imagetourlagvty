import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { Account: true } });
  console.dir(users, { depth: null });
}

main().finally(() => prisma.$disconnect());
