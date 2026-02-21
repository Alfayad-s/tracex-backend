import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREDEFINED_CATEGORIES = [
  { name: 'Food', color: '#22c55e', icon: 'utensils' },
  { name: 'Transport', color: '#3b82f6', icon: 'car' },
  { name: 'Bills', color: '#ef4444', icon: 'file-text' },
  { name: 'Shopping', color: '#a855f7', icon: 'shopping-cart' },
  { name: 'Entertainment', color: '#eab308', icon: 'film' },
  { name: 'Health', color: '#06b6d4', icon: 'heart' },
  { name: 'Other', color: '#6b7280', icon: 'circle' },
];

async function main() {
  for (const cat of PREDEFINED_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: null },
    });
    if (!existing) {
      await prisma.category.create({
        data: { name: cat.name, color: cat.color, icon: cat.icon },
      });
    }
  }
  console.log('Seeded predefined categories:', PREDEFINED_CATEGORIES.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());