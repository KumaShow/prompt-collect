import {Router} from 'express';
import authRoutes from '@/modules/auth/auth.route.js';
import categoriesRoutes from '@/modules/categories/categories.route.js';
// import adminCategoriesRoutes from '@/modules/categories/admin-categories.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
// router.use('/admin/categories', adminCategoriesRoutes);
export default router;