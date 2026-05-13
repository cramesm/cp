require('dotenv').config();
const supabase = require('../supabaseClient');
const bcrypt = require('bcryptjs');

async function verifyUsers() {
    console.log('--- Verifying System Admins ---');
    const { data: sysAdmins } = await supabase.from('system_admins').select('email, role');
    console.log('System Admins in DB:', sysAdmins);

    console.log('\n--- Verifying Admins (Registrars) ---');
    const { data: admins } = await supabase.from('admins').select('email, role');
    console.log('Admins in DB:', admins);

    // Test a password comparison for sysadmin
    const { data: sysAdmin } = await supabase.from('system_admins').select('*').eq('email', 'sysadmin@verifitor.com').single();
    if (sysAdmin) {
        const isMatch = await bcrypt.compare('sysadmin123', sysAdmin.password);
        console.log('\nSysAdmin password check (sysadmin123):', isMatch ? '✅ MATCH' : '❌ NO MATCH');
    }

    // Test a password comparison for admin
    const { data: admin } = await supabase.from('admins').select('*').eq('email', 'admin@verifitor.com').single();
    if (admin) {
        const isMatch = await bcrypt.compare('admin123', admin.password);
        console.log('Admin password check (admin123):', isMatch ? '✅ MATCH' : '❌ NO MATCH');
    }
}

verifyUsers();
