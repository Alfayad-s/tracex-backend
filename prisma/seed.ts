import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREDEFINED_CATEGORIES = [
  { name: 'Food', color: null, icon: null },
  { name: 'Transport', color: null, icon: null },
  { name: 'Bills', color: null, icon: null },
  { name: 'Shopping', color: null, icon: null },
  { name: 'Entertainment', color: null, icon: null },
  { name: 'Health', color: null, icon: null },
  { name: 'Other', color: null, icon: null },
];

async function main(): Promise<void> {
  for (const cat of PREDEFINED_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: null },
    });
    if (!existing) {
      await prisma.category.create({
        data: { name: cat.name, color: cat.color, icon: cat.icon, userId: null },
      });
    }
  }
  console.log('Seeded predefined categories');
}

main()
  .catch((e: unknown) => {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'P2021') {
      console.error(
        'Tables do not exist. Run the init migration first:\n' +
          '  Supabase: SQL Editor → paste and run prisma/supabase-apply-init.sql\n' +
          '  Or: npm run prisma:migrate (if it completes)'
      );
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
