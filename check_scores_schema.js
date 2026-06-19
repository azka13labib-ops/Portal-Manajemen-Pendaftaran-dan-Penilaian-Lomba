const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aymjkffkwmgsbltlxsru.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWprZmZrd21nc2JsdGx4c3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4OTEyNywiZXhwIjoyMDk3NDY1MTI3fQ.hLBbzLqgnAlIajamBNJVqy6w8DmuTcuvbk4rlr0oh1M';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: columns, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, column_default, is_nullable')
    .eq('table_name', 'scores');
    
  console.log('Columns of scores table:', columns);
  console.log('Error:', error);
}

run();
