import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware.js';

const router = Router();

// TODO: 待更新 admin 檢查
// GET /admin/categories
// POST /admin/categories
// PATCH /admin/categories/:id
// DELETE /admin/categories/:id
router.post('/', authMiddleware);
router.patch('/:id', authMiddleware);
router.delete('/:id', authMiddleware);

export default router;
