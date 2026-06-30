import { prisma } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { buildPagination, buildPaginatedResponse } from '../shared/pagination';
import { recordAudit } from '../shared/audit';

export const createCourseSchema = z.object({
  code: z.string().min(2).max(20).toUpperCase(),
  name: z.string().min(2),
  nameAr: z.string().min(2),
  creditHours: z.number().int().min(1).max(6),
  programId: z.string().uuid(),
  instructorId: z.string().uuid().optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();
export type CreateCourseDto = z.infer<typeof createCourseSchema>;
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;

const COURSE_SELECT = {
  id: true,
  code: true,
  name: true,
  nameAr: true,
  creditHours: true,
  semester: true,
  academicYear: true,
  isActive: true,
  createdAt: true,
  program: { select: { id: true, name: true, nameAr: true, code: true } },
  instructor: { select: { id: true, name: true, email: true } },
  _count: { select: { clos: true } },
};

export class CoursesService {
  async findAll(page: number, limit: number, programId?: string) {
    const { skip, take } = buildPagination(page, limit);
    const where = programId ? { programId } : {};
    const [data, total] = await Promise.all([
      prisma.course.findMany({ skip, take, where, select: COURSE_SELECT, orderBy: { code: 'asc' } }),
      prisma.course.count({ where }),
    ]);
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        ...COURSE_SELECT,
        clos: {
          where: { isActive: true },
          select: {
            id: true, code: true, description: true, descriptionAr: true,
            domain: true, order: true,
            targetLevel: { select: { code: true, nameAr: true, color: true } },
            mappings: { select: { alignmentLevel: true, alignmentWeight: true, plo: { select: { code: true } } } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!course) throw AppError.notFound('المقرر');
    return course;
  }

  async create(dto: CreateCourseDto, actorId: string) {
    const exists = await prisma.course.findUnique({ where: { code: dto.code } });
    if (exists) throw AppError.conflict(`كود المقرر ${dto.code} مستخدم مسبقاً`);
    const program = await prisma.program.findUnique({ where: { id: dto.programId } });
    if (!program) throw AppError.notFound('البرنامج');
    const course = await prisma.course.create({ data: dto, select: COURSE_SELECT });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'courses', targetId: course.id, targetComponent: 'courses-api', newValues: dto });
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, actorId: string) {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('المقرر');
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await prisma.course.findUnique({ where: { code: dto.code } });
      if (codeExists) throw AppError.conflict(`كود المقرر ${dto.code} مستخدم مسبقاً`);
    }
    const updated = await prisma.course.update({ where: { id }, data: dto, select: COURSE_SELECT });
    await recordAudit({ userId: actorId, action: 'UPDATE', targetTable: 'courses', targetId: id, targetComponent: 'courses-api', oldValues: existing as Record<string, unknown>, newValues: dto });
    return updated;
  }
}

export const coursesService = new CoursesService();
