import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source.js';
import { User } from '../entities/User.js';
import { Category } from '../entities/Category.js';
import { SkillItem } from '../entities/SkillItem.js';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const skillRepo = AppDataSource.getRepository(SkillItem);

  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('Database already seeded. Skipping seeding process.');
    await AppDataSource.destroy();
    return;
  }

  const adminPassword = await bcrypt.hash('admin1234', 10);
  const memberPassword = await bcrypt.hash('member1234', 10);

  const admin = userRepo.create({
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash: adminPassword,
    role: 'admin',
  });

  const member = userRepo.create({
    name: 'Member',
    email: 'member@example.com',
    passwordHash: memberPassword,
    role: 'member',
  });

  await userRepo.save([admin, member]);

  const categories = await categoryRepo.save([
    { name: 'JavaScript', description: '前端與後端 JavaScript 範例' },
    { name: 'TypeScript', description: '型別安全與開發效率' },
    { name: 'Node.js', description: 'Express / API / backend 範例' },
  ]);

  await skillRepo.save([
    {
      title: 'Express health check',
      category: categories[0]!,
      tags: ['express', 'api', 'health'],
      content: '建立 GET /health 端點，回傳服務狀態。',
      useCase: '用來確認後端是否正常啟動。',
      exampleInput: 'curl http://localhost:3000/health',
    },
    {
      title: 'TypeORM entity 設計',
      category: categories[1]!,
      tags: ['typeorm', 'entity', 'postgres'],
      content: '用 Entity 定義資料表與關聯。',
      useCase: '建立資料模型。',
      exampleInput: 'User, Category, SkillItem, Favorite',
    },
    {
      title: 'JWT login flow',
      category: categories[2]!,
      tags: ['jwt', 'auth', 'security'],
      content: '登入後簽發 JWT，後續透過 middleware 驗證使用者。',
      useCase: '後台與前台驗證。',
      exampleInput: 'Authorization: Bearer <token>',
    },
  ]);

  console.log('Database seeding completed successfully.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
})