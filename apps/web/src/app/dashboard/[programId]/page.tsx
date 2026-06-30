'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield, ChevronRight, ChevronDown, BarChart3, BookOpen, FileText, Users,
  Award, ClipboardList, Target, ArrowUpRight, Loader2, LogOut,
  GraduationCap, CheckCircle2, AlertCircle, Clock, Plus, X,
  Trash2, Check, Layers,
} from 'lucide-react';
import { fetchProgram, fetchCourses, fetchPlos, createCourse, createPlo, fetchUsers, type Program, type Course, type PLO, type User } from '@/lib/api';
import { getToken, getUser, clearAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { ImportExcelButton, type ExcelCourseRow, type ExcelPloRow, type ExcelCloRow } from '@/components/ImportExcelButton';

const LEVEL_AR: Record<string, string> = {
  BACHELOR: 'بكالوريوس', MASTER: 'ماجستير', DOCTORATE: 'دكتوراه', DIPLOMA: 'دبلوم',
};
const STATUS_AR: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  ACCREDITED: { label: 'معتمد',   icon: CheckCircle2, color: 'text-emerald-400' },
  CANDIDATE:  { label: 'مرشح',    icon: Clock,        color: 'text-cyan-400'    },
  INITIAL:    { label: 'تمهيدي',  icon: AlertCircle,  color: 'text-brand-300'   },
  NONE:       { label: 'غير محدد',icon: AlertCircle,  color: 'text-slate-400'   },
};

const modules = [
  { id: 'overview',    icon: BarChart3,    labelAr: 'نظرة عامة',          color: 'from-brand-600 to-brand-500' },
  { id: 'plos',        icon: Target,       labelAr: 'مخرجات البرنامج PLO', color: 'from-cyan-700 to-cyan-500' },
  { id: 'courses',     icon: BookOpen,     labelAr: 'المقررات الدراسية',   color: 'from-brand-600 to-cyan-700' },
  { id: 'assessment',  icon: ClipboardList,labelAr: 'التقييمات',           color: 'from-violet-700 to-brand-500' },
  { id: 'attainment',  icon: Award,        labelAr: 'تحقيق المخرجات',     color: 'from-cyan-700 to-brand-600' },
  { id: 'reports',     icon: FileText,     labelAr: 'تقارير الاعتماد',    color: 'from-brand-700 to-violet-600' },
  { id: 'evidence',    icon: Shield,       labelAr: 'الأدلة الأكاديمية',  color: 'from-slate-700 to-brand-600' },
  { id: 'users',       icon: Users,        labelAr: 'أعضاء هيئة التدريس', color: 'from-violet-700 to-violet-500' },
];

