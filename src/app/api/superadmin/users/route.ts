import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

async function checkSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('is_superadmin').eq('id', user.id).single();
  return profile?.is_superadmin ? user : null;
}

export async function GET() {
  const user = await checkSuperAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const supabase = createServiceClient();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, institution, created_at, is_superadmin, user_roles(roles(name))')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const user = await checkSuperAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { userId, roleName } = await request.json();
  if (!userId || !roleName) return NextResponse.json({ error: 'userId and roleName required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: role } = await supabase.from('roles').select('id').eq('name', roleName).single();
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  // Remove all existing roles, then assign the new one
  await supabase.from('user_roles').delete().eq('user_id', userId);
  const { error } = await supabase.from('user_roles').insert({ user_id: userId, role_id: role.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await checkSuperAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
