const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple .env.local parser
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'velamian8@gmail.com',
    password: 'azka123456',
  });

  if (authError) {
    console.log('Login failed:', authError);
    return;
  }

  console.log('Logged in as Judge. User ID:', authData.user.id);

  const eventId = '1991709d-6692-4d82-82ef-5699de3d2b8d';

  const { data: assignments, error } = await supabase
    .from('judging_assignments')
    .select(`
      id,
      submissions (
        id,
        file_name
      )
    `)
    .eq('event_id', eventId)
    .eq('judge_id', authData.user.id);

  console.log('Assignments fetched by Judge:', JSON.stringify(assignments, null, 2));
  console.log('Error:', error);
}

run();
