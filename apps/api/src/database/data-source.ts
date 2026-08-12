// Node.js 內建模組
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 第三方套件
import 'reflect-metadata';
import { DataSource } from 'typeorm';

// 專案內部模組
import { env } from '../config/env.js';
import { User } from './entities/User.js';
import { Category } from './entities/Category.js';
import { SkillItem } from './entities/SkillItem.js';
import { Favorite } from './entities/Favorite.js';

// 以此檔案的位置為基準解析 migration，避免受啟動指令的工作目錄影響。
const currentDirectory = dirname(fileURLToPath(import.meta.url));

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  // 明確列出 Entity，確保 CLI 與應用程式使用相同的資料模型。
  entities: [User, Category, SkillItem, Favorite],
  // 同時支援開發環境的 TypeScript 與建置後的 JavaScript migration。
  migrations: [join(currentDirectory, 'migrations', '*{.ts,.js}')],
  // Schema 變更一律透過 migration 管理，避免自動同步造成資料遺失。
  synchronize: false,
  logging: env.NODE_ENV === 'development',
});
