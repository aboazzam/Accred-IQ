import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { verifyCourseOwnership } from '../middleware/course-ownership';
import { indirectController } from './indirect.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

// قائمة الاستبانات لمقرر
router.get(
  '/courses/:courseId',
  requirePermission('indirect_assessment', Action.READ, PermissionScope.OWN),
  (req, res, next) => indirectController.list(req, res, next)
);

// مقارنة المباشر وغير المباشر
router.get(
  '/courses/:courseId/comparison',
  requirePermission('indirect_assessment', Action.READ, PermissionScope.OWN),
  (req, res, next) => indirectController.comparison(req, res, next)
);

// إضافة استبانة جديدة (محمي بالـ Ownership)
router.post(
  '/',
  requirePermission('indirect_assessment', Action.WRITE, PermissionScope.OWN),
  verifyCourseOwnership,
  (req, res, next) => indirectController.create(req, res, next)
);

export default router;
