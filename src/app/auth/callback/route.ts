import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/participant';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check role and redirect accordingly
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id)
          .single();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roleName = (roleData as any)?.roles?.name ?? 'PARTICIPANT';

        if (roleName === 'ADMIN') return NextResponse.redirect(`${origin}/admin`);
        if (roleName === 'JUDGE') return NextResponse.redirect(`${origin}/judge`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
