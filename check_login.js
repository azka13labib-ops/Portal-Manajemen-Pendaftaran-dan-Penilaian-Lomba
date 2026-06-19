const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aymjkffkwmgsbltlxsru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWprZmZrd21nc2JsdGx4c3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODkxMjcsImV4cCI6MjA5NzQ2NTEyN30.nEO1Yum1CM4QgHVY0Ioeu72IodSPd4y7NtxMtTDevVA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing admin login...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'azkalbb99@gmail.com',
    password: 'admin123'
  });

  if (loginError) {
    console.error('Admin Login Error:', loginError);
  } else {
    console.log('Admin Login Succeeded:', loginData.user.email);
  }
}

run();
