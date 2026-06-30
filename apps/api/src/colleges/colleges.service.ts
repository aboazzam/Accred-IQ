import { prisma } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { buildPagination, buildPaginatedResponse } from '../shared/pagination';
import { recordAudit } from '../shared/audit';

export const createCollegeSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2),
  code: z.string().min(2).max(20).toUpperCase(),
  deanId: z.string().uuid().optional(),
});

export const updateCollegeSchema = createCollegeSchema.partial();

export type CreateCollegeDto = z.infer<typeof createCollegeSchema>;
export type UpdateCollegeDto = z.infer<typeof updateCollegeSchema>;

const COLLEGE_SELECT = {
  id: true,
  name: true,
  nameAr: true,
  code: true,
  isActive: true,
  createdAt: true,
  dean: { select: { id: true, name: true, email: true } },
  _count: { select: { departments: true } },
};

export class CollegesService {
  async findAll(page: number, limit: number) {
    const { skip, take } = buildPagination(page, limit);
    const [data, total] = await Promise.all([
      prisma.college.findMany({ skip, take, select: COLLEGE_SELECT, orderBy: { code: 'asc' } }),
      prisma.college.count(),
    ]);
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const college = await prisma.college.findUnique({
      where: { id },
      select: {
        ...COLLEGE_SELECT,
        departments: {
          select: { id: true, name: true, nameAr: true, code: true, _count: { select: { programs: true } } },
          orderBy: { code: 'asc' },
        },
      },
    });
    if (!college) throw AppError.notFound('الكلية');
    return college;
  }

  async create(dto: CreateCollegeDto, actorId: string) {
    const exists = await prisma.college.findUnique({ where: { code: dto.code } });
    if (exists) throw AppError.conflict(`الكود ${dto.code} مستخدم مسبقاً`);

    const college = await prisma.college.create({ data: dto, select: COLLEGE_SELECT });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'colleges', targetId: college.id, targetComponent: 'colleges-api', newValues: dto });
    return college;
  }

  async update(id: string, dto: UpdateCollegeDto, actorId: string) {
    const existing = await prisma.college.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('الكلية');
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await prisma.college.findUnique({ where: { code: dto.code } });
      if (codeExists) throw AppError.conflict(`الكود ${dto.code} مستخدم مسبقاً`);
    }
    const updated = await prisma.college.update({ where: { id }, data: dto, select: COLLEGE_SELECT });
    await recordAudit({ userId: actorId, action: 'UPDATE', targetTable: 'colleges', targetId: id, targetComponent: 'colleges-api', oldValues: existing as Record<string, unknown>, newValues: dto });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await prisma.college.findUnique({ where: { id }, include: { _count: { select: { departments: true } } } });
    if (!existing) throw AppError.notFound('الكلية');
    if (existing._count.departments > 0) throw new AppError('لا يمكن حذف كلية تحتوي على أقسام', 409);
    await prisma.college.delete({ where: { id } });
    await recordAudit({ userId: actorId, action: 'DELETE', targetTable: 'colleges', targetId: id, targetComponent: 'colleges-api', oldValues: existing as Record<string, unknown> });
  }
}

export const collegesService = new CollegesService();
