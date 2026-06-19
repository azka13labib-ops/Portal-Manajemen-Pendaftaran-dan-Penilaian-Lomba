'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const redirect = searchParams.get('redirect') ?? '/participant';

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format email tidak valid';
    if (!password) errs.password = 'Password wajib diisi';
    else if (password.length < 6) errs.password = 'Password minimal 6 karakter';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast({
        type: 'error',
        title: 'Login Gagal',
        message: error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : error.message,
      });
      return;
    }

    // Fetch ALL roles to redirect appropriately (user may have multiple roles)
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', data.user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleNames: string[] = (rolesData ?? []).map((r: any) => r.roles?.name).filter(Boolean);
    let roleName = 'PARTICIPANT';
    if (roleNames.includes('ADMIN')) roleName = 'ADMIN';
    else if (roleNames.includes('JUDGE')) roleName = 'JUDGE';

    toast({ type: 'success', title: 'Selamat datang kembali!' });

    if (roleName === 'ADMIN') router.push('/admin');
    else if (roleName === 'JUDGE') router.push('/judge');
    else router.push(redirect.startsWith('/') ? redirect : '/participant');

    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-teal-600/6 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_32px_rgba(37,99,235,0.5)] mb-4">
            <Trophy size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Portal Lomba
          </h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Manajemen Kompetisi</p>
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          <h2 className="text-lg font-semibold text-slate-100 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Masuk ke Akun
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Daftar sekarang
            </Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              id="login-email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftAddon={<Mail size={16} />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              autoComplete="current-password"
              required
            />

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                Lupa password?
              </Link>
            </div>

            <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
              Masuk
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
        <div className="text-slate-400">Memuat...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
