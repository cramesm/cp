require('dotenv').config({ path: './backend/.env' });
const supabase = require('../supabaseClient');

async function updateRoles() {
    console.log('Starting role migration (Reverting super admin to system admin)...');

    // Update system_admins
    const { data: sysAdmins, error: sysError } = await supabase
        .from('system_admins')
        .update({ role: 'system admin' })
        .eq('role', 'super admin');
    
    if (sysError) console.error('Error updating system_admins:', sysError.message);
    else console.log('system_admins updated successfully');

    // Update admins
    const { data: admins, error: adminError } = await supabase
        .from('admins')
        .update({ role: 'registrar' })
        .eq('role', 'admin'); // In case some were still 'admin'

    if (adminError) console.error('Error updating admins:', adminError.message);
    else console.log('admins updated successfully');

    // Update registrars
    const { data: regs, error: regError } = await supabase
        .from('registrars')
        .update({ role: 'registrar' })
        .or('role.eq.admin,role.eq.Registrar Staff');

    if (regError) console.error('Error updating registrars:', regError.message);
    else console.log('registrars updated successfully');

    console.log('Role migration completed.');
}

updateRoles();
