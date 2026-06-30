import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { verifyCourseOwnership } from '../middleware/course-ownership';
import { assessmentsController } from './assessments.controller';
import { attainmentService, attainmentQuerySchema } from './attainment.service';
import { Action, PermissionScope } from '@accred-iq/database';
import type { Request, Response, NextFunction } from 'express';

const academicYearSchema = z.object({ academicYear: z.string().min(4) });

const router = Router();
router.use(authenticate);

// ---- أدوات التقييم ----
router.get(
  '/courses/:courseId/methods',
  requirePermission('assessment', Action.READ, PermissionScope.OWN),
  (req, res, next) => assessmentsController.listMethods(req, res, next)
);

router.get(
  '/methods/:id',
  requirePermission('assessment', Action.READ, PermissionScope.OWN),
  (req, res, next) => assessmentsController.getMethod(req, res, next)
);

router.post(
  '/methods',
  requirePermission('assessment', Action.WRITE, PermissionScope.OWN),
  verifyCourseOwnership,
  (req, res, next) => assessmentsController.createMethod(req, res, next)
);

// ---- عناصر التقييم ----
router.post(
  '/methods/:assessmentId/items',
  requirePermission('assessment', Action.WRITE, PermissionScope.OWN),
  (req, res, next) => assessmentsController.addItem(req, res, next)
);

// ---- رفع الدرجات (محمي بالـ Ownership) ----
router.post(
  '/methods/:assessmentId/grades',
  requirePermission('grade', Action.WRITE, PermissionScope.OWN),
  async (req: Request, res: Response, next: NextFunction) => {
    // استخراج courseId من الـ assessment للتحقق من الملكية
    try {
      const { prisma } = await import('@accred-iq/database');
      const method = await prisma.assessmentMethod.findUnique({
        where: { id: req.params.assessmentId },
        select: { courseId: true },
      });
      if (method) req.params.courseId = method.courseId;
      next();
    } catch (e) { next(e); }
  },
  verifyCourseOwnership,
  (req, res, next) => assessmentsController.uploadGrades(req, res, next)
);

// ---- تقرير التحقيق ----
router.get(
  '/attainment/:courseId',
  requirePermission('assessment', Action.READ, PermissionScope.OWN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { semester, academicYear } = attainmentQuerySchema.parse(req.query);
      const report = await attainmentService.getCourseReport(req.params.courseId, semester, academicYear);
      res.json({ success: true, data: report });
    } catch (e) { next(e); }
  }
);

router.get(
  '/attainment/program/:programId',
  requirePermission('assessment', Action.READ, PermissionScope.DEPARTMENT),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear } = academicYearSchema.parse(req.query);
      const report = await attainmentService.getAllCoursesReport(req.params.programId, academicYear);
      res.json({ success: true, data: report });
    } catch (e) { next(e); }
  }
);

export default router;
