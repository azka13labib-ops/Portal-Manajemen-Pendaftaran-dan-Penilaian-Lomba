const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aymjkffkwmgsbltlxsru.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWprZmZrd21nc2JsdGx4c3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4OTEyNywiZXhwIjoyMDk3NDY1MTI3fQ.hLBbzLqgnAlIajamBNJVqy6w8DmuTcuvbk4rlr0oh1M';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function prepareAccount() {
  const email = 'admin.demo@example.com';
  const password = 'Password123!';
  
  // Create or update user
  const { data: userRecord, error: getErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin Demo' }
  }).catch(async () => {
    // If exists, update password
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === email);
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
      return { user: existing };
    }
  });

  const userId = userRecord?.user?.id;
  if (!userId) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === email);
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    } else {
        console.log("Could not create or find user");
        return;
    }
  }
  
  const finalUserId = userId || users.users.find(u => u.email === email).id;

  // Insert to public.users
  await supabase.from('users').upsert({ id: finalUserId, full_name: 'Admin Demo', email });
  
  // Give ADMIN and JUDGE roles
  const { data: roles } = await supabase.from('roles').select('*');
  const adminRole = roles.find(r => r.name === 'ADMIN');
  const judgeRole = roles.find(r => r.name === 'JUDGE');
  
  if (adminRole) await supabase.from('user_roles').upsert({ user_id: finalUserId, role_id: adminRole.id });
  if (judgeRole) await supabase.from('user_roles').upsert({ user_id: finalUserId, role_id: judgeRole.id });

  console.log(`Account prepared: ${email} / ${password}`);
}

prepareAccount();
