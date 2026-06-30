import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { reportsController } from './reports.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

/**
 * GET /api/reports/courses/:courseId/clo-attainment?semester=X&academicYear=Y
 * تصدير تقرير تحقيق CLOs للمقرر بصيغة PDF
 */
router.get(
  '/courses/:courseId/clo-attainment',
  requirePermission('assessment', Action.READ, PermissionScope.OWN),
  (req, res, next) => reportsController.cloReport(req, res, next)
);

/**
 * GET /api/reports/programs/:programId/plo-attainment?academicYear=Y
 * تصدير تقرير تحقيق PLOs للبرنامج بصيغة PDF
 */
router.get(
  '/programs/:programId/plo-attainment',
  requirePermission('assessment', Action.READ, PermissionScope.DEPARTMENT),
  (req, res, next) => reportsController.ploReport(req, res, next)
);

/**
 * GET /api/reports/courses/:courseId/course-file?semester=X&academicYear=Y
 * تصدير ملف المقرر الكامل (NCAAA) بصيغة PDF
 */
router.get(
  '/courses/:courseId/course-file',
  requirePermission('assessment', Action.READ, PermissionScope.OWN),
  (req, res, next) => reportsController.courseFile(req, res, next)
);

export default router;
