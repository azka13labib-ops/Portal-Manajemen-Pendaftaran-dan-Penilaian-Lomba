const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aymjkffkwmgsbltlxsru.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWprZmZrd21nc2JsdGx4c3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4OTEyNywiZXhwIjoyMDk3NDY1MTI3fQ.hLBbzLqgnAlIajamBNJVqy6w8DmuTcuvbk4rlr0oh1M';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase.rpc('query_rls_policies', { table_name: 'submissions' });
  
  if (error) {
    // Check if RLS is enabled on submissions
    const { data: tables, error: err2 } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'submissions');
    
    // We can just use raw SQL via a dummy function if we have one, or just check the setup.sql
    console.log('Error calling rpc:', error.message);
  } else {
    console.log(data);
  }
}

run();
