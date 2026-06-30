import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { verifyCourseOwnership } from '../middleware/course-ownership';
import { artifactsController } from './artifacts.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

// قائمة الأدلة لمقرر معين
router.get(
  '/courses/:courseId',
  requirePermission('artifact', Action.READ, PermissionScope.OWN),
  (req, res, next) => artifactsController.list(req, res, next)
);

// حالة ملف المقرر (Course File Completeness)
router.get(
  '/courses/:courseId/status',
  requirePermission('artifact', Action.READ, PermissionScope.OWN),
  (req, res, next) => artifactsController.getCourseFileStatus(req, res, next)
);

// رفع دليل جديد (محمي بالـ Ownership)
router.post(
  '/',
  requirePermission('artifact', Action.WRITE, PermissionScope.OWN),
  verifyCourseOwnership,
  (req, res, next) => artifactsController.upload(req, res, next)
);

// حذف دليل (محمي بالـ Ownership)
router.delete(
  '/:id',
  requirePermission('artifact', Action.EDIT, PermissionScope.OWN),
  (req, res, next) => artifactsController.remove(req, res, next)
);

export default router;
