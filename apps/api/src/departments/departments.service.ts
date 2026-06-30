import { prisma } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { buildPagination, buildPaginatedResponse } from '../shared/pagination';
import { recordAudit } from '../shared/audit';

export const createDepartmentSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2),
  code: z.string().min(2).max(20).toUpperCase(),
  collegeId: z.string().uuid(),
  headId: z.string().uuid().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();
export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;

const DEPT_SELECT = {
  id: true,
  name: true,
  nameAr: true,
  code: true,
  isActive: true,
  createdAt: true,
  college: { select: { id: true, name: true, nameAr: true, code: true } },
  head: { select: { id: true, name: true, email: true } },
  _count: { select: { programs: true } },
};

export class DepartmentsService {
  async findAll(page: number, limit: number, collegeId?: string) {
    const { skip, take } = buildPagination(page, limit);
    const where = collegeId ? { collegeId } : {};
    const [data, total] = await Promise.all([
      prisma.department.findMany({ skip, take, where, select: DEPT_SELECT, orderBy: { code: 'asc' } }),
      prisma.department.count({ where }),
    ]);
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      select: {
        ...DEPT_SELECT,
        programs: {
          select: { id: true, name: true, nameAr: true, code: true, level: true, accreditationStatus: true },
          orderBy: { code: 'asc' },
        },
      },
    });
    if (!dept) throw AppError.notFound('القسم');
    return dept;
  }

  async create(dto: CreateDepartmentDto, actorId: string) {
    const exists = await prisma.department.findUnique({ where: { code: dto.code } });
    if (exists) throw AppError.conflict(`الكود ${dto.code} مستخدم مسبقاً`);
    const college = await prisma.college.findUnique({ where: { id: dto.collegeId } });
    if (!college) throw AppError.notFound('الكلية');
    const dept = await prisma.department.create({ data: dto, select: DEPT_SELECT });
    await recordAudit({ userId: actorId, action: 'CREATE', targetTable: 'departments', targetId: dept.id, targetComponent: 'departments-api', newValues: dto });
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, actorId: string) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('القسم');
    if (dto.code && dto.code !== existing.code) {
      const codeExists = await prisma.department.findUnique({ where: { code: dto.code } });
      if (codeExists) throw AppError.conflict(`الكود ${dto.code} مستخدم مسبقاً`);
    }
    const updated = await prisma.department.update({ where: { id }, data: dto, select: DEPT_SELECT });
    await recordAudit({ userId: actorId, action: 'UPDATE', targetTable: 'departments', targetId: id, targetComponent: 'departments-api', oldValues: existing as Record<string, unknown>, newValues: dto });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await prisma.department.findUnique({ where: { id }, include: { _count: { select: { programs: true } } } });
    if (!existing) throw AppError.notFound('القسم');
    if (existing._count.programs > 0) throw new AppError('لا يمكن حذف قسم يحتوي على برامج', 409);
    await prisma.department.delete({ where: { id } });
    await recordAudit({ userId: actorId, action: 'DELETE', targetTable: 'departments', targetId: id, targetComponent: 'departments-api' });
  }
}

export const departmentsService = new DepartmentsService();
