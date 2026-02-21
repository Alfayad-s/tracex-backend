import { prisma } from '../config/db.js';

export async function getAllowedCategoryNames(userId: string): Promise<Set<string>> {
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    select: { name: true },
  });
  return new Set(categories.map((c) => c.name));
}

export async function isAllowedCategory(userId: string, categoryName: string): Promise<boolean> {
  const allowed = await getAllowedCategoryNames(userId);
  return allowed.has(categoryName);
}
