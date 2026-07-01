'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen, ChevronRight, Target, ClipboardList, BarChart3,
  Loader2, LogOut, Plus, X, Edit2, ArrowUpRight, Check,
} from 'lucide-react';
import { fetchCourse, fetchClos, createClo, updateClo, type Course, type CLO } from '@/lib/api';
import { getToken, getUser, clearAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { ImportExcelButton, type ExcelCloRow } from '@/components/ImportExcelButton';

// ── Constants ────────────────────────────────────────────────
const MODULES = [
  { id: 'overview', icon: BarChart3,    labelAr: 'نظرة عامة',           color: 'from-brand-600 to-brand-500'  },
  { id: 'clos',     icon: Target,       labelAr: 'مخرجات التعلم CLOs',  color: 'from-cyan-700 to-cyan-500'   },
  { id: 'rubrics',  icon: ClipboardList,labelAr: 'معايير الجدارة',       color: 'from-violet-700 to-brand-500' },
];

const DOMAIN_AR: Record<string, string> = {
  KNOWLEDGE: 'معرفة', SKILL: 'مهارة', ATTITUDE: 'قيم', COMPETENCY: 'جدارة',
};
const DOMAIN_STYLE: Record<string, string> = {
  KNOWLEDGE:  'bg-brand-600/20 text-brand-300 border-brand-600/30',
  SKILL:      'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
  ATTITUDE:   'bg-violet-600/20 text-violet-300 border-violet-600/30',
  COMPETENCY: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
};

// ── Page ─────────────────────────────────────────────────────
export default function CoursePage() {
  const router = useRouter();
  const { programId, courseId } = useParams<{ programId: string; courseId: string }>();
  const searchParams = useSearchParams();
  const activeTab    = searchParams.get('tab') ?? 'overview';

  const user = getUser();
  const { lang, dir } = useLang();
  const [course,  setCourse]  = useState<Course | null>(null);
  const [clos,    setClos]    = useState<CLO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    Promise.all([fetchCourse(courseId), fetchClos(courseId)])
      .then(([crs, cl]) => { setCourse(crs.data); setClos(cl.data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId, router]);

  function logout() { clearAuth(); router.push('/login'); }

  if (loading) return (
    <div className="min-h-screen page-bg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  );

  return (
    <div className="min-h-screen page-bg flex" dir={dir}>

      {/* ════ SIDEBAR ════ */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-l border-white/[0.07] sticky top-0 h-screen overflow-y-auto"
        style={{ backgroundColor: 'rgba(26,13,52,0.90)', backdropFilter: 'blur(20px)' }}>

        {/* Logo + course chip */}
        <div className="p-5 border-b border-white/[0.07]">
          <Link href="/" className="flex items-center gap-3 mb-4 hover:opacity-80 transition">
            <Image src="/logo.png" alt="SRU" width={400} height={56}
              style={{ height: '56px', width: 'auto' }}
              className="logo-white drop-shadow-[0_0_14px_rgba(0,180,216,0.42)] flex-shrink-0" />
            <div>
              <span className="font-black text-white text-sm">Accred-IQ</span>
              <p className="text-slate-500 text-[10px] leading-none mt-0.5">جامعة سليمان الراجحي</p>
            </div>
          </Link>
          {course && (
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-400">مقرر دراسي</span>
              </div>
              <p className="text-white text-xs font-bold leading-snug">{lang === 'ar' ? course.nameAr : course.name}</p>
              <p className="text-slate-500 text-[10px] mt-0.5 font-mono" dir="ltr">
                {course.code} · {course.creditHours} ساعات
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {MODULES.map(mod => {
            const Icon     = mod.icon;
            const isActive = activeTab === mod.id;
            return (
              <Link key={mod.id}
                href={`/dashboard/${programId}/course/${courseId}?tab=${mod.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-700/60 to-cyan-800/40 text-white border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? `bg-gradient-to-br ${mod.color}` : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {mod.labelAr}
                {isActive && <ArrowUpRight className="w-3 h-3 mr-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 glass rounded-xl p-2.5 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-cyan-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-bold truncate">{user?.name}</p>
              <p className="text-slate-400 text-[10px] truncate">{user?.roleNameAr}</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <Link href={`/dashboard/${programId}?tab=courses`}
            className="flex items-center gap-2 text-purple-300/50 hover:text-white text-xs transition py-1.5 px-3 rounded-lg hover:bg-white/5">
            <ChevronRight className="w-3.5 h-3.5" /> العودة للمقررات
          </Link>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <main className="flex-1 overflow-auto">

        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/[0.07] px-8 h-14 flex items-center"
          style={{ backgroundColor: 'rgba(44,22,80,0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" /> البرامج
            </Link>
            <span className="text-slate-600">›</span>
            <Link href={`/dashboard/${programId}?tab=courses`} className="hover:text-white transition">
              المقررات
            </Link>
            <span className="text-slate-600">›</span>
            <span className="text-white font-semibold">{(lang === 'ar' ? course?.nameAr : course?.name) ?? '...'}</span>
          </div>
        </header>

        <div className="p-8">
          {error && (
            <div className="glass rounded-xl px-4 py-3 text-red-300 text-sm mb-6"
              style={{ borderColor: 'rgba(239,68,68,0.3)' }}>⚠ {error}</div>
          )}
          {activeTab === 'overview' && course && (
            <CourseOverviewTab course={course} clos={clos} programId={programId} courseId={courseId} />
          )}
          {activeTab === 'clos' && (
            <ClosTab
              clos={clos}
              courseId={courseId}
              onAdd={clo => setClos(prev => [...prev, clo])}
              onEdit={updated => setClos(prev => prev.map(c => c.id === updated.id ? updated : c))}
            />
          )}
          {activeTab === 'rubrics' && (
            <RubricsTab clos={clos} />
          )}
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════
function CourseOverviewTab({
  course, clos, programId, courseId,
}: {
  course: Course; clos: CLO[]; programId: string; courseId: string;
}) {
  const { lang } = useLang();
  const stats = [
    { val: clos.length,                    label: 'مخرج تعلم CLO', icon: Target,       color: 'from-cyan-700 to-cyan-500'   },
    { val: course.creditHours,             label: 'ساعة معتمدة',   icon: BookOpen,     color: 'from-brand-600 to-brand-500' },
    { val: course._count?.assessments ?? 0, label: 'تقييم',        icon: ClipboardList, color: 'from-violet-700 to-brand-500'},
  ];

  const domainDist = clos.reduce<Record<string, number>>((acc, c) => {
    acc[c.domain] = (acc[c.domain] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-white mb-0.5">{lang === 'ar' ? course.nameAr : course.name}</h1>
        <p className="text-slate-400 text-sm" dir={lang === 'ar' ? 'ltr' : 'rtl'}>{lang === 'ar' ? course.name : course.nameAr}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass glass-hover rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-black text-white">{s.val}</div>
              <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Course info */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">معلومات المقرر</h3>
          <div className="space-y-2.5">
            {[
              { label: 'الكود',          val: course.code,             mono: true },
              { label: 'الفصل الدراسي', val: course.semester ?? '—' },
              { label: 'العام الأكاديمي',val: course.academicYear ?? '—' },
              { label: 'عدد الساعات',   val: `${course.creditHours} ساعات` },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
                <span className="text-purple-300/50 text-xs">{r.label}</span>
                <span className={`text-white text-xs font-semibold ${r.mono ? 'font-mono' : ''}`}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CLO domain distribution */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">توزيع مجالات CLOs</h3>
          {clos.length === 0 ? (
            <p className="text-purple-300/40 text-xs text-center py-6">لا توجد CLOs مضافة بعد</p>
          ) : (
            <div className="space-y-2.5">
              {(['KNOWLEDGE','SKILL','ATTITUDE','COMPETENCY'] as const).map(domain => {
                const count = domainDist[domain] ?? 0;
                const pct   = clos.length ? Math.round(count / clos.length * 100) : 0;
                return (
                  <div key={domain} className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-14 text-center flex-shrink-0 ${DOMAIN_STYLE[domain]}`}>
                      {DOMAIN_AR[domain]}
                    </span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 bg-cyan-500 opacity-60"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-white text-xs font-bold w-4 text-left flex-shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4">وحدات إدارة المقرر</h3>
        <div className="grid grid-cols-2 gap-3">
          {MODULES.slice(1).map(mod => {
            const Icon = mod.icon;
            return (
              <Link key={mod.id}
                href={`/dashboard/${programId}/course/${courseId}?tab=${mod.id}`}
                className="glass glass-hover rounded-xl p-5 flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-slate-300 font-semibold group-hover:text-white transition">{mod.labelAr}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CLOs TAB — مخرجات التعلم
// ════════════════════════════════════════════════════════════
function ClosTab({
  clos, courseId, onAdd, onEdit,
}: {
  clos: CLO[]; courseId: string;
  onAdd:  (clo: CLO) => void;
  onEdit: (clo: CLO) => void;
}) {
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState<CLO | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [apiError,   setApiError]   = useState('');
  const [form, setForm] = useState({
    code: '', description: '', descriptionAr: '', domain: 'KNOWLEDGE', targetBenchmark: 70,
  });

  function openAdd() {
    setEditTarget(null);
    setForm({ code: '', description: '', descriptionAr: '', domain: 'KNOWLEDGE', targetBenchmark: 70 });
    setApiError('');
    setShowModal(true);
  }

  function openEdit(clo: CLO) {
    setEditTarget(clo);
    setForm({
      code: clo.code, description: clo.description, descriptionAr: clo.descriptionAr,
      domain: clo.domain, targetBenchmark: clo.targetBenchmark,
    });
    setApiError('');
    setShowModal(true);
  }

  function handleImport(rows: ExcelCloRow[]) {
    const row = rows[0];
    if (!row) return;
    setForm({ code: row.code, description: row.description, descriptionAr: row.descriptionAr, domain: row.domain, targetBenchmark: row.targetBenchmark });
  }

  async function handleSave() {
    if (!form.code || !form.descriptionAr || !form.description) {
      setApiError('يرجى ملء جميع الحقول المطلوبة'); return;
    }
    setSaving(true); setApiError('');
    try {
      if (editTarget) {
        const res = await updateClo(courseId, editTarget.id, form);
        onEdit(res.data);
      } else {
        const res = await createClo(courseId, form);
        onAdd(res.data);
      }
      setShowModal(false);
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'فشل الحفظ');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(0,180,216,0.30)' }}>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,180,216,0.7), rgba(107,70,193,0.7), transparent)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">
                {editTarget ? 'تعديل مخرج التعلم' : 'إضافة مخرج تعلم CLO'}
              </h3>
              <div className="flex items-center gap-2">
                {!editTarget && <ImportExcelButton template="clo" onImport={handleImport} compact />}
                <button onClick={() => { setShowModal(false); setApiError(''); }}
                  className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الكود *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="CLO1" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none font-mono"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">المجال *</label>
                  <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}>
                    <option value="KNOWLEDGE">معرفة</option>
                    <option value="SKILL">مهارة</option>
                    <option value="ATTITUDE">قيم وجدانية</option>
                    <option value="COMPETENCY">جدارة</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">الوصف بالعربية *</label>
                <textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                  rows={3} placeholder="يتمكن الطالب من..."
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none resize-none"
                  style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">الوصف بالإنجليزية *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Student will be able to..." dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none resize-none"
                  style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-purple-200/70 flex items-center justify-between">
                  <span>نسبة الإتقان المستهدفة *</span>
                  <span className="text-cyan-400 font-black text-base">{form.targetBenchmark}%</span>
                </label>
                <input type="range" min={50} max={100} step={5} value={form.targetBenchmark}
                  onChange={e => setForm(f => ({ ...f, targetBenchmark: Number(e.target.value) }))}
                  className="w-full accent-cyan-500 h-1.5" />
                <div className="flex justify-between text-[10px] text-purple-300/35">
                  <span>50% — حد أدنى</span><span>75% — مقبول</span><span>100%</span>
                </div>
              </div>
              {apiError && (
                <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                  ⚠ {apiError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-3"
              style={{ backgroundColor: 'rgba(26,13,52,0.40)' }}>
              <button onClick={() => { setShowModal(false); setApiError(''); }}
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">
                إلغاء
              </button>
              <button onClick={handleSave} disabled={saving}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand) 0%, var(--color-purple-light) 100%)' }}>
                {saving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الحفظ...</>
                  : <><Check className="w-3.5 h-3.5" /> {editTarget ? 'حفظ التعديلات' : 'إضافة CLO'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">مخرجات تعلم المقرر (CLOs)</h2>
          <p className="text-purple-300/50 text-xs mt-0.5">ما يجب أن يتمكن الطالب من تحقيقه عند إتمام المقرر</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-cyan-600/20 text-cyan-300 border border-cyan-600/30 px-3 py-1 rounded-full">
            {clos.length} مخرجات
          </span>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-xl btn-glow transition"
            style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand), var(--color-purple-light))' }}>
            <Plus className="w-3 h-3" /> إضافة CLO
          </button>
        </div>
      </div>

      {clos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
          <Target className="w-10 h-10 opacity-30" />
          <p className="text-sm font-semibold">لا توجد مخرجات تعلم بعد</p>
          <p className="text-xs opacity-60">ابدأ بإضافة مخرجات التعلم الخاصة بهذا المقرر</p>
        </div>
      )}

      <div className="space-y-3">
        {clos.map(clo => (
          <div key={clo.id} className="glass glass-hover rounded-2xl p-5 flex gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-700 to-brand-700 flex items-center justify-center flex-shrink-0 font-black text-white text-xs shadow-lg">
              {clo.code}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DOMAIN_STYLE[clo.domain] ?? 'bg-slate-600/20 text-slate-300 border-slate-600/30'}`}>
                  {DOMAIN_AR[clo.domain] ?? clo.domain}
                </span>
                <span className="text-[10px] text-purple-300/40">الإتقان المستهدف:</span>
                <span className="text-[10px] font-black text-cyan-400">{clo.targetBenchmark}%</span>
                {/* Benchmark bar */}
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
                  <div className="h-full rounded-full bg-cyan-500 opacity-60 transition-all duration-500"
                    style={{ width: `${clo.targetBenchmark}%` }} />
                </div>
              </div>
              <p className="text-white text-sm font-semibold">{clo.descriptionAr}</p>
              <p className="text-slate-400 text-xs mt-0.5" dir="ltr">{clo.description}</p>
            </div>
            <button onClick={() => openEdit(clo)}
              className="opacity-0 group-hover:opacity-100 transition text-purple-300/50 hover:text-white flex-shrink-0 mt-1"
              title="تعديل">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// RUBRICS TAB — معايير الجدارة والتقييم
// ════════════════════════════════════════════════════════════
interface RubricRow {
  id: string;
  criterionAr: string;
  criterion: string;
  cloCode: string;
  weight: number;
  excellent: string;
  good: string;
  acceptable: string;
  poor: string;
}

const PERF_LEVELS = [
  { key: 'excellent'  as const, labelAr: 'ممتاز', color: '#34d399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(52,211,153,0.30)'  },
  { key: 'good'       as const, labelAr: 'جيد',   color: '#00B4D8', bg: 'rgba(0,180,216,0.08)',   border: 'rgba(0,180,216,0.30)'   },
  { key: 'acceptable' as const, labelAr: 'مقبول', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.30)'  },
  { key: 'poor'       as const, labelAr: 'ضعيف',  color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(248,113,113,0.30)' },
];

function RubricsTab({ clos }: { clos: CLO[] }) {
  const [rows,       setRows]       = useState<RubricRow[]>([]);
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState<RubricRow | null>(null);
  const [formError,  setFormError]  = useState('');
  const [form, setForm] = useState<Omit<RubricRow, 'id'>>({
    criterionAr: '', criterion: '', cloCode: clos[0]?.code ?? '',
    weight: 20, excellent: '', good: '', acceptable: '', poor: '',
  });

  function openAdd() {
    setEditTarget(null);
    setForm({ criterionAr: '', criterion: '', cloCode: clos[0]?.code ?? '', weight: 20, excellent: '', good: '', acceptable: '', poor: '' });
    setFormError('');
    setShowModal(true);
  }

  function openEdit(row: RubricRow) {
    setEditTarget(row);
    setForm({ criterionAr: row.criterionAr, criterion: row.criterion, cloCode: row.cloCode, weight: row.weight, excellent: row.excellent, good: row.good, acceptable: row.acceptable, poor: row.poor });
    setFormError('');
    setShowModal(true);
  }

  function handleSave() {
    if (!form.criterionAr || !form.criterion || !form.cloCode) {
      setFormError('يرجى ملء جميع الحقول المطلوبة'); return;
    }
    if (editTarget) {
      setRows(prev => prev.map(r => r.id === editTarget.id ? { ...editTarget, ...form } : r));
    } else {
      setRows(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setShowModal(false);
  }

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);

  return (
    <div className="space-y-5">
      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(107,70,193,0.30)' }}>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(107,70,193,0.7), rgba(0,180,216,0.7), transparent)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">
                {editTarget ? 'تعديل معيار الجدارة' : 'إضافة معيار جدارة جديد'}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Criterion name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">المعيار بالعربية *</label>
                  <input value={form.criterionAr} onChange={e => setForm(f => ({ ...f, criterionAr: e.target.value }))}
                    placeholder="فهم المفاهيم الأساسية"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">المعيار بالإنجليزية *</label>
                  <input value={form.criterion} onChange={e => setForm(f => ({ ...f, criterion: e.target.value }))}
                    placeholder="Understanding core concepts" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
              </div>

              {/* CLO + weight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">مخرج التعلم المرتبط *</label>
                  <select value={form.cloCode} onChange={e => setForm(f => ({ ...f, cloCode: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}>
                    {clos.length === 0 && <option value="">— أضف CLO أولاً —</option>}
                    {clos.map(c => (
                      <option key={c.id} value={c.code}>
                        {c.code} — {c.descriptionAr.length > 28 ? c.descriptionAr.slice(0, 28) + '...' : c.descriptionAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-purple-200/70 flex items-center justify-between">
                    <span>الوزن</span>
                    <span className="text-cyan-400 font-black">{form.weight}%</span>
                  </label>
                  <input type="range" min={5} max={50} step={5} value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))}
                    className="w-full accent-cyan-500 mt-3" />
                </div>
              </div>

              {/* Performance level descriptors */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 py-2.5 text-[11px] font-bold text-purple-300/50 border-b border-white/[0.05]"
                  style={{ backgroundColor: 'rgba(26,13,52,0.55)' }}>
                  وصف مستويات الأداء لهذا المعيار
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {PERF_LEVELS.map(lvl => (
                    <div key={lvl.key} className="flex items-center gap-3 px-4 py-2.5"
                      style={{ backgroundColor: lvl.bg }}>
                      <span className="text-[10px] font-black w-10 text-right flex-shrink-0" style={{ color: lvl.color }}>
                        {lvl.labelAr}
                      </span>
                      <input
                        value={form[lvl.key]}
                        onChange={e => setForm(f => ({ ...f, [lvl.key]: e.target.value }))}
                        placeholder={`وصف أداء مستوى ${lvl.labelAr}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg text-white placeholder:text-purple-300/25 text-xs focus:outline-none"
                        style={{ backgroundColor: 'rgba(26,13,52,0.55)', border: `1px solid ${lvl.border}` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="rounded-xl px-4 py-2.5 text-red-300 text-xs"
                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)' }}>
                  ⚠ {formError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] flex items-center justify-end gap-3"
              style={{ backgroundColor: 'rgba(26,13,52,0.40)' }}>
              <button onClick={() => setShowModal(false)}
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">
                إلغاء
              </button>
              <button onClick={handleSave}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
                style={{ background: 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
                <Check className="w-3.5 h-3.5" /> {editTarget ? 'حفظ التعديلات' : 'إضافة معيار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">معايير الجدارة والتقييم (Rubrics)</h2>
          <p className="text-purple-300/50 text-xs mt-0.5">مصفوفة تقييم الأداء لكل مخرج تعلم في هذا المقرر</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              totalWeight === 100
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {totalWeight}% {totalWeight === 100 ? '✓ مكتمل' : '— مجموع الأوزان'}
            </span>
          )}
          <button onClick={openAdd}
            className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-xl btn-glow transition"
            style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
            <Plus className="w-3 h-3" /> إضافة معيار
          </button>
        </div>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
          <ClipboardList className="w-10 h-10 opacity-30" />
          <p className="text-sm font-semibold">لا توجد معايير جدارة بعد</p>
          <p className="text-xs opacity-60">أضف معايير التقييم المرتبطة بمخرجات التعلم</p>
        </div>
      )}

      {/* Rubric matrix table */}
      {rows.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.07]"
                  style={{ backgroundColor: 'rgba(26,13,52,0.65)' }}>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-purple-300/60 w-44">المعيار</th>
                  <th className="text-center px-3 py-3 text-[11px] font-bold text-purple-300/60 w-16">CLO</th>
                  {PERF_LEVELS.map(lvl => (
                    <th key={lvl.key} className="text-center px-3 py-3 text-[11px] font-bold"
                      style={{ color: lvl.color }}>
                      {lvl.labelAr}
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 text-[11px] font-bold text-purple-300/60 w-14">الوزن</th>
                  <th className="w-8 px-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition group"
                    style={i % 2 !== 0 ? { backgroundColor: 'rgba(26,13,52,0.20)' } : {}}>
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold text-xs">{row.criterionAr}</p>
                      <p className="text-purple-300/40 text-[10px]" dir="ltr">{row.criterion}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        {row.cloCode}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-[10px] text-emerald-400/80 max-w-[120px]">
                      <span className="line-clamp-2">{row.excellent || '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-[10px] max-w-[120px]" style={{ color: 'rgba(0,180,216,0.80)' }}>
                      <span className="line-clamp-2">{row.good || '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-[10px] text-amber-400/80 max-w-[120px]">
                      <span className="line-clamp-2">{row.acceptable || '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-[10px] text-red-400/80 max-w-[120px]">
                      <span className="line-clamp-2">{row.poor || '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs font-black text-cyan-400">{row.weight}%</span>
                    </td>
                    <td className="px-2 py-3">
                      <button onClick={() => openEdit(row)}
                        className="opacity-0 group-hover:opacity-100 transition text-purple-300/40 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ backgroundColor: 'rgba(26,13,52,0.50)' }}>
                  <td colSpan={6} className="px-4 py-2.5 text-[11px] font-bold text-purple-300/40">
                    الإجمالي ({rows.length} معيار)
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-sm font-black ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {totalWeight}%
                    </span>
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
