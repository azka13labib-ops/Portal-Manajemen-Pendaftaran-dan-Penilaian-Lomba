const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aymjkffkwmgsbltlxsru.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWprZmZrd21nc2JsdGx4c3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4OTEyNywiZXhwIjoyMDk3NDY1MTI3fQ.hLBbzLqgnAlIajamBNJVqy6w8DmuTcuvbk4rlr0oh1M';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const eventId = '1991709d-6692-4d82-82ef-5699de3d2b8d';

  const { data: assignments, error } = await supabase
    .from('judging_assignments')
    .select(`
      id,
      assigned_at,
      submissions (
        id,
        file_url,
        file_name,
        external_link,
        description,
        registrations (
          id,
          user_id,
          users (full_name, email),
          teams (name)
        )
      ),
      scores (
        id,
        status,
        raw_score
      )
    `)
    .eq('event_id', eventId);

  console.log('Result:', JSON.stringify(assignments, null, 2));
  console.log('Error:', error);
}

run();
