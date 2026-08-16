import { Category } from '@/database/entities/Category.js';
import { AppDataSource } from '@/database/data-source.js';
import { AppError } from '@/errors/appError.js';

/**
 * 取得所有分類資料。
 *
 * @returns 回傳目前儲存中的全部分類列表。
 */
async function getAllCategories(): Promise<Category[]> {
  const categories = await AppDataSource.getRepository(Category).find();

  return categories;
}

/**
 * 建立新的分類項目。
 *
 * @param categoryData 要建立的分類資料，僅提供部份欄位即可。
 * @returns 已建立完成的分類實體。
 */
async function createCategory(
  categoryData: Partial<Category>,
): Promise<Category> {
  const categoryRepo = AppDataSource.getRepository(Category);

  const name = categoryData.name?.trim() ?? '';
  const description = categoryData.description?.trim() ?? '';

  const validationErrors: Array<{ field: string; message: string }> = [];

  if (!name) {
    validationErrors.push({ field: 'name', message: '請輸入類別名稱' });
  } else if (name.length > 50) {
    validationErrors.push({
      field: 'name',
      message: '類別名稱不可超過 50 字元',
    });
  }

  if (description.length > 500) {
    validationErrors.push({
      field: 'description',
      message: '類別說明不可超過 500 字元',
    });
  }

  const firstError = validationErrors[0];
  if (firstError) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      firstError.message,
      true,
      validationErrors,
    );
  }

  // trim 後不分大小寫的名稱已存在
  const existingCategory = await categoryRepo
    .createQueryBuilder('category')
    .where('LOWER(TRIM(category.name)) = LOWER(TRIM(:name))', { name })
    .getOne();
  if (existingCategory) {
    throw new AppError(409, 'CATEGORY_NAME_EXISTS', '類別名稱已存在', true);
  }

  const category = categoryRepo.create({ name, description });

  await categoryRepo.save(category);

  return category;
}

export { getAllCategories, createCategory };
