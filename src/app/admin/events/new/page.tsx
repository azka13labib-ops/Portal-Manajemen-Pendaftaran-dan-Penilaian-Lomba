'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Users, BookOpen, ChevronLeft, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { slugify } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Info Event', icon: Trophy },
  { id: 2, label: 'Waktu & Jadwal', icon: Clock },
  { id: 3, label: 'Rubrik Penilaian', icon: BookOpen },
  { id: 4, label: 'Undang Juri', icon: Users },
];

interface Criteria {
  name: string;
  description: string;
  weight: number;
  min_score: number;
  max_score: number;
}

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [regMode, setRegMode] = useState<'INDIVIDUAL' | 'TEAM'>('INDIVIDUAL');
  const [teamMin, setTeamMin] = useState(2);
  const [teamMax, setTeamMax] = useState(5);

  // Step 2 - Dates
  const [regOpen, setRegOpen] = useState('');
  const [regClose, setRegClose] = useState('');
  const [subClose, setSubClose] = useState('');
  const [announced, setAnnounced] = useState('');

  // Step 3 - Criteria
  const [criteria, setCriteria] = useState<Criteria[]>([
    { name: 'Kreativitas', description: '', weight: 30, min_score: 0, max_score: 100 },
    { name: 'Teknis', description: '', weight: 40, min_score: 0, max_score: 100 },
    { name: 'Presentasi', description: '', weight: 30, min_score: 0, max_score: 100 },
  ]);

  // Step 4 - Judges
  const [judgeEmails, setJudgeEmails] = useState('');

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
  const weightOk = Math.abs(totalWeight - 100) < 0.01;

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0;
    if (step === 2) return regOpen && regClose && subClose;
    if (step === 3) return weightOk && criteria.length > 0;
    return true;
  };

  const addCriteria = () =>
    setCriteria([...criteria, { name: '', description: '', weight: 0, min_score: 0, max_score: 100 }]);

  const removeCriteria = (i: number) =>
    setCriteria(criteria.filter((_, idx) => idx !== i));

  const updateCriteria = (i: number, field: keyof Criteria, value: string | number) =>
    setCriteria(criteria.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setLoading(true);

    try {
      // Get current user for ownership
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi login tidak valid');

      // 1. Create event
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .insert({
          title: title.trim(),
          slug: slugify(title),
          description,
          category: category || null,
          registration_mode: regMode,
          team_min_members: regMode === 'TEAM' ? teamMin : 1,
          team_max_members: regMode === 'TEAM' ? teamMax : 1,
          registration_open_at: new Date(regOpen).toISOString(),
          registration_close_at: new Date(regClose).toISOString(),
          submission_close_at: new Date(subClose).toISOString(),
          announced_at: announced ? new Date(announced).toISOString() : null,
          created_by: user.id,
          status: 'DRAFT',
        })
        .select()
        .single();

      if (eventErr) throw eventErr;

      // 2. Insert criteria
      if (criteria.length > 0) {
        await supabase.from('scoring_criteria').insert(
          criteria.map((c, i) => ({
            event_id: event.id,
            name: c.name,
            description: c.description || null,
            weight: Number(c.weight),
            min_score: c.min_score,
            max_score: c.max_score,
            display_order: i,
          }))
        );
      }

      // 3. Invite judges (email-based, best-effort)
      const emails = judgeEmails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter(Boolean);

      for (const email of emails) {
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingUser) {
          // Assign judge role & to event
          const { data: judgeRole } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'JUDGE')
            .single();

          if (judgeRole) {
            await supabase
              .from('user_roles')
              .upsert({ user_id: existingUser.id, role_id: judgeRole.id });

            await supabase
              .from('event_judges')
              .upsert({ event_id: event.id, judge_id: existingUser.id });
          }
        }
        // Note: for new judges, admin should use the invite flow separately
      }

      toast({ type: 'success', title: 'Event berhasil dibuat!', message: 'Event disimpan sebagai Draft.' });
      router.push(`/admin/events/${event.id}`);
    } catch (err: unknown) {
      console.error('Error creating event:', err);
      let errMsg = 'Terjadi kesalahan. Coba lagi.';
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errMsg = String((err as { message: unknown }).message);
      }
      toast({ type: 'error', title: 'Gagal membuat event', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
          Buat Event Baru
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Ikuti langkah-langkah berikut untuk membuat kompetisi baru.</p>
      </motion.div>

      {/* Steps Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-0 overflow-x-auto pb-2"
      >
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <button
                onClick={() => done && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : done
                    ? 'text-teal-400 cursor-pointer'
                    : 'text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    active ? 'bg-blue-600 text-white' : done ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {done ? <Check size={11} /> : <Icon size={11} />}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${done ? 'bg-teal-600' : 'bg-slate-700'}`} />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            {/* Step 1: Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Informasi Event
                </h2>
                <Input
                  label="Nama Event"
                  placeholder="Contoh: Lomba Desain Web 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Textarea
                  label="Deskripsi"
                  placeholder="Jelaskan tujuan, tema, dan ketentuan umum lomba..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                />
                <Select
                  label="Kategori"
                  options={[
                    { value: 'desain', label: 'Desain' },
                    { value: 'programming', label: 'Programming' },
                    { value: 'esai', label: 'Esai & Penulisan' },
                    { value: 'inovasi', label: 'Inovasi & Riset' },
                    { value: 'lainnya', label: 'Lainnya' },
                  ]}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Pilih kategori"
                />
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">Mode Pendaftaran</p>
                  <div className="flex gap-3">
                    {(['INDIVIDUAL', 'TEAM'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setRegMode(mode)}
                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                          regMode === mode
                            ? 'border-blue-500/50 bg-blue-600/15 text-blue-300'
                            : 'border-[rgba(93,138,205,0.2)] text-slate-400 hover:border-[rgba(93,138,205,0.35)]'
                        }`}
                      >
                        {mode === 'INDIVIDUAL' ? '👤 Individual' : '👥 Tim'}
                      </button>
                    ))}
                  </div>
                </div>
                {regMode === 'TEAM' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Min. Anggota Tim"
                      type="number"
                      value={teamMin}
                      onChange={(e) => setTeamMin(Number(e.target.value))}
                      min={2}
                      max={teamMax}
                    />
                    <Input
                      label="Maks. Anggota Tim"
                      type="number"
                      value={teamMax}
                      onChange={(e) => setTeamMax(Number(e.target.value))}
                      min={teamMin}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Dates */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Pengaturan Waktu
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Pendaftaran Dibuka"
                    type="datetime-local"
                    value={regOpen}
                    onChange={(e) => setRegOpen(e.target.value)}
                    required
                  />
                  <Input
                    label="Pendaftaran Ditutup"
                    type="datetime-local"
                    value={regClose}
                    onChange={(e) => setRegClose(e.target.value)}
                    required
                  />
                  <Input
                    label="Batas Upload Karya"
                    type="datetime-local"
                    value={subClose}
                    onChange={(e) => setSubClose(e.target.value)}
                    required
                  />
                  <Input
                    label="Estimasi Pengumuman"
                    type="datetime-local"
                    value={announced}
                    onChange={(e) => setAnnounced(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Criteria */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                    Rubrik Penilaian
                  </h2>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full border ${
                    weightOk
                      ? 'bg-teal-600/15 text-teal-400 border-teal-500/30'
                      : 'bg-red-600/15 text-red-400 border-red-500/30'
                  }`}>
                    Total: {totalWeight.toFixed(0)}% {weightOk ? '✓' : '≠ 100%'}
                  </div>
                </div>

                <div className="space-y-3">
                  {criteria.map((c, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-[rgba(93,138,205,0.15)] bg-[rgba(17,34,64,0.4)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Kriteria #{i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCriteria(i)}
                          disabled={criteria.length <= 1}
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="Nama kriteria (mis. Kreativitas)"
                            value={c.name}
                            onChange={(e) => updateCriteria(i, 'name', e.target.value)}
                          />
                        </div>
                        <Input
                          placeholder="Bobot (%)"
                          type="number"
                          value={c.weight}
                          onChange={(e) => updateCriteria(i, 'weight', Number(e.target.value))}
                          min={0}
                          max={100}
                          rightAddon={<span className="text-slate-500 text-xs">%</span>}
                        />
                      </div>
                      <Textarea
                        placeholder="Deskripsi kriteria (opsional)..."
                        value={c.description}
                        onChange={(e) => updateCriteria(i, 'description', e.target.value)}
                        className="min-h-[60px]"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Nilai Min"
                          type="number"
                          value={c.min_score}
                          onChange={(e) => updateCriteria(i, 'min_score', Number(e.target.value))}
                        />
                        <Input
                          label="Nilai Maks"
                          type="number"
                          value={c.max_score}
                          onChange={(e) => updateCriteria(i, 'max_score', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={addCriteria}
                >
                  Tambah Kriteria
                </Button>

                {!weightOk && (
                  <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                    Total bobot harus tepat 100%. Sisa: {(100 - totalWeight).toFixed(0)}%
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Judges */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Undang Juri (Opsional)
                </h2>
                <p className="text-sm text-slate-400">
                  Masukkan email juri yang ingin diundang. Pisahkan dengan koma atau baris baru.
                  Juri yang belum memiliki akun harus mendaftar terlebih dahulu.
                </p>
                <Textarea
                  label="Email Juri"
                  placeholder={"juri1@email.com\njuri2@email.com"}
                  value={judgeEmails}
                  onChange={(e) => setJudgeEmails(e.target.value)}
                  className="min-h-[120px] font-mono text-xs"
                  hint="Anda juga bisa menambahkan juri nanti dari halaman detail event."
                />
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          leftIcon={<ChevronLeft size={16} />}
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Kembali
        </Button>

        {step < 4 ? (
          <Button
            rightIcon={<ChevronRight size={16} />}
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Selanjutnya
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={loading}
            leftIcon={<Check size={16} />}
          >
            Simpan & Buat Event
          </Button>
        )}
      </div>
    </div>
  );
}
