import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { User } from './entities/User.js';

export const appDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [
    User
  ],
  migrations: [],
  synchronize: false,
  logging: env.NODE_ENV === 'development'
})