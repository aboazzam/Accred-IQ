import type { Request, Response, NextFunction } from 'express';
import { departmentsService, createDepartmentSchema, updateDepartmentSchema } from './departments.service';
import { paginationSchema } from '../shared/pagination';
import { z } from 'zod';

export class DepartmentsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = paginationSchema.parse(req.query);
      const { collegeId } = z.object({ collegeId: z.string().uuid().optional() }).parse(req.query);
      res.json({ success: true, ...(await departmentsService.findAll(page, limit, collegeId)) });
    } catch (e) { next(e); }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await departmentsService.findOne(req.params.id) });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createDepartmentSchema.parse(req.body);
      res.status(201).json({ success: true, data: await departmentsService.create(dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateDepartmentSchema.parse(req.body);
      res.json({ success: true, data: await departmentsService.update(req.params.id, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await departmentsService.remove(req.params.id, req.user!.sub);
      res.json({ success: true, message: 'تم حذف القسم بنجاح' });
    } catch (e) { next(e); }
  }
}

export const departmentsController = new DepartmentsController();
