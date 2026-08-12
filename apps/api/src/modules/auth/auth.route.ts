import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.js';
import { login, logout, getMe } from './auth.controller.js';

const router = Router();

router.post('/login', login);
// router.post('/logout', authMiddleware, logout);
// router.get('/me', authMiddleware, getMe);

export default router;
