import { buildHtmlShell, statusBadge, progressBar, domainLabel, type ReportMeta } from './base.template';

export interface PloReportData {
  meta: ReportMeta;
  program: {
    code: string; name: string; nameAr: string;
    level: string; accreditationBody?: string; accreditationStatus: string;
  };
  academicYear: string;
  ploAttainments: Array<{
    ploId: string;
    ploCode: string;
    description: string;
    descriptionAr: string;
    domain: string;
    attainment: number | null;
    targetBenchmark: number;
    status: string;
    contributingCLOs: Array<{
      cloCode: string;
      courseCode: string;
      alignmentLevel: string;
      cloAttainment: number;
    }>;
  }>;
  summary: {
    totalPLOs: number;
    withDataPLOs: number;
    metPLOs: number;
    notMetPLOs: number;
    overallProgramAttainment: number;
  };
}

const LEVEL_MAP: Record<string, string> = {
  BACHELOR: 'بكالوريوس', MASTER: 'ماجستير',
  DOCTORATE: 'دكتوراه', DIPLOMA: 'دبلوم',
};

const ALIGN_MAP: Record<string, string> = {
  DIRECT: 'مباشر (3)', PARTIAL: 'جزئي (2)',
  INDIRECT: 'غير مباشر (1)', NONE: 'لا يوجد (0)',
};

export function renderPloReport(data: PloReportData): string {
  const { program, summary, ploAttainments } = data;

  const infoGrid = `
  <div class="info-grid">
    <div class="info-item"><span class="info-label">رمز البرنامج</span><span class="info-value">${program.code}</span></div>
    <div class="info-item"><span class="info-label">اسم البرنامج</span><span class="info-value">${program.nameAr}</span></div>
    <div class="info-item"><span class="info-label">مستوى البرنامج</span><span class="info-value">${LEVEL_MAP[program.level] ?? program.level}</span></div>
    <div class="info-item"><span class="info-label">جهة الاعتماد</span><span class="info-value">${program.accreditationBody ?? 'غير محدد'}</span></div>
    <div class="info-item"><span class="info-label">حالة الاعتماد</span><span class="info-value">${program.accreditationStatus}</span></div>
    <div class="info-item"><span class="info-label">العام الدراسي</span><span class="info-value">${data.academicYear}</span></div>
  </div>`;

  const cards = `
  <div class="cards">
    <div class="card card-blue"><div class="num">${summary.totalPLOs}</div><div class="lbl">إجمالي المخرجات</div></div>
    <div class="card card-green"><div class="num">${summary.metPLOs}</div><div class="lbl">محقق ✓</div></div>
    <div class="card card-red"><div class="num">${summary.notMetPLOs}</div><div class="lbl">غير محقق ✗</div></div>
    <div class="card ${summary.overallProgramAttainment >= 70 ? 'card-green' : 'card-yellow'}">
      <div class="num">${summary.overallProgramAttainment.toFixed(1)}%</div>
      <div class="lbl">تحقيق البرنامج الإجمالي</div>
    </div>
  </div>`;

  const mainTableRows = ploAttainments.map((p) => `
    <tr class="avoid-break">
      <td class="td-num">${p.ploCode}</td>
      <td class="td-ar">${p.descriptionAr}</td>
      <td class="td-en">${p.description}</td>
      <td>${domainLabel(p.domain)}</td>
      <td>${p.attainment !== null ? progressBar(p.attainment, p.targetBenchmark) : '<span style="color:#94a3b8;font-size:8pt;">لا توجد بيانات</span>'}</td>
      <td style="color:#0369a1;font-weight:700;">${p.targetBenchmark}%</td>
      <td>${p.attainment !== null ? statusBadge(p.status) : '<span class="badge needs">بدون بيانات</span>'}</td>
    </tr>`).join('');

  const mainTable = `
  <table>
    <thead>
      <tr>
        <th>الرمز</th>
        <th>الوصف (عربي)</th>
        <th style="direction:ltr;">Description (EN)</th>
        <th>المجال</th>
        <th>نسبة التحقيق</th>
        <th>المستهدف</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>${mainTableRows}</tbody>
  </table>`;

  // Contribution details per PLO
  const detailSections = ploAttainments
    .filter((p) => p.contributingCLOs.length > 0)
    .map((p) => `
    <div class="avoid-break" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <strong style="color:#1e40af;">${p.ploCode}</strong>
        <span style="font-size:9pt;">${p.descriptionAr}</span>
        ${p.attainment !== null ? statusBadge(p.status) : ''}
      </div>
      <table>
        <thead>
          <tr style="background:#374151;">
            <th>رمز المقرر</th><th>رمز CLO</th><th>مستوى الارتباط</th><th>تحقيق CLO</th>
          </tr>
        </thead>
        <tbody>
          ${p.contributingCLOs.map((c) => `
          <tr>
            <td class="td-num">${c.courseCode}</td>
            <td class="td-num">${c.cloCode}</td>
            <td>${ALIGN_MAP[c.alignmentLevel] ?? c.alignmentLevel}</td>
            <td>${progressBar(c.cloAttainment, p.targetBenchmark)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  const body = `
  ${infoGrid}
  <h2 class="section-title">ملخص تحقيق مخرجات البرنامج — PLO Attainment Summary</h2>
  ${cards}
  <h2 class="section-title">جدول مخرجات التعلم الإجمالي — PLO Attainment Table</h2>
  ${mainTable}
  <div class="page-break"></div>
  <h2 class="section-title">مساهمة مخرجات المقررات في تحقيق مخرجات البرنامج — CLO Contributions</h2>
  ${detailSections || '<p style="color:#94a3b8;text-align:center;">لا توجد بيانات مرتبطة بعد</p>'}
  <div style="margin-top:20px;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:8pt;color:#14532d;">
    <strong>منهجية الحساب:</strong>
    تحقيق PLO = المتوسط المرجح لتحقيق CLOs المرتبطة مضروبةً في وزن الارتباط (مباشر=3، جزئي=2، غير مباشر=1)
  </div>`;

  return buildHtmlShell(data.meta, body);
}
