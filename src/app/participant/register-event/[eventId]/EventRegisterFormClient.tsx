/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Upload, Plus, Trash2, User, Users, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface EventRegisterFormClientProps {
  event: any;
  userId: string;
}

export function EventRegisterFormClient({
  event,
  userId,
}: EventRegisterFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  
  // File Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  
  // Team states
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);

  const handleAddMemberField = () => {
    if (memberEmails.length >= event.team_max_members - 1) {
      toast({
        type: 'warning',
        title: 'Batas Anggota Tercapai',
        message: `Maksimal anggota tim untuk event ini adalah ${event.team_max_members} orang (termasuk Anda).`,
      });
      return;
    }
    setMemberEmails([...memberEmails, '']);
  };

  const handleRemoveMemberField = (idx: number) => {
    setMemberEmails(memberEmails.filter((_, i) => i !== idx));
  };

  const handleMemberEmailChange = (idx: number, val: string) => {
    setMemberEmails(
      memberEmails.map((email, i) => (i === idx ? val : email))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        type: 'error',
        title: 'File Terlalu Besar',
        message: 'Ukuran file dokumen persyaratan maksimal adalah 5 MB.',
      });
      return;
    }
    setDocFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      toast({
        type: 'error',
        title: 'Berkas Diperlukan',
        message: 'Silakan unggah dokumen bukti mahasiswa aktif / KTM.',
      });
      return;
    }

    setLoading(true);

    try {
      let teamId: string | null = null;
      const uploadedDocs: any[] = [];

      // 1. Upload files to Storage
      const fileExt = docFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${event.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('registration-docs')
        .upload(filePath, docFile, {
          cacheControl: '3600',
          upsert: true,
        });

      // Handle bucket not created or standard upload errors
      if (uploadErr) {
        console.error('Upload error details:', uploadErr);
        // Fallback: in case storage bucket doesn't exist, we can use a dummy URL for prototype
        // but let's try to throw the error first.
        throw new Error(`Gagal mengunggah berkas: ${uploadErr.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('registration-docs')
        .getPublicUrl(filePath);

      uploadedDocs.push({
        name: docFile.name,
        url: publicUrl,
        uploaded_at: new Date().toISOString(),
      });

      // 2. Handle TEAM Registration
      if (event.registration_mode === 'TEAM') {
        if (!teamName.trim()) {
          throw new Error('Nama tim harus diisi.');
        }

        // Insert team
        const { data: teamData, error: teamErr } = await supabase
          .from('teams')
          .insert({
            event_id: event.id,
            name: teamName.trim(),
            description: teamDescription.trim() || null,
            leader_id: userId,
          })
          .select()
          .single();

        if (teamErr) throw teamErr;
        teamId = teamData.id;

        // Process team member invites
        const emails = memberEmails.map((e) => e.trim()).filter(Boolean);
        for (const email of emails) {
          // Find user by email
          const { data: memberUser, error: memberUserErr } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('email', email)
            .single();

          if (memberUserErr || !memberUser) {
            throw new Error(`Anggota dengan email "${email}" belum memiliki akun. Harap minta rekan Anda mendaftar akun terlebih dahulu di portal ini sebelum Anda mendaftarkan tim.`);
          }

          // Insert into team_members
          const { error: inviteErr } = await supabase
            .from('team_members')
            .insert({
              team_id: teamId,
              user_id: memberUser.id,
              status: 'INVITED',
            });

          if (inviteErr) throw inviteErr;
        }
      }

      // 3. Insert registration
      const { error: regErr } = await supabase
        .from('registrations')
        .upsert({
          event_id: event.id,
          user_id: userId,
          team_id: teamId,
          status: 'PENDING',
          docs_urls: uploadedDocs,
        }, { onConflict: 'event_id,user_id' });

      if (regErr) throw regErr;

      toast({
        type: 'success',
        title: 'Pendaftaran Berhasil Dikirim',
        message: 'Pendaftaran Anda sedang menunggu verifikasi oleh Admin.',
      });

      router.push('/participant');
    } catch (err) {
      toast({
        type: 'error',
        title: 'Pendaftaran Gagal',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/participant" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft size={12} /> Kembali ke Dashboard
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
          Formulir Pendaftaran Kompetisi
        </h1>
        <p className="text-xs text-slate-400">
          Mendaftar untuk event: <strong className="text-slate-200">{event.title}</strong>
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <Card className="p-5 space-y-5">
          {/* Team Registration Mode */}
          {event.registration_mode === 'TEAM' ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                <Users size={16} className="inline mr-1 mb-0.5" /> Informasi Kelompok / Tim
              </h2>
              <Input
                label="Nama Tim"
                placeholder="Masukkan nama tim Anda..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
              <Textarea
                label="Deskripsi / Tentang Tim (Opsional)"
                placeholder="Jelaskan secara singkat kompetensi atau visi tim..."
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />

              {/* Members invitations */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Undang Anggota Tim</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus size={12} />}
                    onClick={handleAddMemberField}
                  >
                    Tambah Anggota
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Masukkan email rekan Anda. Rekan tim wajib sudah memiliki akun di portal ini agar dapat diundang.
                </p>

                <div className="space-y-2">
                  {memberEmails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Email Anggota #${idx + 1}...`}
                          value={email}
                          onChange={(e) => handleMemberEmailChange(idx, e.target.value)}
                          type="email"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberField(idx)}
                        className="p-2 rounded-xl border border-slate-700 bg-slate-800/10 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all mt-6"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                <User size={16} className="inline mr-1 mb-0.5" /> Informasi Pendaftaran Individual
              </h2>
              <p className="text-xs text-slate-400">
                Pendaftaran untuk event ini bersifat individual. Data diri Anda akan diambil otomatis dari profil akun Anda.
              </p>
            </div>
          )}

          <hr className="border-slate-800" />

          {/* Documents Upload Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
              <FileText size={16} className="inline mr-1 mb-0.5" /> Bukti Administrasi / {event.required_identity_document || 'Identitas'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unggah berkas bukti peserta aktif / {event.required_identity_document || 'Kartu Identitas'} dalam format PDF atau gambar (JPG/PNG). Ukuran file maksimal adalah 5 MB.
            </p>

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/5 hover:bg-slate-800/10 hover:border-slate-500/40 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="text-xs text-slate-400">
                    {docFile ? <span className="text-blue-400 font-semibold">{docFile.name}</span> : 'Klik untuk memilih file dokumen'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">PDF, PNG, JPG (Maks. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            leftIcon={<Send size={14} />}
          >
            Kirim Pendaftaran
          </Button>
        </Card>
      </form>
    </div>
  );
}
