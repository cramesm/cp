require('dotenv').config({ path: './backend/.env' });
const supabase = require('../supabaseClient');

async function checkTables() {
  try {
    const { count: sysAdminCount, error: err1 } = await supabase.from('system_admins').select('*', { count: 'exact', head: true });
    const { count: adminCount, error: err2 } = await supabase.from('admins').select('*', { count: 'exact', head: true });
    const { count: regCount, error: err3 } = await supabase.from('registrars').select('*', { count: 'exact', head: true });

    console.log('--- Database Status ---');
    console.log('System Admins:', sysAdminCount);
    console.log('Admins:', adminCount);
    console.log('Registrars:', regCount);

    if (err1) console.error('Error sys_admins:', err1);
    if (err2) console.error('Error admins:', err2);
    if (err3) console.error('Error registrars:', err3);

    const { data: adminsFull } = await supabase.from('admins').select('*');
    console.log('Admins Data:', adminsFull);

    const { data: sysAdmins } = await supabase.from('system_admins').select('*');
    console.log('System Admins Data:', sysAdmins);

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkTables();
