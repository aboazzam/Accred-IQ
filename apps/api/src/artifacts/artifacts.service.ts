import { prisma, ArtifactCategory } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { recordAudit } from '../shared/audit';

export const uploadArtifactSchema = z.object({
  courseId: z.string().uuid(),
  assessmentId: z.string().uuid().optional(),
  category: z.nativeEnum(ArtifactCategory),
  title: z.string().min(2),
  description: z.string().optional(),
  fileUrl: z.string().url('رابط الملف غير صالح'),
  mimeType: z.string().optional(),
  fileSizeKb: z.number().int().positive().optional(),
  studentId: z.string().optional(), // مُجهَّل — بدون اسم
  academicYear: z.string().optional(),
  semester: z.string().optional(),
});

export type UploadArtifactDto = z.infer<typeof uploadArtifactSchema>;

const ARTIFACT_SELECT = {
  id: true, category: true, title: true, description: true,
  fileUrl: true, mimeType: true, fileSizeKb: true,
  academicYear: true, semester: true, createdAt: true,
  assessment: { select: { id: true, type: true, name: true } },
  uploadedBy: { select: { id: true, name: true } },
};

export class ArtifactsService {
  async list(courseId: string, category?: ArtifactCategory) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw AppError.notFound('المقرر');

    return prisma.courseArtifact.findMany({
      where: { courseId, ...(category ? { category } : {}) },
      select: ARTIFACT_SELECT,
      orderBy: [{ academicYear: 'desc' }, { category: 'asc' }],
    });
  }

  async upload(dto: UploadArtifactDto, actorId: string) {
    if (dto.assessmentId) {
      const method = await prisma.assessmentMethod.findFirst({
        where: { id: dto.assessmentId, courseId: dto.courseId },
      });
      if (!method) throw new AppError('أداة التقييم لا تنتمي لهذا المقرر', 400);
    }

    const artifact = await prisma.courseArtifact.create({
      data: { ...dto, uploadedById: actorId },
      select: ARTIFACT_SELECT,
    });

    await recordAudit({
      userId: actorId,
      action: 'ARTIFACT_UPLOADED',
      targetTable: 'course_artifacts',
      targetId: artifact.id,
      targetComponent: 'artifacts-api',
      newValues: { courseId: dto.courseId, category: dto.category, title: dto.title },
    });

    return artifact;
  }

  async remove(id: string, actorId: string) {
    const artifact = await prisma.courseArtifact.findUnique({ where: { id } });
    if (!artifact) throw AppError.notFound('الملف');

    await prisma.courseArtifact.delete({ where: { id } });

    await recordAudit({
      userId: actorId,
      action: 'ARTIFACT_DELETED',
      targetTable: 'course_artifacts',
      targetId: id,
      targetComponent: 'artifacts-api',
      oldValues: artifact as Record<string, unknown>,
    });
  }

  // تقرير ملف المقرر — يتحقق من اكتمال العينات الثلاث لكل أداة تقييم
  async getCourseFileStatus(courseId: string) {
    const methods = await prisma.assessmentMethod.findMany({
      where: { courseId, isActive: true },
      select: {
        id: true, name: true, type: true,
        artifacts: { select: { category: true } },
      },
    });

    return methods.map((method) => {
      const uploadedCategories = new Set(method.artifacts.map((a) => a.category));
      return {
        assessmentId: method.id,
        assessmentName: method.name,
        type: method.type,
        hasHighest: uploadedCategories.has('HIGHEST'),
        hasAverage: uploadedCategories.has('AVERAGE'),
        hasLowest: uploadedCategories.has('LOWEST'),
        hasRubric: uploadedCategories.has('RUBRIC'),
        isComplete: ['HIGHEST', 'AVERAGE', 'LOWEST'].every((c) => uploadedCategories.has(c as ArtifactCategory)),
      };
    });
  }
}

export const artifactsService = new ArtifactsService();