export default function ProgramDashboardPage() {
  const router       = useRouter();
  const { programId } = useParams<{ programId: string }>();
  const searchParams = useSearchParams();
  const activeTab    = searchParams.get('tab') ?? 'overview';

  const user = getUser();
  const { dir } = useLang();
  const [program,  setProgram]  = useState<Program | null>(null);
  const [courses,  setCourses]  = useState<Course[]>([]);
  const [plos,     setPlos]     = useState<PLO[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    Promise.all([
      fetchProgram(programId),
      fetchCourses(programId),
      fetchPlos(programId),
    ]).then(([prog, crs, pl]) => {
      setProgram(prog.data);
      setCourses(crs.data);
      setPlos(pl.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [programId, router]);

  function logout() { clearAuth(); router.push('/login'); }

  if (loading) return (
    <div className="min-h-screen bg-brand-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  );

  const accStatus = program ? (STATUS_AR[program.accreditationStatus] ?? STATUS_AR.NONE) : STATUS_AR.NONE;
  const AccIcon   = accStatus.icon;

  return (
    <div className="min-h-screen page-bg flex" dir={dir}>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-l border-white/[0.07] sticky top-0 h-screen overflow-y-auto"
        style={{ backgroundColor: 'rgba(26,13,52,0.90)', backdropFilter: 'blur(20px)' }}>
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.07]">
          <Link href="/" className="flex items-center gap-3 mb-4 hover:opacity-80 transition">
            <Image
              src="/logo.png"
              alt="SRU Logo"
              width={400}
              height={56}
              style={{ height: '56px', width: 'auto' }}
              className="logo-white drop-shadow-[0_0_14px_rgba(0,180,216,0.42)] flex-shrink-0"
            />
            <div>
              <span className="font-black text-white text-sm">Accred-IQ</span>
              <p className="text-slate-500 text-[10px] leading-none mt-0.5">جامعة سليمان الراجحي</p>
            </div>
          </Link>
          {program && (
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AccIcon className={`w-3.5 h-3.5 ${accStatus.color}`} />
                <span className={`text-[10px] font-bold ${accStatus.color}`}>{accStatus.label}</span>
              </div>
              <p className="text-white text-xs font-bold leading-tight">{program.nameAr}</p>
              <p className="text-slate-500 text-[10px] mt-0.5 font-mono">{program.code} · {LEVEL_AR[program.level]}</p>
            </div>
          )}
        </div>

        {/* Modules nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {modules.map(mod => {
            const Icon    = mod.icon;
            const isActive = activeTab === mod.id;
            return (
              <Link key={mod.id}
                href={`/dashboard/${programId}?tab=${mod.id}`}
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
          <div className="flex items-center gap-2.5 glass rounded-xl p-2.5">
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
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/[0.07] px-8 h-14 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(44,22,80,0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" /> البرامج
            </Link>
            <span className="text-slate-600">›</span>
            <span className="text-white font-semibold">{program?.nameAr ?? '...'}</span>
          </div>
          <Link href={`/api/reports/programs/${programId}/plo-attainment?academicYear=2024-2025`}
            target="_blank"
            className="flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 border border-cyan-700/40 px-3 py-1.5 rounded-lg transition">
            <FileText className="w-3.5 h-3.5" /> تصدير تقرير PDF
          </Link>
        </header>

        {/* Content area */}
        <div className="p-8">
          {activeTab === 'overview' && program && (
            <OverviewTab program={program} courses={courses} plos={plos} />
          )}
          {activeTab === 'plos' && (
            <PlosTab
              plos={plos}
              programId={programId}
              onAdd={plo => setPlos(prev => [...prev, plo])}
            />
          )}
          {activeTab === 'courses' && (
            <CoursesTab
              courses={courses}
              programId={programId}
              plos={plos}
              onAdd={course => setCourses(prev => [...prev, course])}
            />
          )}
          {activeTab === 'users' && <UsersTab />}
          {!['overview','plos','courses','users'].includes(activeTab) && (
            <ComingSoonTab label={modules.find(m => m.id === activeTab)?.labelAr ?? activeTab} />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Overview Tab ──
function OverviewTab({ program, courses, plos }: { program: Program; courses: Course[]; plos: PLO[] }) {
  const stats = [
    { val: courses.length, label: 'مقرر دراسي', icon: BookOpen,      color: 'from-cyan-700 to-cyan-500' },
    { val: plos.length,    label: 'مخرج برنامج', icon: Target,        color: 'from-brand-600 to-brand-500' },
    { val: program.totalCreditHours ?? '—', label: 'ساعة معتمدة', icon: GraduationCap, color: 'from-violet-700 to-violet-500' },
    { val: program.accreditationBody ?? 'NCAAA', label: 'جهة الاعتماد', icon: Shield, color: 'from-brand-600 to-cyan-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-white mb-0.5">{program.nameAr}</h1>
        <p className="text-slate-400 text-sm" dir="ltr">{program.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Quick modules */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 mb-4">الوحدات الرئيسية</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.slice(1).map(mod => {
            const Icon = mod.icon;
            return (
              <Link key={mod.id} href={`/dashboard/${program.id}?tab=${mod.id}`}
                className="glass glass-hover rounded-xl p-4 flex flex-col items-center gap-2 text-center group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-slate-300 font-semibold">{mod.labelAr}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── PLOs Tab ──
interface PloCloEntry { id: string; code: string; descriptionAr: string; weight: number }

function PlosTab({ plos, programId, onAdd }: { plos: PLO[]; programId: string; onAdd: (plo: PLO) => void }) {
  const { t } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [apiError,  setApiError]  = useState('');
  const [form, setForm] = useState({ code: '', description: '', descriptionAr: '', domain: 'KNOWLEDGE' });

  // Nested CLO-under-PLO mapping — local state (no backend field for academic-weight % yet)
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [cloMap,      setCloMap]      = useState<Record<string, PloCloEntry[]>>({});
  const [confirmedMap, setConfirmedMap] = useState<Record<string, boolean>>({});

  function handleImport(rows: ExcelPloRow[]) {
    const row = rows[0];
    if (!row) return;
    setForm({ code: row.code, description: row.description, descriptionAr: row.descriptionAr, domain: row.domain });
  }

  async function handleCreate() {
    if (!form.code || !form.descriptionAr || !form.description) {
      setApiError('يرجى ملء جميع الحقول المطلوبة'); return;
    }
    setSaving(true); setApiError('');
    try {
      const res = await createPlo(programId, form);
      onAdd(res.data);
      setShowModal(false);
      setForm({ code: '', description: '', descriptionAr: '', domain: 'KNOWLEDGE' });
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'فشل إنشاء المخرج');
    } finally { setSaving(false); }
  }

  function addCloToPlo(ploId: string, entry: Omit<PloCloEntry, 'id'>) {
    setCloMap(prev => ({ ...prev, [ploId]: [...(prev[ploId] ?? []), { id: crypto.randomUUID(), ...entry }] }));
    setConfirmedMap(prev => ({ ...prev, [ploId]: false }));
  }

  function removeCloFromPlo(ploId: string, cloEntryId: string) {
    setCloMap(prev => ({ ...prev, [ploId]: (prev[ploId] ?? []).filter(c => c.id !== cloEntryId) }));
    setConfirmedMap(prev => ({ ...prev, [ploId]: false }));
  }

  function importClosToPlo(ploId: string, rows: ExcelCloRow[]) {
    setCloMap(prev => ({
      ...prev,
      [ploId]: [...(prev[ploId] ?? []), ...rows.map(r => ({ id: crypto.randomUUID(), code: r.code, descriptionAr: r.descriptionAr, weight: r.weight }))],
    }));
    setConfirmedMap(prev => ({ ...prev, [ploId]: false }));
  }

  function saveMapping(ploId: string) {
    setConfirmedMap(prev => ({ ...prev, [ploId]: true }));
  }

  const DOMAIN_STYLE: Record<string, string> = {
    KNOWLEDGE: 'bg-brand-600/20 text-brand-300 border-brand-600/30',
    SKILL:     'bg-cyan-600/20 text-cyan-300 border-cyan-600/30',
    ATTITUDE:  'bg-violet-600/20 text-violet-300 border-violet-600/30',
    COMPETENCY:'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
  };
  const DOMAIN_AR: Record<string, string> = {
    KNOWLEDGE:'معرفة', SKILL:'مهارة', ATTITUDE:'وجداني', COMPETENCY:'جدارة',
  };
  return (
    <div className="space-y-4">
      {/* ── Add PLO Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(107,70,193,0.30)' }}>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(107,70,193,0.7), rgba(0,180,216,0.7), transparent)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">إضافة مخرج تعلم PLO</h3>
              <div className="flex items-center gap-2">
                <ImportExcelButton template="plo" onImport={handleImport} compact />
                <button onClick={() => { setShowModal(false); setApiError(''); }}
                  className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الكود *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="PLO1" dir="ltr"
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
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">إلغاء</button>
              <button onClick={handleCreate} disabled={saving}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-purple-light) 0%, var(--color-cyan-brand) 100%)' }}>
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الحفظ...</> : <><Plus className="w-3.5 h-3.5" /> إضافة</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">مخرجات تعلم البرنامج (PLOs)</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-brand-600/20 text-brand-300 border border-brand-600/30 px-3 py-1 rounded-full">{plos.length} مخرجات</span>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-xl btn-glow transition"
            style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
            <Plus className="w-3 h-3" /> إضافة مخرج
          </button>
        </div>
      </div>
      {plos.length === 0 && <ComingSoonTab label="لا توجد PLOs مضافة بعد" />}
      {plos.map(plo => {
        const isOpen  = expandedId === plo.id;
        const entries = cloMap[plo.id] ?? [];
        const total   = entries.reduce((s, c) => s + c.weight, 0);
        const isExact = total === 100;
        const confirmed = !!confirmedMap[plo.id];
        return (
          <div key={plo.id} className="glass glass-hover rounded-2xl overflow-hidden">
            <button onClick={() => setExpandedId(isOpen ? null : plo.id)}
              className="w-full flex gap-4 p-5 text-right">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-700 flex items-center justify-center flex-shrink-0 font-black text-white text-xs shadow-lg">
                {plo.code}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DOMAIN_STYLE[plo.domain] ?? 'bg-slate-600/20 text-slate-300 border-slate-600/30'}`}>
                    {DOMAIN_AR[plo.domain] ?? plo.domain}
                  </span>
                  {entries.length > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      confirmed ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {entries.length} CLO · {total}%
                    </span>
                  )}
                </div>
                <p className="text-white text-sm font-semibold">{plo.descriptionAr}</p>
                <p className="text-slate-400 text-xs mt-0.5" dir="ltr">{plo.description}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-purple-300/40 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <PloCloDetails
                entries={entries} isExact={isExact} confirmed={confirmed} total={total}
                onAdd={entry => addCloToPlo(plo.id, entry)}
                onRemove={cloEntryId => removeCloFromPlo(plo.id, cloEntryId)}
                onImport={rows => importClosToPlo(plo.id, rows)}
                onSave={() => saveMapping(plo.id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── PLO details — nested CLO list with academic-weight validation ──
function PloCloDetails({
  entries, isExact, confirmed, total, onAdd, onRemove, onImport, onSave,
}: {
  entries: PloCloEntry[]; isExact: boolean; confirmed: boolean; total: number;
  onAdd: (entry: Omit<PloCloEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  onImport: (rows: ExcelCloRow[]) => void;
  onSave: () => void;
}) {
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [weight, setWeight] = useState(20);

  function submitClo() {
    if (!code || !descriptionAr) return;
    onAdd({ code, descriptionAr, weight });
    setCode(''); setDescriptionAr(''); setWeight(20);
  }

  return (
    <div className="px-5 pb-5 pt-1 border-t border-white/[0.06]" style={{ backgroundColor: 'rgba(26,13,52,0.35)' }}>
      <div className="flex items-center justify-between mt-4 mb-3">
        <h4 className="text-xs font-bold text-purple-200/70 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> {t('closUnderPlo')}
        </h4>
        <ImportExcelButton template="clo" onImport={onImport} compact />
      </div>

      {/* CLO rows */}
      {entries.length === 0 ? (
        <p className="text-purple-300/35 text-xs py-3">{t('noClosForPlo')}</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {entries.map(c => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl px-3 py-2"
              style={{ backgroundColor: 'rgba(26,13,52,0.55)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full flex-shrink-0">{c.code}</span>
              <span className="text-xs text-purple-100/80 flex-1 truncate">{c.descriptionAr}</span>
              <span className="text-xs font-black text-cyan-400 flex-shrink-0">{c.weight}%</span>
              <button onClick={() => onRemove(c.id)} className="text-red-400/50 hover:text-red-400 transition flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add CLO inline form */}
      <div className="grid grid-cols-12 gap-2 items-end mb-3">
        <div className="col-span-3 space-y-1">
          <label className="text-[10px] font-semibold text-purple-300/50">{t('cloCode')}</label>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="CLO1" dir="ltr"
            className="w-full px-3 py-2 rounded-lg text-white text-xs focus:outline-none font-mono"
            style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }} />
        </div>
        <div className="col-span-5 space-y-1">
          <label className="text-[10px] font-semibold text-purple-300/50">{t('descAr')}</label>
          <input value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} placeholder="يتمكن الطالب من..."
            className="w-full px-3 py-2 rounded-lg text-white text-xs focus:outline-none"
            style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }} />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-semibold text-purple-300/50">{t('academicWeight')}</label>
          <input type="number" min={0} max={100} value={weight}
            onChange={e => setWeight(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="w-full px-3 py-2 rounded-lg text-white text-xs focus:outline-none"
            style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }} />
        </div>
        <div className="col-span-2">
          <button onClick={submitClo} disabled={!code || !descriptionAr}
            className="w-full flex items-center justify-center gap-1 text-white text-[11px] font-bold py-2 rounded-lg btn-glow transition disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand), var(--color-purple-light))' }}>
            <Plus className="w-3 h-3" /> {t('addCloUnderPlo')}
          </button>
        </div>
      </div>

      {/* Real-time weight sum validation */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl px-4 py-3"
          style={{
            backgroundColor: isExact ? 'rgba(16,185,129,0.10)' : 'rgba(251,191,36,0.10)',
            border: `1px solid ${isExact ? 'rgba(16,185,129,0.30)' : 'rgba(251,191,36,0.30)'}`,
          }}>
          <div className="flex items-center gap-2">
            {isExact ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
            <span className={`text-xs font-bold ${isExact ? 'text-emerald-400' : 'text-amber-400'}`}>
              {t('totalWeightSum')}: {total}%
            </span>
            {!isExact && <span className="text-amber-300/80 text-[11px]">{t('weightWarning')}</span>}
            {isExact && !confirmed && <span className="text-emerald-300/80 text-[11px]">{t('weightOk')}</span>}
          </div>
          <button onClick={onSave} disabled={!isExact}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: confirmed ? 'rgba(16,185,129,0.20)' : 'rgba(0,180,216,0.18)',
              border: `1px solid ${confirmed ? 'rgba(16,185,129,0.40)' : 'rgba(0,180,216,0.35)'}`,
              color: confirmed ? '#34d399' : '#00B4D8',
            }}>
            {confirmed ? <><Check className="w-3.5 h-3.5" /> {t('mappingSaved')}</> : t('saveMapping')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Courses Tab ──
function CoursesTab({ courses, programId, plos, onAdd }: { courses: Course[]; programId: string; plos: PLO[]; onAdd: (c: Course) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [apiError,  setApiError]  = useState('');
  const [form, setForm] = useState({ code: '', name: '', nameAr: '', creditHours: 3, semester: '', academicYear: '', ploIds: [] as string[] });

  function togglePlo(id: string) {
    setForm(f => ({ ...f, ploIds: f.ploIds.includes(id) ? f.ploIds.filter(x => x !== id) : [...f.ploIds, id] }));
  }

  function handleImport(rows: ExcelCourseRow[]) {
    const row = rows[0];
    if (!row) return;
    setForm(f => ({ ...f, code: row.code, name: row.name, nameAr: row.nameAr, creditHours: row.creditHours, semester: row.semester, academicYear: row.academicYear }));
  }

  async function handleCreate() {
    if (!form.code || !form.nameAr || !form.name) {
      setApiError('يرجى ملء جميع الحقول المطلوبة'); return;
    }
    setSaving(true); setApiError('');
    try {
      const res = await createCourse({
        ...form, programId,
        semester:     form.semester     || undefined,
        academicYear: form.academicYear || undefined,
      });
      onAdd(res.data);
      setShowModal(false);
      setForm({ code: '', name: '', nameAr: '', creditHours: 3, semester: '', academicYear: '', ploIds: [] });
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'فشل إنشاء المقرر');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* ── Add Course Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,5,20,0.80)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md glass card-glow rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid rgba(0,180,216,0.30)' }}>
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,180,216,0.7), rgba(107,70,193,0.7), transparent)' }} />
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]"
              style={{ backgroundColor: 'rgba(44,22,80,0.60)' }}>
              <h3 className="text-white font-black text-base">إضافة مقرر دراسي</h3>
              <div className="flex items-center gap-2">
                <ImportExcelButton template="course" onImport={handleImport} compact />
                <button onClick={() => { setShowModal(false); setApiError(''); }}
                  className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الاسم بالعربية *</label>
                  <input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                    placeholder="مبادئ البرمجة"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الاسم بالإنجليزية *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Introduction to Programming" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الكود *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="CS101" dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none font-mono"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الساعات *</label>
                  <input type="number" min={1} max={6} value={form.creditHours}
                    onChange={e => setForm(f => ({ ...f, creditHours: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200/70">الفصل</label>
                  <input value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    placeholder="الأول"
                    className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                    style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70">العام الأكاديمي</label>
                <input value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                  placeholder="2024-2025" dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl text-white placeholder:text-purple-300/30 text-sm focus:outline-none"
                  style={{ backgroundColor: 'rgba(26,13,52,0.75)', border: '1px solid rgba(107,70,193,0.25)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,180,216,0.55)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(107,70,193,0.25)'; }} />
              </div>

              {/* Dynamic PLO dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-200/70 flex items-center justify-between">
                  <span>ربط المقرر بمخرجات البرنامج (PLOs)</span>
                  {form.ploIds.length > 0 && <span className="text-cyan-400 text-[11px] font-bold">{form.ploIds.length} مخرج محدد</span>}
                </label>
                <div className="rounded-xl max-h-36 overflow-y-auto"
                  style={{ backgroundColor: 'rgba(26,13,52,0.55)', border: '1px solid rgba(107,70,193,0.25)' }}>
                  {plos.length === 0 && <p className="px-4 py-3 text-purple-300/35 text-xs">لا توجد مخرجات PLO لهذا البرنامج بعد</p>}
                  {plos.map(plo => (
                    <label key={plo.id}
                      className="flex items-center gap-2.5 px-4 py-2 cursor-pointer hover:bg-white/[0.04] transition border-b border-white/[0.03] last:border-0">
                      <input type="checkbox" checked={form.ploIds.includes(plo.id)} onChange={() => togglePlo(plo.id)}
                        className="accent-cyan-500 w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[11px] font-bold text-cyan-400 flex-shrink-0">{plo.code}</span>
                      <span className="text-xs text-purple-200/70 truncate">{plo.descriptionAr}</span>
                    </label>
                  ))}
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
                className="text-xs text-purple-300/60 hover:text-white glass glass-hover px-4 py-2 rounded-xl transition">إلغاء</button>
              <button onClick={handleCreate} disabled={saving}
                className="btn-glow flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand) 0%, var(--color-purple-light) 100%)' }}>
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ الحفظ...</> : <><Plus className="w-3.5 h-3.5" /> إضافة</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">المقررات الدراسية</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-cyan-600/20 text-cyan-300 border border-cyan-600/30 px-3 py-1 rounded-full">{courses.length} مقررات</span>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-xl btn-glow transition"
            style={{ background: 'linear-gradient(135deg, var(--color-cyan-brand), var(--color-purple-light))' }}>
            <Plus className="w-3 h-3" /> إضافة مقرر
          </button>
        </div>
      </div>
      {courses.length === 0 && <ComingSoonTab label="لا توجد مقررات مضافة بعد" />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(course => (
          <div key={course.id} className="glass glass-hover rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-700/50 to-brand-700/50 border border-cyan-700/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{course.nameAr}</p>
                <p className="text-slate-400 text-xs font-mono" dir="ltr">{course.code}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{course.creditHours} ساعات معتمدة</span>
                {course.semester && <span>· {course.semester}</span>}
                {course._count?.clos != null && (
                  <span className="text-cyan-400/70">· {course._count.clos} CLO</span>
                )}
              </div>
              <Link href={`/dashboard/${programId}/course/${course.id}`}
                className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-white glass glass-hover px-2.5 py-1 rounded-lg transition flex-shrink-0">
                <ArrowUpRight className="w-3 h-3" /> إدارة
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Tab ──
function UsersTab() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchUsers()
      .then(res => setUsers(res.data))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-white">أعضاء هيئة التدريس والمستخدمون</h2>
          <p className="text-purple-300/50 text-xs mt-0.5">المستخدمون المسجلون في نظام Accred-IQ</p>
        </div>
        {!loading && !error && (
          <span className="text-xs bg-violet-600/20 text-violet-300 border border-violet-600/30 px-3 py-1 rounded-full">
            {users.length} مستخدم
          </span>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      )}
      {error && (
        <div className="glass rounded-xl p-4 text-red-400 text-sm">⚠ {error}</div>
      )}
      {!loading && !error && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
          <Users className="w-10 h-10 opacity-30" />
          <p className="text-sm">لا يوجد مستخدمون في النظام بعد</p>
        </div>
      )}
      {!loading && !error && users.length > 0 && (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="glass glass-hover rounded-2xl px-5 py-3.5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-purple-light), var(--color-cyan-brand))' }}>
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{user.name}</p>
                <p className="text-purple-300/50 text-xs" dir="ltr">{user.email}</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 bg-brand-600/20 text-brand-300 border-brand-600/30">
                {user.roleNameAr}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
        <Shield className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-300 font-bold mb-1">{label}</p>
      <p className="text-slate-500 text-xs">سيتم تفعيل هذه الوحدة في المراحل القادمة</p>
    </div>
  );
}
