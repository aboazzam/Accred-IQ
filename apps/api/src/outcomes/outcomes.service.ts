import { prisma, LearningDomain, AlignmentLevel } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { recordAudit } from '../shared/audit';

// =========================================================
// PLO Schemas
// =========================================================

export const createPloSchema = z.object({
  code: z.string().min(1).max(20),
  description: z.string().min(5),
  descriptionAr: z.string().min(5),
  domain: z.nativeEnum(LearningDomain),
  targetLevelId: z.string().uuid().optional(),
  order: z.number().int().min(0).default(0),
});

export const updatePloSchema = createPloSchema.partial();
export type CreatePloDto = z.infer<typeof createPloSchema>;
export type UpdatePloDto = z.infer<typeof updatePloSchema>;

// =========================================================
// CLO Schemas
// =========================================================

export const createCloSchema = z.object({
  code: z.string().min(1).max(20),
  description: z.string().min(5),
  descriptionAr: z.string().min(5),
  domain: z.nativeEnum(LearningDomain),
  targetLevelId: z.string().uuid().optional(),
  order: z.number().int().min(0).default(0),
});

export const updateCloSchema = createCloSchema.partial();
export type CreateCloDto = z.infer<typeof createCloSchema>;
export type UpdateCloDto = z.infer<typeof updateCloSchema>;

// =========================================================
// Mapping Schema
// =========================================================

export const setMappingSchema = z.object({
  alignmentLevel: z.nativeEnum(AlignmentLevel),
  notes: z.string().optional(),
});

export type SetMappingDto = z.infer<typeof setMappingSchema>;

const ALIGNMENT_WEIGHTS: Record<AlignmentLevel, number> = {
  [AlignmentLevel.NONE]: 0,
  [AlignmentLevel.INDIRECT]: 1,
  [AlignmentLevel.PARTIAL]: 2,
  [AlignmentLevel.DIRECT]: 3,
};

const OUTCOME_SELECT = {
  id: true,
  code: true,
  description: true,
  descriptionAr: true,
  domain: true,
  order: true,
  isActive: true,
  createdAt: true,
  targetLevel: { select: { id: true, code: true, nameAr: true, color: true, weight: true } },
};

// =========================================================
// PLO Service
// =========================================================

export class PlosService {
  async findAll(programId: string) {
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) throw AppError.notFound('البرنامج');
    return prisma.programLearningOutcome.findMany({
      where: { programId, isActive: true },
      select: { ...OUTCOME_SELECT, _count: { select: { mappings: true } } },
      orderBy: { order: 'asc' },
    });
  }

  async create(programId: string, dto: CreatePloDto, actorId: string) {
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) throw AppError.notFound('البرنامج');
    const exists = await prisma.programLearningOutcome.findUnique({ where: { programId_code: { programId, code: dto.code } } });
    if (exists) throw AppError.conflict(`الكود ${dto.code} موجود مسبقاً في هذا البرنامج`);
    const plo = await prisma.programLearningOutcome.create({ data: { ...dto, programId }, select: OUTCOME_SELECT });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'program_learning_outcomes', targetId: plo.id, targetComponent: 'outcomes-api', newValues: { programId, ...dto } });
    return plo;
  }

  async update(id: string, dto: UpdatePloDto, actorId: string) {
    const existing = await prisma.programLearningOutcome.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('مخرج التعلم');
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await prisma.programLearningOutcome.findUnique({ where: { programId_code: { programId: existing.programId, code: dto.code } } });
      if (codeExists) throw AppError.conflict(`الكود ${dto.code} موجود مسبقاً`);
    }
    const updated = await prisma.programLearningOutcome.update({ where: { id }, data: dto, select: OUTCOME_SELECT });
    await recordAudit({ userId: actorId, action: 'UPDATE', targetTable: 'program_learning_outcomes', targetId: id, targetComponent: 'outcomes-api', oldValues: existing as Record<string, unknown>, newValues: dto });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await prisma.programLearningOutcome.findUnique({ where: { id }, include: { _count: { select: { mappings: true } } } });
    if (!existing) throw AppError.notFound('مخرج التعلم');
    if (existing._count.mappings > 0) throw new AppError('لا يمكن حذف مخرج مرتبط بمقررات — أزل الروابط أولاً', 409);
    await prisma.programLearningOutcome.delete({ where: { id } });
    await recordAudit({ userId: actorId, action: 'DELETE', targetTable: 'program_learning_outcomes', targetId: id, targetComponent: 'outcomes-api' });
  }
}

// =========================================================
// CLO Service
// =========================================================

