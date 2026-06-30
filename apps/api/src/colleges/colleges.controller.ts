import type { Request, Response, NextFunction } from 'express';
import { collegesService, createCollegeSchema, updateCollegeSchema } from './colleges.service';
import { paginationSchema } from '../shared/pagination';

export class CollegesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = paginationSchema.parse(req.query);
      res.json({ success: true, ...(await collegesService.findAll(page, limit)) });
    } catch (e) { next(e); }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await collegesService.findOne(req.params.id) });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createCollegeSchema.parse(req.body);
      const college = await collegesService.create(dto, req.user!.sub);
      res.status(201).json({ success: true, data: college });
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateCollegeSchema.parse(req.body);
      res.json({ success: true, data: await collegesService.update(req.params.id, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await collegesService.remove(req.params.id, req.user!.sub);
      res.json({ success: true, message: 'تم حذف الكلية بنجاح' });
    } catch (e) { next(e); }
  }
}

export const collegesController = new CollegesController();
