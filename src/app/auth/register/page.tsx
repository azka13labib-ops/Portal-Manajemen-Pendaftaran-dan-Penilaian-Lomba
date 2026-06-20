'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, User, Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface FormData {
  fullName: string;
  email: string;
  institution: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    institution: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const setField = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.fullName.trim()) errs.fullName = 'Nama lengkap wajib diisi';
    if (!form.email) errs.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Format email tidak valid';
    if (!form.password) errs.password = 'Password wajib diisi';
    else if (form.password.length < 8) errs.password = 'Password minimal 8 karakter';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Password tidak cocok';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          institution: form.institution,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat registrasi.');
      }

      toast({
        type: 'success',
        title: 'Registrasi Berhasil!',
        message: 'Akun Anda telah aktif dan dapat langsung digunakan untuk masuk.',
      });
      router.push('/auth/login');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat registrasi.';
      toast({ type: 'error', title: 'Registrasi Gagal', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 py-10">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-teal-600/6 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="w-full max-w-[440px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_32px_rgba(37,99,235,0.5)] mb-4">
            <Trophy size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Buat Akun
          </h1>
          <p className="text-sm text-slate-400 mt-1">Daftar sebagai peserta lomba</p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          <p className="text-sm text-slate-400 mb-6">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Masuk di sini
            </Link>
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nama Lengkap"
              type="text"
              id="reg-fullname"
              placeholder="Nama sesuai KTP / KTM"
              value={form.fullName}
              onChange={setField('fullName')}
              error={errors.fullName}
              leftAddon={<User size={16} />}
              required
            />

            <Input
              label="Email"
              type="email"
              id="reg-email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={setField('email')}
              error={errors.email}
              leftAddon={<Mail size={16} />}
              autoComplete="email"
              required
            />

            <Input
              label="Instansi / Universitas"
              type="text"
              id="reg-institution"
              placeholder="Nama universitas atau instansi"
              value={form.institution}
              onChange={setField('institution')}
              leftAddon={<Building2 size={16} />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="reg-password"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={setField('password')}
              error={errors.password}
              leftAddon={<Lock size={16} />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="new-password"
              required
            />

            <Input
              label="Konfirmasi Password"
              type={showPassword ? 'text' : 'password'}
              id="reg-confirm-password"
              placeholder="Ulangi password"
              value={form.confirmPassword}
              onChange={setField('confirmPassword')}
              error={errors.confirmPassword}
              leftAddon={<Lock size={16} />}
              autoComplete="new-password"
              required
            />

            <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
              Daftar Sekarang
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 Portal Lomba. Platform Kompetisi Profesional.
        </p>
      </motion.div>
    </div>
  );
}
