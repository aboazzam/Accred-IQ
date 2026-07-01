'use client';

import { useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, Download, UploadCloud, X } from 'lucide-react';
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

// ── Template column headers, used for the dummy template download ──
const TEMPLATE_HEADERS: Record<ExcelTemplate, string[]> = {
  course: ['code', 'name', 'nameAr', 'creditHours', 'semester', 'academicYear'],
  plo:    ['code', 'description', 'descriptionAr', 'domain'],
  clo:    ['code', 'description', 'descriptionAr', 'domain', 'targetBenchmark', 'weight'],
  user:   ['name', 'email', 'roleCode', 'department'],
};

function downloadTemplate(template: ExcelTemplate) {
  const csv = TEMPLATE_HEADERS[template].join(',') + '\n';
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accrediq-${template}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportExcelButton<T extends ExcelTemplate>({
  template, onImport, compact = false, useModal = false,
}: {
  template: T;
  onImport: (rows: RowOf<T>[]) => void;
  compact?: boolean;
  useModal?: boolean;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  async function importFile(file: File) {
    setLoading(true);
    setFileName(file.name);
    try {
      const rows = await simulateExcelImport(template);
      onImport(rows);
      setShowModal(false);
    } finally {
      setLoading(false);
      setFileName('');
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) importFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) importFile(file);
  }

  const buttonCls = `flex items-center gap-1.5 font-bold rounded-xl transition disabled:opacity-60 flex-shrink-0 ${
    compact ? 'text-[11px] px-2.5 py-1.5' : 'text-xs px-3.5 py-2'
  }`;
  const buttonStyle = { backgroundColor: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399' };

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />

      <button type="button" onClick={() => (useModal ? setShowModal(true) : inputRef.current?.click())} disabled={loading}
        className={buttonCls} style={buttonStyle}>
        {loading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('importingExcel')}</>
          : <><FileSpreadsheet className="w-3.5 h-3.5" /> {t('importExcel')}</>}
      </button>

      {useModal && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(16,185,129,0.30)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">{t('importModalTitle')}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-purple-300/60 text-xs leading-relaxed">{t('importModalDesc')}</p>

              <button type="button" onClick={() => downloadTemplate(template)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl transition"
                style={{ backgroundColor: 'rgba(0,180,216,0.14)', border: '1px solid rgba(0,180,216,0.35)', color: '#00B4D8' }}>
                <Download className="w-4 h-4" /> {t('downloadTemplate')}
              </button>

              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-2 rounded-xl py-8 px-4 cursor-pointer transition text-center"
                style={{
                  border: `1.5px dashed ${dragging ? 'rgba(16,185,129,0.65)' : 'rgba(107,70,193,0.35)'}`,
                  backgroundColor: dragging ? 'rgba(16,185,129,0.08)' : 'rgba(26,13,52,0.55)',
                }}>
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    <p className="text-purple-200/70 text-xs">{t('importingExcel')}</p>
                    {fileName && <p className="text-purple-300/40 text-[11px]">{t('selectedFile')}: {fileName}</p>}
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-emerald-400/70" />
                    <p className="text-purple-200/70 text-xs font-semibold">{t('dropFileHere')}</p>
                    <p className="text-purple-300/40 text-[11px]">{t('acceptedFormats')}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
