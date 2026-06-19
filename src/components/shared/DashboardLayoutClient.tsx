'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/shared/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { UserRole } from '@/types';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  userEmail: string;
}

export function DashboardLayoutClient({
  children,
  role,
  userName,
  userEmail,
}: DashboardLayoutClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ type: 'success', title: 'Berhasil keluar', message: 'Sampai jumpa kembali!' });
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-mesh">
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Mobile top padding */}
        <div className="h-14 lg:h-0 shrink-0" />

        {/* Page Content with Page Transition */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
