export interface ReportMeta {
  universityNameAr: string;
  universityNameEn: string;
  collegeNameAr: string;
  collegeNameEn: string;
  departmentNameAr: string;
  logoUrl?: string;
  reportTitleAr: string;
  reportTitleEn: string;
  generatedAt: string;
  academicYear: string;
  semester?: string;
}

// ────────────────────────────────────────────────────────────
// Shared CSS — injected into every report template
// ────────────────────────────────────────────────────────────
export const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    text-align: right;
    color: #1e293b;
    font-size: 9.5pt;
    line-height: 1.65;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Header ── */
  .rpt-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0 12px;
    border-bottom: 3px solid #1e40af;
    margin-bottom: 18px;
  }
  .rpt-logo {
    width: 72px; height: 72px; flex-shrink: 0;
    border: 2px solid #1e40af; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 7pt; color: #1e40af; font-weight: 700; text-align: center;
    overflow: hidden;
  }
  .rpt-logo img { width: 100%; height: 100%; object-fit: cover; }
  .rpt-header-center { flex: 1; text-align: center; }
  .rpt-univ-ar  { font-size: 13pt; font-weight: 900; color: #1e3a8a; }
  .rpt-univ-en  { font-size: 9pt;  font-weight: 600; color: #3b82f6; direction: ltr; }
  .rpt-sys-badge {
    display: inline-block; margin-top: 4px;
    background: #1e40af; color: #fff;
    padding: 2px 14px; border-radius: 10px; font-size: 8pt;
  }
  .rpt-header-meta { text-align: left; direction: ltr; font-size: 8pt; color: #64748b; line-height: 1.8; }

  /* ── Report Title Block ── */
  .rpt-title-block {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #fff; text-align: center;
    padding: 12px 20px; border-radius: 8px; margin-bottom: 16px;
  }
  .rpt-title-ar { font-size: 14pt; font-weight: 900; }
  .rpt-title-en { font-size: 10pt; font-weight: 400; opacity: 0.9; direction: ltr; }

  /* ── Info Grid ── */
  .info-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 8px; margin-bottom: 16px;
    padding: 12px; background: #f8fafc;
    border: 1px solid #e2e8f0; border-radius: 8px;
  }
  .info-item { display: flex; flex-direction: column; gap: 2px; }
  .info-label { font-size: 7.5pt; color: #94a3b8; font-weight: 700; }
  .info-value { font-size: 9pt; font-weight: 700; color: #1e293b; }

  /* ── Section Title ── */
  .section-title {
    font-size: 11pt; font-weight: 800; color: #1e40af;
    border-right: 4px solid #1e40af; padding-right: 10px;
    margin: 20px 0 10px;
  }

  /* ── Summary Cards ── */
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .card {
    text-align: center; padding: 12px 8px; border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  .card .num { font-size: 22pt; font-weight: 900; line-height: 1.1; }
  .card .lbl { font-size: 7.5pt; color: #64748b; margin-top: 2px; }
  .card-blue   { background: #eff6ff; border-color: #bfdbfe; }  .card-blue .num   { color: #1d4ed8; }
  .card-green  { background: #f0fdf4; border-color: #bbf7d0; }  .card-green .num  { color: #15803d; }
  .card-yellow { background: #fefce8; border-color: #fef08a; }  .card-yellow .num { color: #854d0e; }
  .card-red    { background: #fff1f2; border-color: #fecdd3; }  .card-red .num    { color: #991b1b; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 8.5pt; }
  thead { background: #1e40af; color: #fff; }
  th { padding: 8px 6px; font-weight: 700; text-align: center; border: 1px solid #1e3a8a; }
  td { padding: 7px 6px; border: 1px solid #e2e8f0; text-align: center; vertical-align: middle; }
  tr:nth-child(even) td { background: #f8fafc; }
  .td-ar { text-align: right; padding-right: 8px; }
  .td-en { text-align: left; padding-left: 8px; direction: ltr; }
  .td-num { font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ── Status Badges ── */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 7.5pt; font-weight: 700; white-space: nowrap; }
  .met        { background: #dcfce7; color: #15803d; }
  .needs      { background: #fef9c3; color: #854d0e; }
  .not-met    { background: #fee2e2; color: #991b1b; }

  /* ── Progress Bar ── */
  .prog-wrap { display: flex; align-items: center; gap: 6px; direction: ltr; }
  .prog-bar  { flex: 1; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 4px; }
  .fill-g { background: #22c55e; } .fill-y { background: #eab308; } .fill-r { background: #ef4444; }
  .prog-val  { font-size: 8pt; font-weight: 700; min-width: 36px; text-align: right; }

  /* ── Domain Pills ── */
  .domain { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 7pt; font-weight: 600; }
  .dom-KNOWLEDGE         { background:#dbeafe; color:#1d4ed8; }
  .dom-SKILLS            { background:#dcfce7; color:#15803d; }
  .dom-VALUES            { background:#fae8ff; color:#7e22ce; }
  .dom-COMMUNICATION     { background:#fff7ed; color:#c2410c; }
  .dom-CRITICAL_THINKING { background:#f0fdf4; color:#166534; }

  /* ── Page Break ── */
  .page-break { page-break-before: always; }
  .avoid-break { page-break-inside: avoid; }

  /* ── Cover ── */
  .cover {
    min-height: 90vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; gap: 16px;
  }
  .cover-seal {
    width: 120px; height: 120px; border: 3px solid #1e40af; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10pt; color: #1e40af; font-weight: 700;
  }
  .cover-seal img { width: 100%; border-radius: 50%; }

  /* ── Footer ── */
  .rpt-footer {
    margin-top: 30px; padding-top: 8px;
    border-top: 1px solid #e2e8f0;
    display: flex; justify-content: space-between;
    font-size: 7.5pt; color: #94a3b8;
  }
  .confidential { color: #ef4444; font-weight: 700; }
`;

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

export function statusBadge(status: string): string {
  const map: Record<string, [string, string]> = {
    MET:              ['met',     'محقق ✓'],
    NEEDS_IMPROVEMENT:['needs',   'يحتاج تحسين'],
    NOT_MET:          ['not-met', 'غير محقق ✗'],
  };
  const [cls, label] = map[status] ?? ['needs', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

export function progressBar(value: number, target: number): string {
  const pct = Math.min(value, 100);
  const cls = value >= target ? 'fill-g' : value >= target * 0.85 ? 'fill-y' : 'fill-r';
  return `
    <div class="prog-wrap">
      <div class="prog-bar"><div class="prog-fill ${cls}" style="width:${pct}%"></div></div>
      <span class="prog-val">${value.toFixed(1)}%</span>
    </div>`;
}

export function domainLabel(domain: string): string {
  const map: Record<string, string> = {
    KNOWLEDGE:         'المعرفة',
    SKILLS:            'المهارات',
    VALUES:            'القيم',
    COMMUNICATION:     'التواصل',
    CRITICAL_THINKING: 'التفكير الناقد',
  };
  return `<span class="domain dom-${domain}">${map[domain] ?? domain}</span>`;
}

export function buildHeader(meta: ReportMeta): string {
  const logoContent = meta.logoUrl
    ? `<img src="${meta.logoUrl}" alt="logo" />`
    : 'شعار<br>الجامعة';
  return `
  <div class="rpt-header">
    <div class="rpt-logo">${logoContent}</div>
    <div class="rpt-header-center">
      <div class="rpt-univ-ar">${meta.universityNameAr}</div>
      <div class="rpt-univ-en">${meta.universityNameEn}</div>
      <div class="rpt-sys-badge">Accred-IQ — نظام إدارة الجودة والاعتماد</div>
    </div>
    <div class="rpt-header-meta">
      <div>📅 ${meta.generatedAt}</div>
      <div>📘 ${meta.academicYear}</div>
      ${meta.semester ? `<div>🗓 ${meta.semester}</div>` : ''}
    </div>
  </div>
  <div class="rpt-title-block">
    <div class="rpt-title-ar">${meta.reportTitleAr}</div>
    <div class="rpt-title-en">${meta.reportTitleEn}</div>
  </div>`;
}

export function buildHtmlShell(meta: ReportMeta, body: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${meta.reportTitleAr}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  ${buildHeader(meta)}
  ${body}
  <div class="rpt-footer">
    <span>كلية: ${meta.collegeNameAr} | قسم: ${meta.departmentNameAr}</span>
    <span class="confidential">سري — للاستخدام الأكاديمي الرسمي فقط</span>
    <span>Accred-IQ &copy; ${new Date().getFullYear()}</span>
  </div>
</body>
</html>`;
}
