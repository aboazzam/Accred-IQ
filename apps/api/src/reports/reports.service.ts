import { prisma } from '@accred-iq/database';
import { AppError } from '../shared/app-error';
import { classifyStatus } from '../assessments/attainment.engine';
import { generatePdf } from './pdf.generator';
import { renderCloReport, type CloReportData } from './templates/clo-report.template';
import { renderPloReport, type PloReportData } from './templates/plo-report.template';
import { renderCourseFile, type CourseFileData, type GradeStats } from './templates/course-file.template';
import type { ReportMeta } from './templates/base.template';

// ── Environment defaults ──────────────────────────────────
const UNIV_AR = process.env.UNIVERSITY_NAME_AR ?? 'جامعة الاعتماد الأكاديمي';
const UNIV_EN = process.env.UNIVERSITY_NAME_EN ?? 'Academic Accreditation University';
const LOGO_URL = process.env.UNIVERSITY_LOGO_URL;

function fmtDate(): string {
  return new Date().toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory',
  });
}

// ── Grade statistics helper ───────────────────────────────
async function fetchGradeStats(assessmentId: string): Promise<GradeStats | undefined> {
  const items = await prisma.assessmentItem.findMany({
    where: { assessmentId },
    select: { maxScore: true, grades: { select: { studentId: true, score: true } } },
  });
  if (!items.length) return undefined;

  const studentTotals = new Map<string, { earned: number; max: number }>();
  for (const item of items) {
    for (const g of item.grades) {
      const e = studentTotals.get(g.studentId) ?? { earned: 0, max: 0 };
      e.earned += g.score; e.max += item.maxScore;
      studentTotals.set(g.studentId, e);
    }
  }
  if (!studentTotals.size) return undefined;

  const percentages = [...studentTotals.values()].map(({ earned, max }) =>
    max > 0 ? (earned / max) * 100 : 0
  );
  const dist = {
    A: percentages.filter((p) => p >= 90).length,
    B: percentages.filter((p) => p >= 80 && p < 90).length,
    C: percentages.filter((p) => p >= 70 && p < 80).length,
    D: percentages.filter((p) => p >= 60 && p < 70).length,
    F: percentages.filter((p) => p < 60).length,
  };
  return {
    min: +Math.min(...percentages).toFixed(1),
    max: +Math.max(...percentages).toFixed(1),
    avg: +(percentages.reduce((s, v) => s + v, 0) / percentages.length).toFixed(1),
    distribution: dist,
    count: percentages.length,
  };
}

// ══════════════════════════════════════════════════════════
// 1. CLO Attainment Report PDF
// ══════════════════════════════════════════════════════════
export async function generateCloReport(courseId: string, semester: string, academicYear: string): Promise<Buffer> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      code: true, name: true, nameAr: true, creditHours: true,
      semester: true, academicYear: true,
      instructor: { select: { name: true } },
      program: {
        select: {
          code: true, name: true, nameAr: true,
          department: {
            select: { nameAr: true, name: true, college: { select: { nameAr: true, name: true } } },
          },
        },
      },
    },
  });
  if (!course) throw AppError.notFound('المقرر');

  const results = await prisma.cloAttainmentResult.findMany({
    where: { courseId, semester, academicYear },
    select: {
      directAttainment: true, indirectAttainment: true, overallAttainment: true,
      targetBenchmark: true, achievementThreshold: true,
      studentCount: true, studentsAchieving: true,
      clo: { select: { code: true, description: true, descriptionAr: true, domain: true } },
    },
    orderBy: { clo: { order: 'asc' } },
  });

  const cloAttainments = results.map((r) => ({
    cloCode: r.clo.code,
    description: r.clo.description,
    descriptionAr: r.clo.descriptionAr,
    domain: r.clo.domain,
    directAttainment: r.directAttainment,
    indirectAttainment: r.indirectAttainment,
    overallAttainment: r.overallAttainment,
    targetBenchmark: r.targetBenchmark,
    achievementThreshold: r.achievementThreshold,
    studentCount: r.studentCount,
    studentsAchieving: r.studentsAchieving,
    status: classifyStatus(r.overallAttainment, r.targetBenchmark),
  }));

  const overall = cloAttainments.length
    ? cloAttainments.reduce((s, c) => s + c.overallAttainment, 0) / cloAttainments.length : 0;

  const meta: ReportMeta = {
    universityNameAr: UNIV_AR, universityNameEn: UNIV_EN,
    collegeNameAr: course.program.department.college.nameAr,
    collegeNameEn: course.program.department.college.name,
    departmentNameAr: course.program.department.nameAr,
    logoUrl: LOGO_URL,
    reportTitleAr: `تقرير تحقيق مخرجات تعلم المقرر — ${course.nameAr}`,
    reportTitleEn: `CLO Attainment Report — ${course.name}`,
    generatedAt: fmtDate(), academicYear, semester,
  };

  const reportData: CloReportData = {
    meta, semester, academicYear,
    course: { code: course.code, name: course.name, nameAr: course.nameAr, creditHours: course.creditHours },
    program: { code: course.program.code, name: course.program.name, nameAr: course.program.nameAr },
    instructor: course.instructor?.name,
    cloAttainments,
    summary: {
      totalCLOs: cloAttainments.length,
      metCLOs: cloAttainments.filter((c) => c.status === 'MET').length,
      needsImprovementCLOs: cloAttainments.filter((c) => c.status === 'NEEDS_IMPROVEMENT').length,
      notMetCLOs: cloAttainments.filter((c) => c.status === 'NOT_MET').length,
      overallCourseAttainment: +overall.toFixed(2),
      courseStatus: classifyStatus(overall, 70),
    },
  };

  return generatePdf(renderCloReport(reportData));
}

