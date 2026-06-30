import { buildHtmlShell, statusBadge, progressBar, domainLabel, type ReportMeta } from './base.template';

export interface CloReportData {
  meta: ReportMeta;
  course: { code: string; name: string; nameAr: string; creditHours: number };
  program: { code: string; name: string; nameAr: string };
  instructor?: string;
  semester: string;
  academicYear: string;
  cloAttainments: Array<{
    cloCode: string;
    description: string;
    descriptionAr: string;
    domain: string;
    directAttainment: number;
    indirectAttainment: number | null;
    overallAttainment: number;
    targetBenchmark: number;
    achievementThreshold: number;
    studentCount: number;
    studentsAchieving: number;
    status: string;
  }>;
  summary: {
    totalCLOs: number;
    metCLOs: number;
    needsImprovementCLOs: number;
    notMetCLOs: number;
    overallCourseAttainment: number;
    courseStatus: string;
  };
}

export function renderCloReport(data: CloReportData): string {
  const { course, program, instructor, summary, cloAttainments } = data;

  const infoGrid = `
  <div class="info-grid">
    <div class="info-item"><span class="info-label">رمز المقرر / Course Code</span><span class="info-value">${course.code}</span></div>
    <div class="info-item"><span class="info-label">اسم المقرر</span><span class="info-value">${course.nameAr}</span></div>
    <div class="info-item"><span class="info-label">Course Name</span><span class="info-value td-en">${course.name}</span></div>
    <div class="info-item"><span class="info-label">البرنامج</span><span class="info-value">${program.nameAr}</span></div>
    <div class="info-item"><span class="info-label">الساعات المعتمدة</span><span class="info-value">${course.creditHours} ساعات</span></div>
    <div class="info-item"><span class="info-label">عضو هيئة التدريس</span><span class="info-value">${instructor ?? 'غير محدد'}</span></div>
  </div>`;

  const cards = `
  <div class="cards">
    <div class="card card-blue"><div class="num">${summary.totalCLOs}</div><div class="lbl">إجمالي مخرجات التعلم</div></div>
    <div class="card card-green"><div class="num">${summary.metCLOs}</div><div class="lbl">محقق ✓</div></div>
    <div class="card card-yellow"><div class="num">${summary.needsImprovementCLOs}</div><div class="lbl">يحتاج تحسين</div></div>
    <div class="card card-red"><div class="num">${summary.notMetCLOs}</div><div class="lbl">غير محقق ✗</div></div>
  </div>
  <div style="text-align:center;margin-bottom:18px;padding:10px;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;">
    <span style="font-size:11pt;font-weight:700;color:#0369a1;">التحقيق الإجمالي للمقرر:
      <strong style="font-size:16pt;color:#1e40af;">${summary.overallCourseAttainment.toFixed(1)}%</strong>
    </span>&nbsp;&nbsp;
    ${statusBadge(summary.courseStatus)}
  </div>`;

  const tableRows = cloAttainments.map((c) => `
    <tr class="avoid-break">
      <td class="td-num">${c.cloCode}</td>
      <td class="td-ar">${c.descriptionAr}</td>
      <td>${domainLabel(c.domain)}</td>
      <td>${c.studentCount}</td>
      <td>${c.studentsAchieving} (${c.studentCount > 0 ? ((c.studentsAchieving / c.studentCount) * 100).toFixed(0) : 0}%)</td>
      <td>${progressBar(c.directAttainment, c.targetBenchmark)}</td>
      <td>${c.indirectAttainment !== null ? progressBar(c.indirectAttainment, c.targetBenchmark) : '<span style="color:#94a3b8">—</span>'}</td>
      <td>${progressBar(c.overallAttainment, c.targetBenchmark)}</td>
      <td style="color:#0369a1;font-weight:700;">${c.targetBenchmark}%</td>
      <td style="color:#7c3aed;font-weight:700;">${c.achievementThreshold}%</td>
      <td>${statusBadge(c.status)}</td>
    </tr>`).join('');

  const table = `
  <div style="overflow-x:auto;">
  <table>
    <thead>
      <tr>
        <th>الرمز</th>
        <th>وصف المخرج (عربي)</th>
        <th>المجال</th>
        <th>عدد الطلاب</th>
        <th>المحققون</th>
        <th>تحقيق مباشر</th>
        <th>تحقيق غير مباشر</th>
        <th>التحقيق الإجمالي</th>
        <th>الحد المستهدف</th>
        <th>الحد الأدنى</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  </div>`;

  // Notes on non-met CLOs
  const notMetList = cloAttainments.filter((c) => c.status === 'NOT_MET');
  const notMetSection = notMetList.length > 0 ? `
  <h2 class="section-title">توصيات للمخرجات غير المحققة — Action Plan</h2>
  <table>
    <thead>
      <tr><th>المخرج</th><th>التحقيق الفعلي</th><th>الهدف</th><th>الفجوة</th><th>إجراءات مقترحة</th></tr>
    </thead>
    <tbody>
      ${notMetList.map((c) => `
      <tr>
        <td class="td-num">${c.cloCode}</td>
        <td style="color:#dc2626;font-weight:700;">${c.overallAttainment.toFixed(1)}%</td>
        <td>${c.targetBenchmark}%</td>
        <td style="color:#dc2626;">-${(c.targetBenchmark - c.overallAttainment).toFixed(1)}%</td>
        <td class="td-ar" style="text-align:right;">مراجعة أسلوب التدريس، تعزيز أنشطة التعلم النشط، إضافة تقييمات تكوينية</td>
      </tr>`).join('')}
    </tbody>
  </table>` : '';

  const body = `
  ${infoGrid}
  <h2 class="section-title">ملخص التحقيق — Attainment Summary</h2>
  ${cards}
  <h2 class="section-title">تفاصيل تحقيق مخرجات التعلم — CLO Attainment Details</h2>
  ${table}
  ${notMetSection}
  <div style="margin-top:20px;padding:10px;background:#fefce8;border:1px solid #fef08a;border-radius:6px;font-size:8pt;color:#713f12;">
    <strong>ملاحظة:</strong> التحقيق الإجمالي = التحقيق المباشر (80%) + التحقيق غير المباشر (20%) |
    الحد المستهدف: نسبة الطلاب المتوقع تحقيقهم للمخرج | الحد الأدنى: النسبة الدنيا لاعتبار الطالب محققاً
  </div>`;

  return buildHtmlShell(data.meta, body);
}
