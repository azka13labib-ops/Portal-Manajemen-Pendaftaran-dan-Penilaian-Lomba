import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, institution } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, dan nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Create the user in Auth (bypassing verification)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        institution: institution?.trim() || '',
      },
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 });
    }

    // 2. Insert profile to public.users (upsert)
    const { error: profileErr } = await supabase.from('users').upsert({
      id: user.id,
      full_name: fullName.trim(),
      email: email,
      institution: institution?.trim() || null,
    });

    if (profileErr) {
      console.error('API Register - Profile upsert error:', profileErr);
    }

    // 3. Assign PARTICIPANT role
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'PARTICIPANT')
      .single();

    if (roleData) {
      await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role_id: roleData.id });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan internal';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
