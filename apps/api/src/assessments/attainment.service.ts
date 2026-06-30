import { prisma } from '@accred-iq/database';
import { z } from 'zod';
import { AppError } from '../shared/app-error';
import { classifyStatus } from './attainment.engine';

export const attainmentQuerySchema = z.object({
  semester: z.string().min(1),
  academicYear: z.string().min(4),
});

export type AttainmentQuery = z.infer<typeof attainmentQuerySchema>;

export class AttainmentService {
  async getCourseReport(courseId: string, semester: string, academicYear: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true, code: true, name: true, nameAr: true, creditHours: true,
        program: { select: { name: true, nameAr: true, code: true } },
        instructor: { select: { name: true } },
      },
    });
    if (!course) throw AppError.notFound('المقرر');

    const results = await prisma.cloAttainmentResult.findMany({
      where: { courseId, semester, academicYear },
      select: {
        overallAttainment: true, directAttainment: true, indirectAttainment: true,
        studentCount: true, studentsAchieving: true,
        targetBenchmark: true, achievementThreshold: true, calculatedAt: true,
        clo: {
          select: {
            id: true, code: true, description: true, descriptionAr: true, domain: true,
            targetBenchmark: true, achievementThreshold: true,
          },
        },
      },
      orderBy: { clo: { order: 'asc' } },
    });

    const cloAttainments = results.map((r) => ({
      cloId: r.clo.id,
      cloCode: r.clo.code,
      description: r.clo.description,
      descriptionAr: r.clo.descriptionAr,
      domain: r.clo.domain,
      targetBenchmark: r.targetBenchmark,
      achievementThreshold: r.achievementThreshold,
      studentCount: r.studentCount,
      studentsAchieving: r.studentsAchieving,
      directAttainment: r.directAttainment,
      indirectAttainment: r.indirectAttainment,
      overallAttainment: r.overallAttainment,
      status: classifyStatus(r.overallAttainment, r.targetBenchmark),
      calculatedAt: r.calculatedAt,
    }));

    const metCount = cloAttainments.filter((c) => c.status === 'MET').length;
    const avgOverall =
      cloAttainments.length > 0
        ? cloAttainments.reduce((s, c) => s + c.overallAttainment, 0) / cloAttainments.length
        : 0;

    return {
      course,
      semester,
      academicYear,
      generatedAt: new Date().toISOString(),
      cloAttainments,
      summary: {
        totalCLOs: cloAttainments.length,
        metCLOs: metCount,
        needsImprovementCLOs: cloAttainments.filter((c) => c.status === 'NEEDS_IMPROVEMENT').length,
        notMetCLOs: cloAttainments.filter((c) => c.status === 'NOT_MET').length,
        overallCourseAttainment: +avgOverall.toFixed(2),
        courseStatus: classifyStatus(avgOverall, 70),
      },
    };
  }

  async getAllCoursesReport(programId: string, academicYear: string) {
    const program = await prisma.program.findUnique({ where: { id: programId }, select: { name: true, code: true } });
    if (!program) throw AppError.notFound('البرنامج');

    const results = await prisma.cloAttainmentResult.findMany({
      where: { course: { programId }, academicYear },
      select: {
        overallAttainment: true, targetBenchmark: true, semester: true,
        course: { select: { id: true, code: true, name: true } },
        clo: { select: { code: true, domain: true } },
      },
    });

    // تجميع النتائج حسب المقرر
    const byCourse = new Map<string, { course: { id: string; code: string; name: string }; attainments: number[]; targets: number[] }>();
    for (const r of results) {
      const key = r.course.id;
      const entry = byCourse.get(key) ?? { course: r.course, attainments: [], targets: [] };
      entry.attainments.push(r.overallAttainment);
      entry.targets.push(r.targetBenchmark);
      byCourse.set(key, entry);
    }

    const coursesSummary = Array.from(byCourse.values()).map(({ course, attainments, targets }) => {
      const avg = attainments.reduce((s, v) => s + v, 0) / attainments.length;
      const avgTarget = targets.reduce((s, v) => s + v, 0) / targets.length;
      return {
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        avgAttainment: +avg.toFixed(2),
        status: classifyStatus(avg, avgTarget),
        cloCount: attainments.length,
      };
    });

    return { program, academicYear, courses: coursesSummary };
  }
}

export const attainmentService = new AttainmentService();
