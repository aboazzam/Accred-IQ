import type { Request, Response, NextFunction } from 'express';
import { assessmentsService, createMethodSchema, createItemSchema, bulkGradesSchema } from './assessments.service';

export class AssessmentsController {
  async listMethods(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await assessmentsService.listMethods(req.params.courseId) });
    } catch (e) { next(e); }
  }

  async getMethod(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await assessmentsService.getMethod(req.params.id) });
    } catch (e) { next(e); }
  }

  async createMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createMethodSchema.parse(req.body);
      res.status(201).json({ success: true, data: await assessmentsService.createMethod(dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createItemSchema.parse(req.body);
      res.status(201).json({ success: true, data: await assessmentsService.addItem(req.params.assessmentId, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async uploadGrades(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = bulkGradesSchema.parse(req.body);
      const result = await assessmentsService.uploadGrades(req.params.assessmentId, dto, req.user!.sub);
      res.json({ success: true, data: result, message: `تم رفع ${result.studentsProcessed} طالب وتحديث ${result.cloAttainmentsRecalculated} مخرج تعلم` });
    } catch (e) { next(e); }
  }
}

export const assessmentsController = new AssessmentsController();
