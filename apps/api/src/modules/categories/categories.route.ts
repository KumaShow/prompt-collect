import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware.js';
import { getCategories } from './categories.controller.js';

const router = Router();

router.get('/', authMiddleware, getCategories);

export default router;
