import type { Request, Response, NextFunction } from 'express';
import { indirectService, createSurveySchema } from './indirect.service';
import { attainmentQuerySchema } from '../assessments/attainment.service';

export class IndirectController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await indirectService.listSurveys(req.params.courseId) });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createSurveySchema.parse(req.body);
      res.status(201).json({ success: true, data: await indirectService.createSurvey(dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async comparison(req: Request, res: Response, next: NextFunction) {
    try {
      const { semester, academicYear } = attainmentQuerySchema.parse(req.query);
      res.json({ success: true, data: await indirectService.getIndirectVsDirectSummary(req.params.courseId, semester, academicYear) });
    } catch (e) { next(e); }
  }
}

export const indirectController = new IndirectController();