export class CloService {
  async findAll(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw AppError.notFound('المقرر');
    return prisma.courseLearningOutcome.findMany({
      where: { courseId, isActive: true },
      select: {
        ...OUTCOME_SELECT,
        mappings: {
          select: {
            alignmentLevel: true,
            alignmentWeight: true,
            plo: { select: { id: true, code: true, programId: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async create(courseId: string, dto: CreateCloDto, actorId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw AppError.notFound('المقرر');
    const exists = await prisma.courseLearningOutcome.findUnique({ where: { courseId_code: { courseId, code: dto.code } } });
    if (exists) throw AppError.conflict(`الكود ${dto.code} موجود مسبقاً في هذا المقرر`);
    const clo = await prisma.courseLearningOutcome.create({ data: { ...dto, courseId }, select: OUTCOME_SELECT });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'course_learning_outcomes', targetId: clo.id, targetComponent: 'outcomes-api', newValues: { courseId, ...dto } });
    return clo;
  }

  async update(id: string, dto: UpdateCloDto, actorId: string) {
    const existing = await prisma.courseLearningOutcome.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('مخرج التعلم');
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await prisma.courseLearningOutcome.findUnique({ where: { courseId_code: { courseId: existing.courseId, code: dto.code } } });
      if (codeExists) throw AppError.conflict(`الكود ${dto.code} موجود مسبقاً`);
    }
    const updated = await prisma.courseLearningOutcome.update({ where: { id }, data: dto, select: OUTCOME_SELECT });
    await recordAudit({ userId: actorId, action: 'UPDATE', targetTable: 'course_learning_outcomes', targetId: id, targetComponent: 'outcomes-api', oldValues: existing as Record<string, unknown>, newValues: dto });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await prisma.courseLearningOutcome.findUnique({ where: { id }, include: { _count: { select: { mappings: true } } } });
    if (!existing) throw AppError.notFound('مخرج التعلم');
    if (existing._count.mappings > 0) throw new AppError('لا يمكن حذف مخرج مرتبط ببرامج — أزل الروابط أولاً', 409);
    await prisma.courseLearningOutcome.delete({ where: { id } });
    await recordAudit({ userId: actorId, action: 'DELETE', targetTable: 'course_learning_outcomes', targetId: id, targetComponent: 'outcomes-api' });
  }
}

// =========================================================
// Mapping Matrix Service
// =========================================================

export class MappingService {
  async getMatrix(programId: string) {
    const plos = await prisma.programLearningOutcome.findMany({
      where: { programId, isActive: true },
      select: { id: true, code: true, description: true, domain: true },
      orderBy: { order: 'asc' },
    });

    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: {
        courses: {
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            name: true,
            clos: {
              where: { isActive: true },
              select: {
                id: true,
                code: true,
                description: true,
                domain: true,
                mappings: {
                  select: { ploId: true, alignmentLevel: true, alignmentWeight: true, notes: true },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!program) throw AppError.notFound('البرنامج');

    // بناء المصفوفة: كل CLO في صف، كل PLO في عمود
    const matrix = program.courses.map((course) => ({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      clos: course.clos.map((clo) => {
        const ploMap: Record<string, { level: string; weight: number; notes?: string | null }> = {};
        for (const mapping of clo.mappings) {
          ploMap[mapping.ploId] = { level: mapping.alignmentLevel, weight: mapping.alignmentWeight, notes: mapping.notes };
        }
        return {
          cloId: clo.id,
          cloCode: clo.code,
          description: clo.description,
          domain: clo.domain,
          ploMappings: plos.map((plo) => ({
            ploId: plo.id,
            ploCode: plo.code,
            ...(ploMap[plo.id] ?? { level: AlignmentLevel.NONE, weight: 0, notes: null }),
          })),
        };
      }),
    }));

    return { plos, courses: matrix };
  }

  async setMapping(ploId: string, cloId: string, dto: SetMappingDto, actorId: string) {
    const [plo, clo] = await Promise.all([
      prisma.programLearningOutcome.findUnique({ where: { id: ploId } }),
      prisma.courseLearningOutcome.findUnique({ where: { id: cloId } }),
    ]);
    if (!plo) throw AppError.notFound('مخرج البرنامج PLO');
    if (!clo) throw AppError.notFound('مخرج المقرر CLO');

    const weight = ALIGNMENT_WEIGHTS[dto.alignmentLevel];

    const mapping = await prisma.ploCloPloMapping.upsert({
      where: { ploId_cloId: { ploId, cloId } },
      update: { alignmentLevel: dto.alignmentLevel, alignmentWeight: weight, notes: dto.notes ?? null },
      create: { ploId, cloId, alignmentLevel: dto.alignmentLevel, alignmentWeight: weight, notes: dto.notes ?? null },
      select: { id: true, ploId: true, cloId: true, alignmentLevel: true, alignmentWeight: true, notes: true },
    });

    await recordAudit({
      userId: actorId, action: 'UPDATE', targetTable: 'plo_clo_mapping',
      targetId: mapping.id, targetComponent: 'outcomes-api',
      newValues: { ploId, cloId, ...dto, weight },
    });
    return mapping;
  }

  async removeMapping(ploId: string, cloId: string, actorId: string) {
    const existing = await prisma.ploCloPloMapping.findUnique({ where: { ploId_cloId: { ploId, cloId } } });
    if (!existing) throw AppError.notFound('الارتباط');
    await prisma.ploCloPloMapping.delete({ where: { ploId_cloId: { ploId, cloId } } });
    await recordAudit({ userId: actorId, action: 'DELETE', targetTable: 'plo_clo_mapping', targetComponent: 'outcomes-api', oldValues: existing as Record<string, unknown> });
  }
}

export const plosService = new PlosService();
export const cloService = new CloService();
export const mappingService = new MappingService();
