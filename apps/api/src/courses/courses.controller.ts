import type { Request, Response, NextFunction } from 'express';
import { coursesService, createCourseSchema, updateCourseSchema } from './courses.service';
import { paginationSchema } from '../shared/pagination';
import { z } from 'zod';

export class CoursesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = paginationSchema.parse(req.query);
      const { programId } = z.object({ programId: z.string().uuid().optional() }).parse(req.query);
      res.json({ success: true, ...(await coursesService.findAll(page, limit, programId)) });
    } catch (e) { next(e); }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await coursesService.findOne(req.params.id) });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createCourseSchema.parse(req.body);
      res.status(201).json({ success: true, data: await coursesService.create(dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateCourseSchema.parse(req.body);
      res.json({ success: true, data: await coursesService.update(req.params.id, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }
}

export const coursesController = new CoursesController();
