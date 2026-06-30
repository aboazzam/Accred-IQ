import { prisma } from '@accred-iq/database';

export const DIRECT_WEIGHT = 0.80;
export const INDIRECT_WEIGHT = 0.20;

// =========================================================
// حساب التحقيق لمخرج تعلم واحد (CLO)
// =========================================================
export async function computeCloAttainment(
  cloId: string,
  courseId: string,
  semester: string,
  academicYear: string
) {
  const clo = await prisma.courseLearningOutcome.findUnique({
    where: { id: cloId },
    select: { achievementThreshold: true, targetBenchmark: true },
  });
  if (!clo) return null;

  const { achievementThreshold, targetBenchmark } = clo;

  // ---- 1. التحقيق المباشر (Direct) ----
  const items = await prisma.assessmentItem.findMany({
    where: {
      cloId,
      assessment: { courseId, isActive: true },
    },
    select: { id: true, maxScore: true, grades: true },
  });

  // تجميع درجات كل طالب عبر جميع العناصر المرتبطة بهذا المخرج
  const studentScores = new Map<string, { earned: number; max: number }>();
  for (const item of items) {
    for (const grade of item.grades) {
      const entry = studentScores.get(grade.studentId) ?? { earned: 0, max: 0 };
      entry.earned += grade.score;
      entry.max += item.maxScore;
      studentScores.set(grade.studentId, entry);
    }
  }

  const studentCount = studentScores.size;
  let studentsAchieving = 0;
  for (const { earned, max } of studentScores.values()) {
    if (max > 0 && (earned / max) * 100 >= achievementThreshold) {
      studentsAchieving++;
    }
  }

  const directAttainment = studentCount > 0 ? (studentsAchieving / studentCount) * 100 : 0;

  // ---- 2. التحقيق غير المباشر (Indirect) ----
  const indirectItems = await prisma.indirectAssessmentItem.findMany({
    where: {
      cloId,
      survey: { courseId, semester, academicYear, isActive: true },
    },
    select: { averageScore: true, maxScore: true },
  });

  let indirectAttainment: number | null = null;
  if (indirectItems.length > 0) {
    const total = indirectItems.reduce(
      (sum, item) => sum + (item.averageScore / item.maxScore) * 100,
      0
    );
    indirectAttainment = total / indirectItems.length;
  }

  // ---- 3. التحقيق الإجمالي ----
  const overallAttainment =
    indirectAttainment !== null
      ? directAttainment * DIRECT_WEIGHT + indirectAttainment * INDIRECT_WEIGHT
      : directAttainment;

  return {
    directAttainment: +directAttainment.toFixed(2),
    indirectAttainment: indirectAttainment !== null ? +indirectAttainment.toFixed(2) : null,
    overallAttainment: +overallAttainment.toFixed(2),
    studentCount,
    studentsAchieving,
    achievementThreshold,
    targetBenchmark,
  };
}

// =========================================================
// حساب وتخزين نتائج جميع CLOs في مقرر دراسي
// يُستدعى تلقائياً بعد كل رفع للدرجات
// =========================================================
export async function recalculateCourseAttainment(
  courseId: string,
  semester: string,
  academicYear: string,
  calculatedById?: string
) {
  const clos = await prisma.courseLearningOutcome.findMany({
    where: { courseId, isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(
    clos.map((clo) => computeCloAttainment(clo.id, courseId, semester, academicYear))
  );

  const upsertOps = clos
    .map((clo, i) => ({ cloId: clo.id, result: results[i] }))
    .filter(({ result }) => result !== null && result.studentCount > 0)
    .map(({ cloId, result }) =>
      prisma.cloAttainmentResult.upsert({
        where: { cloId_semester_academicYear: { cloId, semester, academicYear } },
        update: {
          studentCount: result!.studentCount,
          studentsAchieving: result!.studentsAchieving,
          directAttainment: result!.directAttainment,
          indirectAttainment: result!.indirectAttainment,
          overallAttainment: result!.overallAttainment,
          achievementThreshold: result!.achievementThreshold,
          targetBenchmark: result!.targetBenchmark,
          calculatedAt: new Date(),
          calculatedById: calculatedById ?? null,
        },
        create: {
          cloId,
          courseId,
          semester,
          academicYear,
          studentCount: result!.studentCount,
          studentsAchieving: result!.studentsAchieving,
          directAttainment: result!.directAttainment,
          indirectAttainment: result!.indirectAttainment,
          overallAttainment: result!.overallAttainment,
          achievementThreshold: result!.achievementThreshold,
          targetBenchmark: result!.targetBenchmark,
          calculatedById: calculatedById ?? null,
        },
      })
    );

  await prisma.$transaction(upsertOps);
  return results.filter(Boolean).length;
}

// =========================================================
// تصنيف حالة المخرج بناءً على الحد المستهدف
// =========================================================
export function classifyStatus(overallAttainment: number, targetBenchmark: number) {
  if (overallAttainment >= targetBenchmark) return 'MET';
  if (overallAttainment >= targetBenchmark * 0.85) return 'NEEDS_IMPROVEMENT';
  return 'NOT_MET';
}
