require('dotenv').config();
const supabase = require('../supabaseClient');

async function fixRoles() {
    console.log('Standardizing roles...');

    // 1. Update System Admins
    const { error: err1 } = await supabase
        .from('system_admins')
        .update({ role: 'system admin' })
        .not('role', 'eq', 'system admin');
    
    if (err1) console.error('Error updating system_admins:', err1);
    else console.log('System Admin roles standardized.');

    // 2. Update Admins (Registrars)
    // We update any variant (Admin, Registrar Staff, etc.) to 'registrar'
    const { error: err2 } = await supabase
        .from('admins')
        .update({ role: 'registrar' })
        .not('role', 'eq', 'registrar');

    if (err2) console.error('Error updating admins:', err2);
    else console.log('Admin roles standardized to "registrar".');

    // 3. Update Registrars table (if used)
    const { error: err3 } = await supabase
        .from('registrars')
        .update({ role: 'registrar' })
        .not('role', 'eq', 'registrar');

    if (err3) console.error('Error updating registrars:', err3);
    else console.log('Registrar roles standardized.');

    console.log('Migration complete.');
}

fixRoles();
