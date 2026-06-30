import type { Request, Response, NextFunction } from 'express';
import { programsService, createProgramSchema, updateProgramSchema } from './programs.service';
import { paginationSchema } from '../shared/pagination';
import { z } from 'zod';

export class ProgramsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = paginationSchema.parse(req.query);
      const { departmentId } = z.object({ departmentId: z.string().uuid().optional() }).parse(req.query);
      res.json({ success: true, ...(await programsService.findAll(page, limit, departmentId)) });
    } catch (e) { next(e); }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await programsService.findOne(req.params.id) });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createProgramSchema.parse(req.body);
      res.status(201).json({ success: true, data: await programsService.create(dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateProgramSchema.parse(req.body);
      res.json({ success: true, data: await programsService.update(req.params.id, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }
}

export const programsController = new ProgramsController();
