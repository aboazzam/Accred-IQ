import { buildHtmlShell, statusBadge, progressBar, domainLabel, type ReportMeta } from './base.template';

export interface GradeStats {
  min: number; max: number; avg: number;
  distribution: { A: number; B: number; C: number; D: number; F: number };
  count: number;
}

export interface CourseFileData {
  meta: ReportMeta;
  course: { code: string; name: string; nameAr: string; creditHours: number; semester?: string; academicYear?: string };
  program: { code: string; name: string; nameAr: string; level: string };
  instructor?: string;
  clos: Array<{ code: string; description: string; descriptionAr: string; domain: string; targetLevelNameAr?: string }>;
  assessmentMethods: Array<{
    type: string; name: string; nameAr: string; weight: number; maxScore: number;
    items: Array<{ label: string; maxScore: number; cloCode: string }>;
    gradeStats?: GradeStats;
  }>;
  cloAttainments: Array<{
    cloCode: string; descriptionAr: string; domain: string;
    directAttainment: number; indirectAttainment: number | null;
    overallAttainment: number; targetBenchmark: number;
    studentCount: number; studentsAchieving: number; status: string;
  }>;
  artifacts: Array<{ category: string; title: string; assessmentName?: string; fileUrl: string }>;
  indirectSurveys: Array<{
    title: string; type: string; responseCount: number;
    items: Array<{ question: string; cloCode?: string; averageScore: number; maxScore: number }>;
  }>;
  summary: {
    totalCLOs: number; metCLOs: number;
    needsImprovementCLOs: number; notMetCLOs: number;
    overallCourseAttainment: number; courseStatus: string;
  };
}

const TYPE_AR: Record<string, string> = {
  MIDTERM: 'اختبار منتصف الفصل', FINAL: 'الاختبار النهائي',
  QUIZ: 'اختبار قصير', ASSIGNMENT: 'واجب', PROJECT: 'مشروع',
  PRESENTATION: 'عرض تقديمي', LAB: 'تقرير مخبري',
};
const CAT_AR: Record<string, string> = {
  HIGHEST: 'درجة عليا', AVERAGE: 'درجة متوسطة', LOWEST: 'درجة دنيا',
  RUBRIC: 'مصفوفة التقييم', SOLUTION: 'نموذج الإجابة',
};
const SURVEY_AR: Record<string, string> = {
  STUDENT_SURVEY: 'استبانة الطلاب', ALUMNI_SURVEY: 'استبانة الخريجين',
  EMPLOYER_SURVEY: 'استبانة أصحاب العمل', EXIT_SURVEY: 'استبانة الخروج',
};

function distBar(val: number, total: number): string {
  if (total === 0) return '—';
  const pct = (val / total) * 100;
  return `${val} <span style="color:#64748b;font-size:7pt;">(${pct.toFixed(0)}%)</span>`;
}

