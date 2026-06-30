import { prisma, AssessmentType } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { recordAudit } from '../shared/audit';
import { recalculateCourseAttainment } from './attainment.engine';

// =========================================================
// Schemas
// =========================================================

export const createMethodSchema = z.object({
  courseId: z.string().uuid(),
  type: z.nativeEnum(AssessmentType),
  name: z.string().min(2),
  nameAr: z.string().min(2),
  weight: z.number().min(0).max(100),
  maxScore: z.number().positive(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
  conductedAt: z.coerce.date().optional(),
});

export const createItemSchema = z.object({
  cloId: z.string().uuid(),
  label: z.string().min(1),
  maxScore: z.number().positive(),
  order: z.number().int().min(0).default(0),
});

export const bulkGradesSchema = z.object({
  semester: z.string().min(1),
  academicYear: z.string().min(4),
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      studentName: z.string().optional(),
      scores: z.array(
        z.object({
          itemId: z.string().uuid(),
          score: z.number().min(0),
        })
      ),
    })
  ).min(1),
});

export type CreateMethodDto = z.infer<typeof createMethodSchema>;
export type CreateItemDto = z.infer<typeof createItemSchema>;
export type BulkGradesDto = z.infer<typeof bulkGradesSchema>;

// =========================================================
// Assessment Methods Service
// =========================================================

const METHOD_SELECT = {
  id: true, type: true, name: true, nameAr: true,
  weight: true, maxScore: true, semester: true,
  academicYear: true, conductedAt: true, isActive: true,
  createdAt: true,
  course: { select: { id: true, code: true, name: true } },
  _count: { select: { items: true } },
};

export class AssessmentsService {
  async listMethods(courseId: string) {
    return prisma.assessmentMethod.findMany({
      where: { courseId, isActive: true },
      select: METHOD_SELECT,
      orderBy: { conductedAt: 'asc' },
    });
  }

