'use client';

import { useRef, useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── Simulated spreadsheet templates ─────────────────────────
// Real spreadsheet parsing (SheetJS/xlsx) would replace simulateExcelImport's
// body; the column shapes below mirror the "official" import template per entity.

export type ExcelTemplate = 'course' | 'plo' | 'clo' | 'user';

export interface ExcelCourseRow {
  code: string; name: string; nameAr: string;
  creditHours: number; semester: string; academicYear: string;
}
export interface ExcelPloRow {
  code: string; description: string; descriptionAr: string; domain: string;
}
export interface ExcelCloRow {
  code: string; description: string; descriptionAr: string; domain: string;
  targetBenchmark: number; weight: number;
}
export interface ExcelUserRow {
  name: string; email: string; roleCode: string; department: string;
}

type RowOf<T extends ExcelTemplate> =
  T extends 'course' ? ExcelCourseRow :
  T extends 'plo'    ? ExcelPloRow :
  T extends 'clo'    ? ExcelCloRow :
  ExcelUserRow;

let seq = 0;
function nextSeq() { seq += 1; return seq; }

const TEMPLATES: { course: ExcelCourseRow[]; plo: ExcelPloRow[]; clo: ExcelCloRow[]; user: ExcelUserRow[] } = {
  course: [
    { code: 'CS210', name: 'Data Structures', nameAr: 'هياكل البيانات', creditHours: 3, semester: 'الثاني', academicYear: '2024-2025' },
    { code: 'CS215', name: 'Discrete Mathematics', nameAr: 'الرياضيات المتقطعة', creditHours: 3, semester: 'الأول', academicYear: '2024-2025' },
  ],
  plo: [
    { code: 'PLO-3', description: 'Apply engineering knowledge to solve complex problems', descriptionAr: 'تطبيق المعرفة الهندسية لحل المشكلات المعقدة', domain: 'SKILL' },
    { code: 'PLO-4', description: 'Communicate effectively in professional settings', descriptionAr: 'التواصل الفعّال في البيئات المهنية', domain: 'COMPETENCY' },
  ],
  clo: [
    { code: 'CLO-2', description: 'Implement core data structures', descriptionAr: 'تطبيق هياكل البيانات الأساسية', domain: 'SKILL', targetBenchmark: 75, weight: 40 },
    { code: 'CLO-3', description: 'Analyze algorithm complexity', descriptionAr: 'تحليل تعقيد الخوارزميات', domain: 'KNOWLEDGE', targetBenchmark: 70, weight: 30 },
  ],
  user: [
    { name: 'د. نورة العتيبي', email: 'n.alotaibi@sru.edu.sa', roleCode: 'COURSE_INSTRUCTOR', department: 'قسم علوم الحاسب' },
    { name: 'د. خالد الزهراني', email: 'k.alzahrani@sru.edu.sa', roleCode: 'PROGRAM_DIRECTOR', department: 'قسم علوم الحاسب' },
    { name: 'أ. سارة القحطاني', email: 's.alqahtani@sru.edu.sa', roleCode: 'QUALITY_COORDINATOR', department: 'عمادة الجودة' },
  ],
};

/**
 * Simulates parsing an uploaded spreadsheet against the official Accred-IQ
 * import template for the given entity. Returns fresh sample rows with
 * unique codes each call so repeated imports don't collide in local state.
 */
export function simulateExcelImport<T extends ExcelTemplate>(template: T): Promise<RowOf<T>[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      const n = nextSeq();
      const rows = TEMPLATES[template].map(row => {
        const clone = { ...row } as Record<string, unknown>;
        if ('code' in clone && typeof clone.code === 'string') clone.code = `${clone.code}-${n}`;
        if ('email' in clone && typeof clone.email === 'string') clone.email = clone.email.replace('@', `+${n}@`);
        return clone;
      });
      resolve(rows as unknown as RowOf<T>[]);
    }, 650);
  });
}

export function ImportExcelButton<T extends ExcelTemplate>({
  template, onImport, compact = false,
}: {
  template: T;
  onImport: (rows: RowOf<T>[]) => void;
  compact?: boolean;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const rows = await simulateExcelImport(template);
      onImport(rows);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}
        className={`flex items-center gap-1.5 font-bold rounded-xl transition disabled:opacity-60 flex-shrink-0 ${
          compact ? 'text-[11px] px-2.5 py-1.5' : 'text-xs px-3.5 py-2'
        }`}
        style={{ backgroundColor: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399' }}>
        {loading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('importingExcel')}</>
          : <><FileSpreadsheet className="w-3.5 h-3.5" /> {t('importExcel')}</>}
      </button>
    </>
  );
}
