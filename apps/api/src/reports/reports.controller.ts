import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generateCloReport, generatePloReport, generateCourseFile } from './reports.service';
import { recordAudit } from '../shared/audit';

const semesterYearSchema = z.object({
  semester: z.string().min(1),
  academicYear: z.string().min(4),
});

function sendPdf(res: Response, buffer: Buffer, filename: string) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}.pdf"`,
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store',
  });
  res.end(buffer);
}

export class ReportsController {
  async cloReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { semester, academicYear } = semesterYearSchema.parse(req.query);
      const buffer = await generateCloReport(req.params.courseId, semester, academicYear);
      await recordAudit({
        userId: req.user!.sub, action: 'EXPORT_PDF',
        targetTable: 'courses', targetId: req.params.courseId,
        targetComponent: 'reports-api',
        metadata: { reportType: 'CLO_ATTAINMENT', semester, academicYear },
      });
      sendPdf(res, buffer, `CLO_Report_${req.params.courseId}_${academicYear}`);
    } catch (e) { next(e); }
  }

  async ploReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { academicYear } = z.object({ academicYear: z.string().min(4) }).parse(req.query);
      const buffer = await generatePloReport(req.params.programId, academicYear);
      await recordAudit({
        userId: req.user!.sub, action: 'EXPORT_PDF',
        targetTable: 'programs', targetId: req.params.programId,
        targetComponent: 'reports-api',
        metadata: { reportType: 'PLO_ATTAINMENT', academicYear },
      });
      sendPdf(res, buffer, `PLO_Report_${req.params.programId}_${academicYear}`);
    } catch (e) { next(e); }
  }

  async courseFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { semester, academicYear } = semesterYearSchema.parse(req.query);
      const buffer = await generateCourseFile(req.params.courseId, semester, academicYear);
      await recordAudit({
        userId: req.user!.sub, action: 'EXPORT_PDF',
        targetTable: 'courses', targetId: req.params.courseId,
        targetComponent: 'reports-api',
        metadata: { reportType: 'COURSE_FILE', semester, academicYear },
      });
      sendPdf(res, buffer, `CourseFile_${req.params.courseId}_${academicYear}_${semester}`);
    } catch (e) { next(e); }
  }
}

export const reportsController = new ReportsController();
