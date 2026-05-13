const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  console.log('--- Students ---');
  const { data: students, error: sError } = await supabase.from('students').select('email, role, first_name, last_name');
  if (sError) console.error(sError);
  else console.table(students);

  console.log('--- System Admins ---');
  const { data: sysAdmins, error: saError } = await supabase.from('system_admins').select('email, role');
  if (saError) console.error(saError);
  else console.table(sysAdmins);

  console.log('--- Registrars (Admins) ---');
  const { data: admins, error: aError } = await supabase.from('admins').select('email, role');
  if (aError) console.error(aError);
  else console.table(admins);
}

checkUsers();
