import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

/**
 * POST /api/auth/login
 * تسجيل الدخول واستلام JWT مع مصفوفة الصلاحيات
 */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/**
 * POST /api/auth/refresh
 * تجديد الـ Access Token باستخدام الـ Refresh Token
 */
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

/**
 * GET /api/auth/me
 * جلب بيانات المستخدم الحالي (يتطلب توثيق)
 */
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export default router;
