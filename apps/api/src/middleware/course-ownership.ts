import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@accred-iq/database';
import { AppError } from '../shared/app-error';

// يتحقق أن المستخدم هو أستاذ المقرر أو مدير البرنامج أو يملك نطاق صلاحية أعلى
export async function verifyCourseOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const courseId = req.params.courseId ?? req.body?.courseId ?? req.params.id;

    if (!courseId) {
      next();
      return;
    }

    // نطاق UNIVERSITY أو COLLEGE يتجاوز قيد الملكية
    const hasWideScope = user.permissions.some(
      (p) =>
        ['grade', 'assessment', 'artifact', 'indirect_assessment'].includes(p.resource) &&
        ['UNIVERSITY', 'COLLEGE'].includes(p.scope)
    );
    if (hasWideScope) {
      next();
      return;
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, programId: true },
    });
    if (!course) throw AppError.notFound('المقرر');

    // أستاذ المقرر المعين
    if (course.instructorId === user.sub) {
      next();
      return;
    }

    // مدير البرنامج
    const program = await prisma.program.findUnique({
      where: { id: course.programId },
      select: { directorId: true },
    });
    if (program?.directorId === user.sub) {
      next();
      return;
    }

    throw AppError.forbidden('رفع الدرجات والأدلة مقتصر على أستاذ المقرر أو مدير البرنامج');
  } catch (err) {
    next(err);
  }
}
