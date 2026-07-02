/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Shield, Check, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentEmail: string;
}

export function SettingsModal({ isOpen, onClose, currentName, currentEmail }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile State
  const [fullName, setFullName] = useState(currentName);
  
  // Account State
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setFullName(currentName);
      setEmail(currentEmail);
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setActiveTab('profile');
    }
  }, [isOpen, currentName, currentEmail]);

  const verifyPassword = async () => {
    if (!currentPassword) {
      throw new Error('Masukkan password saat ini untuk menyimpan perubahan');
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (error) {
      throw new Error('Password saat ini salah');
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast({ type: 'error', title: 'Nama harus diisi' });
      return;
    }
    
    setIsLoading(true);
    try {
      await verifyPassword();
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Gagal memuat sesi pengguna');

      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({ type: 'success', title: 'Profil diperbarui', message: 'Silakan muat ulang halaman untuk melihat perubahan' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      toast({ type: 'error', title: 'Gagal memperbarui profil', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    setIsLoading(true);
    try {
      await verifyPassword();

      const updates: { email?: string; password?: string } = {};
      
      if (email.trim() && email.trim() !== currentEmail) {
        updates.email = email.trim();
      }
      
      if (password) {
        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter');
        }
        if (password !== confirmPassword) {
          throw new Error('Password tidak cocok');
        }
        updates.password = password;
      }
      
      if (Object.keys(updates).length === 0) {
        toast({ type: 'info', title: 'Tidak ada perubahan', message: 'Anda tidak melakukan perubahan apa pun' });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;
      
      if (updates.email) {
        toast({ 
          type: 'success', 
          title: 'Periksa Email Anda', 
          message: 'Tautan konfirmasi telah dikirim ke email baru dan lama Anda.' 
        });
      } else {
        toast({ type: 'success', title: 'Akun diperbarui', message: 'Password berhasil diubah.' });
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      toast({ type: 'error', title: 'Gagal memperbarui akun', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Akun" size="md">
      <div className="flex flex-col h-[500px] overflow-hidden -mx-6 -mb-6 mt-4 border-t border-[rgba(244,239,227,0.07)]">
        {/* Tabs */}
        <div className="flex border-b border-[rgba(244,239,227,0.07)] px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'profile' 
                ? "border-[#D8B26B] text-[#D8B26B]" 
                : "border-transparent text-[#9CA8BD] hover:text-[#F4EFE3] hover:border-[rgba(244,239,227,0.2)]"
            )}
          >
            <User size={16} className="inline mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'account' 
                ? "border-[#D8B26B] text-[#D8B26B]" 
                : "border-transparent text-[#9CA8BD] hover:text-[#F4EFE3] hover:border-[rgba(244,239,227,0.2)]"
            )}
          >
            <Shield size={16} className="inline mr-2" />
            Keamanan
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[#F4EFE3] mb-1">Informasi Dasar</h3>
                  <p className="text-xs text-[#9CA8BD] mb-4">Perbarui informasi profil Anda yang akan dilihat oleh pengguna lain.</p>
                  
                  <Input
                    label="Nama Lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftAddon={<User size={16} />}
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>
                
                <div className="pt-2 border-t border-[rgba(244,239,227,0.07)]">
                  <Input
                    label="Password Saat Ini (Diperlukan)"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    leftAddon={<Lock size={16} />}
                    placeholder="Masukkan password Anda untuk verifikasi"
                  />
                </div>
                
                <div className="pt-2 flex justify-end">
                  <Button 
                    variant="primary" 
                    onClick={handleUpdateProfile} 
                    loading={isLoading}
                    leftIcon={<Check size={16} />}
                  >
                    Simpan Profil
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-lg bg-[rgba(217,140,140,0.05)] border border-[rgba(217,140,140,0.2)] flex items-start gap-3">
                  <AlertTriangle size={18} className="text-[#D98C8C] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#9CA8BD] leading-relaxed">
                    <strong className="text-[#F4EFE3] block mb-1">Mengubah Email</strong>
                    Jika Anda mengubah email, kami akan mengirimkan tautan konfirmasi ke alamat email baru Anda. Email tidak akan berubah sampai Anda mengkliknya.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Alamat Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftAddon={<Mail size={16} />}
                    placeholder="nama@email.com"
                  />
                  
                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Ubah Password</h4>
                    <div className="space-y-4">
                      <Input
                        label="Password Baru"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftAddon={<Lock size={16} />}
                        placeholder="Biarkan kosong jika tidak ingin mengubah"
                      />
                      <Input
                        label="Konfirmasi Password Baru"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        leftAddon={<Lock size={16} />}
                        placeholder="Ketik ulang password baru"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[rgba(244,239,227,0.07)]">
                  <Input
                    label="Password Saat Ini (Diperlukan)"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    leftAddon={<Lock size={16} />}
                    placeholder="Masukkan password Anda untuk verifikasi"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    variant="primary" 
                    onClick={handleUpdateAccount} 
                    loading={isLoading}
                    leftIcon={<Check size={16} />}
                  >
                    Simpan Keamanan
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