export function renderCourseFile(data: CourseFileData): string {
  const { course, program, instructor, clos, assessmentMethods, cloAttainments, artifacts, indirectSurveys, summary } = data;

  // ── COVER PAGE ──
  const cover = `
  <div class="cover">
    <div class="cover-seal">
      ${data.meta.logoUrl ? `<img src="${data.meta.logoUrl}" alt="logo">` : 'شعار<br>الجامعة'}
    </div>
    <div>
      <h1 style="font-size:20pt;color:#1e3a8a;font-weight:900;">${data.meta.universityNameAr}</h1>
      <p style="font-size:11pt;color:#3b82f6;direction:ltr;">${data.meta.universityNameEn}</p>
    </div>
    <div style="background:#1e40af;color:#fff;padding:14px 40px;border-radius:10px;text-align:center;">
      <div style="font-size:16pt;font-weight:900;">ملف المقرر الأكاديمي</div>
      <div style="font-size:11pt;opacity:0.85;direction:ltr;">Official Academic Course File — NCAAA</div>
    </div>
    <table style="width:60%;margin:0 auto;font-size:10pt;border:none;">
      <tr><td style="border:none;font-weight:700;padding:6px 10px;">رمز المقرر</td><td style="border:none;padding:6px 10px;">${course.code}</td></tr>
      <tr><td style="border:none;font-weight:700;padding:6px 10px;">اسم المقرر</td><td style="border:none;padding:6px 10px;">${course.nameAr}</td></tr>
      <tr><td style="border:none;font-weight:700;padding:6px 10px;">البرنامج</td><td style="border:none;padding:6px 10px;">${program.nameAr}</td></tr>
      <tr><td style="border:none;font-weight:700;padding:6px 10px;">عضو هيئة التدريس</td><td style="border:none;padding:6px 10px;">${instructor ?? 'غير محدد'}</td></tr>
      <tr><td style="border:none;font-weight:700;padding:6px 10px;">الفصل الدراسي</td><td style="border:none;padding:6px 10px;">${course.semester ?? '—'} ${course.academicYear ?? ''}</td></tr>
    </table>
    <div style="font-size:8pt;color:#94a3b8;margin-top:20px;">
      صدر بتاريخ: ${data.meta.generatedAt} | نظام Accred-IQ
    </div>
  </div>
  <div class="page-break"></div>`;

  // ── SECTION 1: Course Description ──
  const sec1 = `
  <h2 class="section-title">القسم الأول: توصيف المقرر — Course Description</h2>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">رمز المقرر</span><span class="info-value">${course.code}</span></div>
    <div class="info-item"><span class="info-label">اسم المقرر (عربي)</span><span class="info-value">${course.nameAr}</span></div>
    <div class="info-item"><span class="info-label">Course Name (English)</span><span class="info-value">${course.name}</span></div>
    <div class="info-item"><span class="info-label">الساعات المعتمدة</span><span class="info-value">${course.creditHours}</span></div>
    <div class="info-item"><span class="info-label">البرنامج الأكاديمي</span><span class="info-value">${program.nameAr} (${program.code})</span></div>
    <div class="info-item"><span class="info-label">عضو هيئة التدريس</span><span class="info-value">${instructor ?? '—'}</span></div>
  </div>`;

  // ── SECTION 2: CLOs ──
  const closTable = `
  <h2 class="section-title">القسم الثاني: مخرجات تعلم المقرر — Course Learning Outcomes (CLOs)</h2>
  <table>
    <thead><tr><th>#</th><th>الرمز</th><th>وصف المخرج</th><th>المجال</th><th>مستوى الجدارة المستهدف</th></tr></thead>
    <tbody>
      ${clos.map((c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="td-num">${c.code}</td>
        <td class="td-ar">${c.descriptionAr}</td>
        <td>${domainLabel(c.domain)}</td>
        <td>${c.targetLevelNameAr ?? '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;

  // ── SECTION 3: Assessment Plan ──
  const assessPlan = `
  <h2 class="section-title">القسم الثالث: خطة التقييم — Assessment Plan</h2>
  <table>
    <thead><tr><th>أداة التقييم</th><th>النوع</th><th>الوزن</th><th>الدرجة الكلية</th><th>المخرجات المقيَّمة</th></tr></thead>
    <tbody>
      ${assessmentMethods.map((m) => {
        const closCovered = [...new Set(m.items.map((i) => i.cloCode))].join('، ');
        return `
        <tr>
          <td class="td-ar">${m.nameAr}</td>
          <td>${TYPE_AR[m.type] ?? m.type}</td>
          <td class="td-num">${m.weight}%</td>
          <td class="td-num">${m.maxScore}</td>
          <td>${closCovered || '—'}</td>
        </tr>`;
      }).join('')}
      <tr style="background:#dbeafe;font-weight:700;">
        <td colspan="2" style="text-align:right;">الإجمالي</td>
        <td class="td-num">${assessmentMethods.reduce((s, m) => s + m.weight, 0)}%</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>`;

  // ── SECTION 4: Grade Statistics ──
  const gradeStats = assessmentMethods.filter((m) => m.gradeStats).map((m) => {
    const s = m.gradeStats!;
    return `
    <div class="avoid-break" style="margin-bottom:14px;">
      <h3 style="font-size:10pt;color:#374151;margin-bottom:6px;">${m.nameAr} — إحصائيات الدرجات</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;">
        <div style="text-align:center;padding:8px;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd;">
          <div style="font-size:14pt;font-weight:900;color:#0369a1;">${s.avg.toFixed(1)}%</div>
          <div style="font-size:8pt;color:#64748b;">المتوسط</div>
        </div>
        <div style="text-align:center;padding:8px;background:#f0fdf4;border-radius:6px;border:1px solid #bbf7d0;">
          <div style="font-size:14pt;font-weight:900;color:#15803d;">${s.max.toFixed(1)}%</div>
          <div style="font-size:8pt;color:#64748b;">الأعلى</div>
        </div>
        <div style="text-align:center;padding:8px;background:#fff1f2;border-radius:6px;border:1px solid #fecdd3;">
          <div style="font-size:14pt;font-weight:900;color:#991b1b;">${s.min.toFixed(1)}%</div>
          <div style="font-size:8pt;color:#64748b;">الأدنى</div>
        </div>
      </div>
      <table>
        <thead><tr><th>ممتاز (A) ≥90%</th><th>جيد جداً (B) 80-89%</th><th>جيد (C) 70-79%</th><th>مقبول (D) 60-69%</th><th>راسب (F) &lt;60%</th><th>إجمالي</th></tr></thead>
        <tbody>
          <tr>
            <td style="color:#15803d;font-weight:700;">${distBar(s.distribution.A, s.count)}</td>
            <td style="color:#1d4ed8;font-weight:700;">${distBar(s.distribution.B, s.count)}</td>
            <td style="color:#0369a1;font-weight:700;">${distBar(s.distribution.C, s.count)}</td>
            <td style="color:#854d0e;font-weight:700;">${distBar(s.distribution.D, s.count)}</td>
            <td style="color:#991b1b;font-weight:700;">${distBar(s.distribution.F, s.count)}</td>
            <td class="td-num">${s.count}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
  }).join('');

  // ── SECTION 5: CLO Attainment Matrix ──
  const attainMatrix = `
  <div class="page-break"></div>
  <h2 class="section-title">القسم الخامس: مصفوفة تحقيق مخرجات التعلم — CLO Attainment Matrix</h2>
  <div style="text-align:center;margin-bottom:12px;padding:8px;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd;">
    <strong>التحقيق الإجمالي للمقرر:</strong>
    <strong style="font-size:14pt;color:#1e40af;"> ${summary.overallCourseAttainment.toFixed(1)}%</strong>
    &nbsp; ${statusBadge(summary.courseStatus)}
  </div>
  <table>
    <thead>
      <tr>
        <th>CLO</th><th>الوصف</th><th>المجال</th>
        <th>مباشر (80%)</th><th>غير مباشر (20%)</th><th>الإجمالي</th>
        <th>المستهدف</th><th>المحققون</th><th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${cloAttainments.map((c) => `
      <tr class="avoid-break">
        <td class="td-num">${c.cloCode}</td>
        <td class="td-ar" style="font-size:8pt;">${c.descriptionAr}</td>
        <td>${domainLabel(c.domain)}</td>
        <td>${progressBar(c.directAttainment, c.targetBenchmark)}</td>
        <td>${c.indirectAttainment !== null ? progressBar(c.indirectAttainment, c.targetBenchmark) : '<span style="color:#94a3b8">—</span>'}</td>
        <td>${progressBar(c.overallAttainment, c.targetBenchmark)}</td>
        <td style="color:#0369a1;font-weight:700;">${c.targetBenchmark}%</td>
        <td>${c.studentsAchieving}/${c.studentCount}</td>
        <td>${statusBadge(c.status)}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;

  // ── SECTION 6: Evidence Files ──
  const evidenceSection = `
  <h2 class="section-title">القسم السادس: ملفات الأدلة الأكاديمية — Evidence Files</h2>
  ${artifacts.length > 0 ? `
  <table>
    <thead><tr><th>التصنيف</th><th>العنوان</th><th>أداة التقييم المرتبطة</th><th>رابط الملف</th></tr></thead>
    <tbody>
      ${artifacts.map((a) => `
      <tr>
        <td><span class="badge ${a.category === 'HIGHEST' ? 'met' : a.category === 'AVERAGE' ? 'needs' : a.category === 'LOWEST' ? 'not-met' : 'needs'}">${CAT_AR[a.category] ?? a.category}</span></td>
        <td class="td-ar">${a.title}</td>
        <td>${a.assessmentName ?? '—'}</td>
        <td style="direction:ltr;text-align:left;font-size:7pt;color:#3b82f6;word-break:break-all;">${a.fileUrl}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : '<p style="color:#94a3b8;padding:10px;">لم يتم رفع ملفات الأدلة بعد</p>'}`;

  // ── SECTION 7: Indirect Assessment ──
  const indirectSection = `
  <div class="page-break"></div>
  <h2 class="section-title">القسم السابع: نتائج التقييم غير المباشر — Indirect Assessment</h2>
  ${indirectSurveys.length > 0 ? indirectSurveys.map((s) => `
    <div class="avoid-break" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <strong>${s.title}</strong>
        <span style="font-size:8pt;color:#64748b;">${SURVEY_AR[s.type] ?? s.type}</span>
        <span style="font-size:8pt;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:10px;">عدد المستجيبين: ${s.responseCount}</span>
      </div>
      <table>
        <thead><tr><th>السؤال / العبارة</th><th>المخرج المرتبط</th><th>متوسط الدرجة</th><th>النسبة المئوية</th></tr></thead>
        <tbody>
          ${s.items.map((item) => {
            const pct = (item.averageScore / item.maxScore) * 100;
            return `
            <tr>
              <td class="td-ar">${item.question}</td>
              <td>${item.cloCode ?? '—'}</td>
              <td class="td-num">${item.averageScore.toFixed(2)} / ${item.maxScore}</td>
              <td>${progressBar(pct, 70)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`).join('') : '<p style="color:#94a3b8;padding:10px;">لا توجد استبانات مسجلة لهذا المقرر</p>'}`;

  const body = `
  ${cover}
  ${sec1}
  ${closTable}
  ${assessPlan}
  <h2 class="section-title">القسم الرابع: إحصائيات درجات الطلاب — Grade Statistics</h2>
  ${gradeStats || '<p style="color:#94a3b8;padding:10px;">لم يتم رفع الدرجات بعد</p>'}
  ${attainMatrix}
  ${evidenceSection}
  ${indirectSection}`;

  return buildHtmlShell(data.meta, body);
}
