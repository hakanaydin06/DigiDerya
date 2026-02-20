import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.TEACHER_EMAIL || 'ogretmen@deryahoca.com';
  const name = process.env.TEACHER_NAME || 'Derya Hoca';
  const password = process.env.TEACHER_PASSWORD || 'DeryaHoca2024!';

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.teacher.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
    },
    create: {
      email,
      name,
      passwordHash,
    },
  });

  console.log('✅ Teacher account ensured:', email);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
