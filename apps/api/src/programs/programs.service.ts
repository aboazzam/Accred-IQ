import { prisma, ProgramLevel, AccreditationStatus } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { buildPagination, buildPaginatedResponse } from '../shared/pagination';
import { recordAudit } from '../shared/audit';

export const createProgramSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2),
  code: z.string().min(2).max(20).toUpperCase(),
  level: z.nativeEnum(ProgramLevel).default(ProgramLevel.BACHELOR),
  totalCreditHours: z.number().int().min(1),
  departmentId: z.string().uuid().optional(),
  directorId: z.string().uuid().optional(),
  accreditationBody: z.string().optional(),
  accreditationStatus: z.nativeEnum(AccreditationStatus).default(AccreditationStatus.NOT_STARTED),
  accreditationExpiry: z.coerce.date().optional(),
});

export const updateProgramSchema = createProgramSchema.partial();
export type CreateProgramDto = z.infer<typeof createProgramSchema>;
export type UpdateProgramDto = z.infer<typeof updateProgramSchema>;

const PROGRAM_SELECT = {
  id: true,
  name: true,
  nameAr: true,
  code: true,
  level: true,
  totalCreditHours: true,
  accreditationBody: true,
  accreditationStatus: true,
  accreditationExpiry: true,
  isActive: true,
  createdAt: true,
  department: { select: { id: true, name: true, nameAr: true, college: { select: { id: true, name: true, nameAr: true } } } },
  director: { select: { id: true, name: true, email: true } },
  _count: { select: { courses: true, plos: true } },
};

export class ProgramsService {
  async findAll(page: number, limit: number, departmentId?: string) {
    const { skip, take } = buildPagination(page, limit);
    const where = departmentId ? { departmentId } : {};
    const [data, total] = await Promise.all([
      prisma.program.findMany({ skip, take, where, select: PROGRAM_SELECT, orderBy: { code: 'asc' } }),
      prisma.program.count({ where }),
    ]);
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const program = await prisma.program.findUnique({
      where: { id },
      select: {
        ...PROGRAM_SELECT,
        plos: {
          where: { isActive: true },
          select: { id: true, code: true, description: true, descriptionAr: true, domain: true, order: true, targetLevel: { select: { code: true, nameAr: true, color: true } } },
          orderBy: { order: 'asc' },
        },
        courses: {
          where: { isActive: true },
          select: { id: true, code: true, name: true, nameAr: true, creditHours: true, semester: true, _count: { select: { clos: true } } },
          orderBy: { code: 'asc' },
        },
      },
    });
    if (!program) throw AppError.notFound('البرنامج');
    return program;
  }

  async create(dto: CreateProgramDto, actorId: string) {
    const exists = await prisma.program.findUnique({ where: { code: dto.code } });
    if (exists) throw AppError.conflict(`الكود ${dto.code} مستخدم مسبقاً`);
    const dept = await prisma.department.findUnique({ where: { id: dto.departmentId } });
    if (!dept) throw AppError.notFound('القسم');
    const program = await prisma.program.create({ data: dto, select: PROGRAM_SELECT });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'programs', targetId: program.id, targetComponent: 'programs-api', newValues: dto as Record<string, unknown> });
    return program;
  }

  async update(id: string, dto: UpdateProgramDto, actorId: string) {
    const existing = await prisma.program.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('البرنامج');
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await prisma.program.findUnique({ where: { code: dto.code } });
      if (codeExists) throw AppError.conflict(`الكود ${dto.code} مستخدم مسبقاً`);
    }
    const updated = await prisma.program.update({ where: { id }, data: dto, select: PROGRAM_SELECT });
    await recordAudit({ userId: actorId, action: 'UPDATE', targetTable: 'programs', targetId: id, targetComponent: 'programs-api', oldValues: existing as Record<string, unknown>, newValues: dto as Record<string, unknown> });
    return updated;
  }
}

export const programsService = new ProgramsService();