// ══════════════════════════════════════════════════════════
// 2. PLO Attainment Report PDF
// ══════════════════════════════════════════════════════════
export async function generatePloReport(programId: string, academicYear: string): Promise<Buffer> {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: {
      code: true, name: true, nameAr: true, level: true,
      accreditationBody: true, accreditationStatus: true,
      department: { select: { nameAr: true, name: true, college: { select: { nameAr: true, name: true } } } },
      plos: {
        where: { isActive: true },
        select: {
          id: true, code: true, description: true, descriptionAr: true, domain: true,
          targetLevel: { select: { nameAr: true } },
          mappings: {
            where: { alignmentWeight: { gt: 0 } },
            select: {
              alignmentLevel: true, alignmentWeight: true,
              clo: {
                select: {
                  id: true, code: true,
                  course: { select: { code: true } },
                  attainmentResults: {
                    where: { academicYear },
                    select: { overallAttainment: true, targetBenchmark: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!program) throw AppError.notFound('البرنامج');

  const ploAttainments: PloReportData['ploAttainments'] = program.plos.map((plo) => {
    const validMappings = plo.mappings.filter((m) => m.clo.attainmentResults.length > 0);
    let attainment: number | null = null;
    if (validMappings.length > 0) {
      const totalW = validMappings.reduce((s, m) => s + m.alignmentWeight, 0);
      const wSum = validMappings.reduce(
        (s, m) => s + (m.clo.attainmentResults[0]?.overallAttainment ?? 0) * m.alignmentWeight, 0
      );
      attainment = totalW > 0 ? +(wSum / totalW).toFixed(2) : null;
    }

    const target = 70;
    return {
      ploId: plo.id, ploCode: plo.code,
      description: plo.description, descriptionAr: plo.descriptionAr, domain: plo.domain,
      attainment, targetBenchmark: target,
      status: attainment !== null ? classifyStatus(attainment, target) : 'NEEDS_IMPROVEMENT',
      contributingCLOs: validMappings.map((m) => ({
        cloCode: m.clo.code,
        courseCode: m.clo.course.code,
        alignmentLevel: m.alignmentLevel,
        cloAttainment: m.clo.attainmentResults[0]?.overallAttainment ?? 0,
      })),
    };
  });

  const withData = ploAttainments.filter((p) => p.attainment !== null);
  const overall = withData.length
    ? withData.reduce((s, p) => s + (p.attainment ?? 0), 0) / withData.length : 0;

  const meta: ReportMeta = {
    universityNameAr: UNIV_AR, universityNameEn: UNIV_EN,
    collegeNameAr: program.department.college.nameAr,
    collegeNameEn: program.department.college.name,
    departmentNameAr: program.department.nameAr,
    logoUrl: LOGO_URL,
    reportTitleAr: `تقرير تحقيق مخرجات تعلم البرنامج — ${program.nameAr}`,
    reportTitleEn: `PLO Attainment Report — ${program.name}`,
    generatedAt: fmtDate(), academicYear,
  };

  const reportData: PloReportData = {
    meta, academicYear,
    program: {
      code: program.code, name: program.name, nameAr: program.nameAr,
      level: program.level,
      accreditationBody: program.accreditationBody ?? undefined,
      accreditationStatus: program.accreditationStatus,
    },
    ploAttainments,
    summary: {
      totalPLOs: ploAttainments.length,
      withDataPLOs: withData.length,
      metPLOs: ploAttainments.filter((p) => p.status === 'MET').length,
      notMetPLOs: ploAttainments.filter((p) => p.status === 'NOT_MET').length,
      overallProgramAttainment: +overall.toFixed(2),
    },
  };

  return generatePdf(renderPloReport(reportData));
}

// ══════════════════════════════════════════════════════════
// 3. Course File Bundle PDF (ملف المقرر الكامل)
// ══════════════════════════════════════════════════════════
export async function generateCourseFile(courseId: string, semester: string, academicYear: string): Promise<Buffer> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      code: true, name: true, nameAr: true, creditHours: true,
      semester: true, academicYear: true,
      instructor: { select: { name: true } },
      program: {
        select: {
          code: true, name: true, nameAr: true, level: true,
          department: { select: { nameAr: true, name: true, college: { select: { nameAr: true, name: true } } } },
        },
      },
      clos: {
        where: { isActive: true },
        select: {
          code: true, description: true, descriptionAr: true, domain: true,
          targetLevel: { select: { nameAr: true } },
        },
        orderBy: { order: 'asc' },
      },
      assessments: {
        where: { isActive: true },
        select: {
          id: true, type: true, name: true, nameAr: true, weight: true, maxScore: true,
          items: {
            select: { label: true, maxScore: true, clo: { select: { code: true } } },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { conductedAt: 'asc' },
      },
      artifacts: {
        select: {
          category: true, title: true, fileUrl: true,
          assessment: { select: { nameAr: true } },
        },
        orderBy: { category: 'asc' },
      },
      indirectAssessments: {
        where: { semester, academicYear, isActive: true },
        select: {
          title: true, type: true, responseCount: true,
          items: {
            select: { question: true, averageScore: true, maxScore: true, clo: { select: { code: true } } },
          },
        },
      },
      attainmentResults: {
        where: { semester, academicYear },
        select: {
          directAttainment: true, indirectAttainment: true, overallAttainment: true,
          targetBenchmark: true, achievementThreshold: true,
          studentCount: true, studentsAchieving: true,
          clo: { select: { code: true, descriptionAr: true, domain: true } },
        },
        orderBy: { clo: { order: 'asc' } },
      },
    },
  });
  if (!course) throw AppError.notFound('المقرر');

  // Fetch grade stats for each assessment
  const assessmentMethods: CourseFileData['assessmentMethods'] = await Promise.all(
    course.assessments.map(async (m) => ({
      type: m.type, name: m.name, nameAr: m.nameAr, weight: m.weight, maxScore: m.maxScore,
      items: m.items.map((i) => ({ label: i.label, maxScore: i.maxScore, cloCode: i.clo.code })),
      gradeStats: await fetchGradeStats(m.id),
    }))
  );

  const cloAttainments = course.attainmentResults.map((r) => ({
    cloCode: r.clo.code, descriptionAr: r.clo.descriptionAr, domain: r.clo.domain,
    directAttainment: r.directAttainment, indirectAttainment: r.indirectAttainment,
    overallAttainment: r.overallAttainment, targetBenchmark: r.targetBenchmark,
    studentCount: r.studentCount, studentsAchieving: r.studentsAchieving,
    status: classifyStatus(r.overallAttainment, r.targetBenchmark),
  }));

  const overall = cloAttainments.length
    ? cloAttainments.reduce((s, c) => s + c.overallAttainment, 0) / cloAttainments.length : 0;

  const meta: ReportMeta = {
    universityNameAr: UNIV_AR, universityNameEn: UNIV_EN,
    collegeNameAr: course.program.department.college.nameAr,
    collegeNameEn: course.program.department.college.name,
    departmentNameAr: course.program.department.nameAr,
    logoUrl: LOGO_URL,
    reportTitleAr: `ملف المقرر الأكاديمي — ${course.nameAr}`,
    reportTitleEn: `Official Course File (NCAAA) — ${course.name}`,
    generatedAt: fmtDate(), academicYear, semester,
  };

  const fileData: CourseFileData = {
    meta,
    course: { code: course.code, name: course.name, nameAr: course.nameAr, creditHours: course.creditHours, semester, academicYear },
    program: { code: course.program.code, name: course.program.name, nameAr: course.program.nameAr, level: course.program.level },
    instructor: course.instructor?.name,
    clos: course.clos.map((c) => ({
      code: c.code, description: c.description, descriptionAr: c.descriptionAr,
      domain: c.domain, targetLevelNameAr: c.targetLevel?.nameAr,
    })),
    assessmentMethods,
    cloAttainments,
    artifacts: course.artifacts.map((a) => ({
      category: a.category, title: a.title, fileUrl: a.fileUrl,
      assessmentName: a.assessment?.nameAr,
    })),
    indirectSurveys: course.indirectAssessments.map((s) => ({
      title: s.title, type: s.type, responseCount: s.responseCount,
      items: s.items.map((i) => ({
        question: i.question, cloCode: i.clo?.code, averageScore: i.averageScore, maxScore: i.maxScore,
      })),
    })),
    summary: {
      totalCLOs: cloAttainments.length,
      metCLOs: cloAttainments.filter((c) => c.status === 'MET').length,
      needsImprovementCLOs: cloAttainments.filter((c) => c.status === 'NEEDS_IMPROVEMENT').length,
      notMetCLOs: cloAttainments.filter((c) => c.status === 'NOT_MET').length,
      overallCourseAttainment: +overall.toFixed(2),
      courseStatus: classifyStatus(overall, 70),
    },
  };

  return generatePdf(renderCourseFile(fileData));
}
