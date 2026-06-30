import { prisma, IndirectAssessmentType } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { recordAudit } from '../shared/audit';
import { recalculateCourseAttainment } from '../assessments/attainment.engine';

export const createSurveySchema = z.object({
  courseId: z.string().uuid(),
  type: z.nativeEnum(IndirectAssessmentType),
  title: z.string().min(2),
  semester: z.string().min(1),
  academicYear: z.string().min(4),
  responseCount: z.number().int().min(1),
  conductedAt: z.coerce.date().optional(),
  items: z.array(
    z.object({
      cloId: z.string().uuid().optional(),
      question: z.string().min(3),
      questionAr: z.string().optional(),
      averageScore: z.number().min(0).max(5),
      maxScore: z.number().positive().default(5),
    })
  ).min(1),
});

export type CreateSurveyDto = z.infer<typeof createSurveySchema>;

const SURVEY_SELECT = {
  id: true, type: true, title: true, semester: true, academicYear: true,
  responseCount: true, conductedAt: true, isActive: true, createdAt: true,
  course: { select: { id: true, code: true, name: true } },
  _count: { select: { items: true } },
};

export class IndirectService {
  async listSurveys(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw AppError.notFound('المقرر');
    return prisma.indirectAssessment.findMany({
      where: { courseId, isActive: true },
      select: { ...SURVEY_SELECT, items: { select: { id: true, question: true, averageScore: true, maxScore: true, clo: { select: { code: true } } } } },
      orderBy: { academicYear: 'desc' },
    });
  }

  async createSurvey(dto: CreateSurveyDto, actorId: string) {
    const course = await prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw AppError.notFound('المقرر');

    // التحقق من أن جميع الـ CLOs تنتمي لهذا المقرر
    const cloIds = dto.items.map((i) => i.cloId).filter(Boolean) as string[];
    if (cloIds.length > 0) {
      const clos = await prisma.courseLearningOutcome.findMany({
        where: { id: { in: cloIds }, courseId: dto.courseId },
        select: { id: true },
      });
      if (clos.length !== new Set(cloIds).size) {
        throw new AppError('بعض مخرجات التعلم لا تنتمي لهذا المقرر', 400);
      }
    }

    const { items, ...surveyData } = dto;

    const survey = await prisma.indirectAssessment.create({
      data: {
        ...surveyData,
        items: { create: items },
      },
      select: { ...SURVEY_SELECT, items: { select: { id: true, question: true, averageScore: true, clo: { select: { code: true } } } } },
    });

    // إعادة حساب التحقيق بعد إضافة بيانات غير مباشرة جديدة
    await recalculateCourseAttainment(dto.courseId, dto.semester, dto.academicYear, actorId);

    await recordAudit({
      userId: actorId,
      action: 'CREATE',
      targetTable: 'indirect_assessments',
      targetId: survey.id,
      targetComponent: 'indirect-api',
      newValues: { courseId: dto.courseId, type: dto.type, responseCount: dto.responseCount },
    });

    return survey;
  }

  // ملخص مقارنة التحقيق المباشر وغير المباشر لمقرر
  async getIndirectVsDirectSummary(courseId: string, semester: string, academicYear: string) {
    const results = await prisma.cloAttainmentResult.findMany({
      where: { courseId, semester, academicYear },
      select: {
        directAttainment: true, indirectAttainment: true, overallAttainment: true,
        clo: { select: { code: true, description: true } },
      },
    });

    return results.map((r) => ({
      cloCode: r.clo.code,
      description: r.clo.description,
      directAttainment: r.directAttainment,
      indirectAttainment: r.indirectAttainment,
      overallAttainment: r.overallAttainment,
      gap: r.indirectAttainment !== null
        ? +(r.directAttainment - r.indirectAttainment).toFixed(2)
        : null,
    }));
  }
}

export const indirectService = new IndirectService();