  async getMethod(id: string) {
    const method = await prisma.assessmentMethod.findUnique({
      where: { id },
      select: {
        ...METHOD_SELECT,
        items: {
          select: {
            id: true, label: true, maxScore: true, order: true,
            clo: { select: { id: true, code: true, description: true } },
            _count: { select: { grades: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!method) throw AppError.notFound('أداة التقييم');
    return method;
  }

  async createMethod(dto: CreateMethodDto, actorId: string) {
    const course = await prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw AppError.notFound('المقرر');

    // التحقق أن مجموع الأوزان لا يتجاوز 100%
    const currentWeightSum = await prisma.assessmentMethod.aggregate({
      where: { courseId: dto.courseId, isActive: true },
      _sum: { weight: true },
    });
    const usedWeight = currentWeightSum._sum.weight ?? 0;
    if (usedWeight + dto.weight > 100) {
      throw new AppError(
        `مجموع الأوزان سيتجاوز 100% (المستخدم حالياً: ${usedWeight}%)`,
        409
      );
    }

    const method = await prisma.assessmentMethod.create({ data: dto, select: METHOD_SELECT });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'assessment_methods', targetId: method.id, targetComponent: 'assessments-api', newValues: dto as Record<string, unknown> });
    return method;
  }

  async addItem(assessmentId: string, dto: CreateItemDto, actorId: string) {
    const assessment = await prisma.assessmentMethod.findUnique({
      where: { id: assessmentId },
      select: { id: true, maxScore: true, courseId: true, items: { select: { maxScore: true } } },
    });
    if (!assessment) throw AppError.notFound('أداة التقييم');

    const clo = await prisma.courseLearningOutcome.findFirst({
      where: { id: dto.cloId, courseId: assessment.courseId },
    });
    if (!clo) throw new AppError('مخرج التعلم لا ينتمي لهذا المقرر', 400);

    const usedScore = assessment.items.reduce((s, i) => s + i.maxScore, 0);
    if (usedScore + dto.maxScore > assessment.maxScore) {
      throw new AppError(`مجموع درجات العناصر سيتجاوز الدرجة الكلية (${assessment.maxScore})`, 409);
    }

    const item = await prisma.assessmentItem.create({
      data: { assessmentId, ...dto },
      select: { id: true, label: true, maxScore: true, order: true, clo: { select: { id: true, code: true } } },
    });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'assessment_items', targetId: item.id, targetComponent: 'assessments-api', newValues: { assessmentId, ...dto } });
    return item;
  }

  // =========================================================
  // رفع درجات الطلاب — المسار الأكثر حساسيةً في النظام
  // =========================================================
  async uploadGrades(assessmentId: string, dto: BulkGradesDto, actorId: string) {
    const assessment = await prisma.assessmentMethod.findUnique({
      where: { id: assessmentId },
      select: { courseId: true, items: { select: { id: true, maxScore: true } } },
    });
    if (!assessment) throw AppError.notFound('أداة التقييم');

    const itemMap = new Map(assessment.items.map((i) => [i.id, i.maxScore]));

    // التحقق من صحة الدرجات قبل الإدراج
    for (const studentEntry of dto.grades) {
      for (const { itemId, score } of studentEntry.scores) {
        const maxScore = itemMap.get(itemId);
        if (maxScore === undefined) throw new AppError(`العنصر ${itemId} لا ينتمي لهذه الأداة`, 400);
        if (score < 0 || score > maxScore) {
          throw new AppError(
            `درجة الطالب ${studentEntry.studentId} في العنصر ${itemId} خارج النطاق (0 → ${maxScore})`,
            422
          );
        }
      }
    }

    // الإدراج/التحديث داخل transaction مع تسجيل التدقيق
    const gradeOps: ReturnType<typeof prisma.studentGrade.upsert>[] = [];
    const auditEntries: { studentId: string; itemId: string; score: number }[] = [];

    for (const studentEntry of dto.grades) {
      for (const { itemId, score } of studentEntry.scores) {
        const existingGrade = await prisma.studentGrade.findUnique({
          where: { assessmentItemId_studentId: { assessmentItemId: itemId, studentId: studentEntry.studentId } },
          select: { score: true },
        });

        gradeOps.push(
          prisma.studentGrade.upsert({
            where: { assessmentItemId_studentId: { assessmentItemId: itemId, studentId: studentEntry.studentId } },
            update: { score, studentName: studentEntry.studentName },
            create: {
              assessmentItemId: itemId,
              studentId: studentEntry.studentId,
              studentName: studentEntry.studentName,
              score,
            },
          })
        );

        if (existingGrade && existingGrade.score !== score) {
          auditEntries.push({ studentId: studentEntry.studentId, itemId, score });
        }
      }
    }

    await prisma.$transaction(gradeOps);

    // تسجيل التدقيق لأي تعديل في درجة موجودة
    for (const entry of auditEntries) {
      await recordAudit({
        userId: actorId,
        action: 'GRADE_MODIFIED',
        targetTable: 'student_grades',
        targetComponent: 'assessments-api',
        newValues: entry,
        metadata: { assessmentId, warning: 'GRADE_CHANGE_DETECTED' },
      });
    }

    // الحساب التلقائي الفوري لنسب التحقيق
    const updated = await recalculateCourseAttainment(
      assessment.courseId,
      dto.semester,
      dto.academicYear,
      actorId
    );

    await recordAudit({
      userId: actorId,
      action: 'GRADES_UPLOADED',
      targetTable: 'student_grades',
      targetId: assessmentId,
      targetComponent: 'assessments-api',
      newValues: { assessmentId, studentCount: dto.grades.length, cloResultsUpdated: updated },
    });

    return {
      studentsProcessed: dto.grades.length,
      gradesInserted: gradeOps.length,
      cloAttainmentsRecalculated: updated,
    };
  }
}

export const assessmentsService = new AssessmentsService();
