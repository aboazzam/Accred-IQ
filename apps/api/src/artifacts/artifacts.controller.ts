import type { Request, Response, NextFunction } from 'express';
import { artifactsService, uploadArtifactSchema } from './artifacts.service';
import { ArtifactCategory } from '@accred-iq/database';
import { z } from 'zod';

export class ArtifactsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = z.object({
        category: z.nativeEnum(ArtifactCategory).optional(),
      }).parse(req.query);
      res.json({ success: true, data: await artifactsService.list(req.params.courseId, category) });
    } catch (e) { next(e); }
  }

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = uploadArtifactSchema.parse(req.body);
      res.status(201).json({ success: true, data: await artifactsService.upload(dto, req.user!.sub) });
    } catch (e) { next(e); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await artifactsService.remove(req.params.id, req.user!.sub);
      res.json({ success: true, message: 'تم حذف الملف بنجاح' });
    } catch (e) { next(e); }
  }

  async getCourseFileStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await artifactsService.getCourseFileStatus(req.params.courseId) });
    } catch (e) { next(e); }
  }
}

export const artifactsController = new ArtifactsController();
