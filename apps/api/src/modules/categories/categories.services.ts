import { Category } from '@/database/entities/Category.js';
import { AppDataSource } from '@/database/data-source.js';

type CategorySummary = Pick<Category, 'id' | 'name'>;

export async function getAllCategories(): Promise<CategorySummary[]> {
  const categories = await AppDataSource.getRepository(Category).find();

  return categories.map(({ id, name }) => ({ id, name }));
}
