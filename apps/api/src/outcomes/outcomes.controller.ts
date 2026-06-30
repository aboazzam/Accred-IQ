import type { Request, Response, NextFunction } from 'express';
import {
  plosService, cloService, mappingService,
  createPloSchema, updatePloSchema,
  createCloSchema, updateCloSchema,
  setMappingSchema,
} from './outcomes.service';

export class OutcomesController {
  // ---- PLOs ----
  async listPlos(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await plosService.findAll(req.params.programId) });
    } catch (e) { next(e); }
  }

  async createPlo(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createPloSchema.parse(req.body);
      res.status(201).json({ success: true, data: await plosService.create(req.params.programId, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async updatePlo(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updatePloSchema.parse(req.body);
      res.json({ success: true, data: await plosService.update(req.params.id, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async deletePlo(req: Request, res: Response, next: NextFunction) {
    try {
      await plosService.remove(req.params.id, req.user!.sub);
      res.json({ success: true, message: 'تم حذف مخرج التعلم بنجاح' });
    } catch (e) { next(e); }
  }

  // ---- CLOs ----
  async listClos(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await cloService.findAll(req.params.courseId) });
    } catch (e) { next(e); }
  }

  async createClo(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createCloSchema.parse(req.body);
      res.status(201).json({ success: true, data: await cloService.create(req.params.courseId, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async updateClo(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateCloSchema.parse(req.body);
      res.json({ success: true, data: await cloService.update(req.params.id, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async deleteClo(req: Request, res: Response, next: NextFunction) {
    try {
      await cloService.remove(req.params.id, req.user!.sub);
      res.json({ success: true, message: 'تم حذف مخرج التعلم بنجاح' });
    } catch (e) { next(e); }
  }

  // ---- Mapping Matrix ----
  async getMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await mappingService.getMatrix(req.params.programId) });
    } catch (e) { next(e); }
  }

  async setMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = setMappingSchema.parse(req.body);
      res.json({ success: true, data: await mappingService.setMapping(req.params.ploId, req.params.cloId, dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async removeMapping(req: Request, res: Response, next: NextFunction) {
    try {
      await mappingService.removeMapping(req.params.ploId, req.params.cloId, req.user!.sub);
      res.json({ success: true, message: 'تم إزالة الارتباط بنجاح' });
    } catch (e) { next(e); }
  }
}

export const outcomesController = new OutcomesController();
