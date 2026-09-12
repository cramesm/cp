const SuperAdmin = require('../models/Users/SuperAdmin');
const Registrar = require('../models/Registrar');

/**
 * Seed initial administrative and registrar accounts if they do not exist
 */
async function seedUsers() {
  try {
    // 1. Seed Super Admin
    const existingSuperAdmin = await SuperAdmin.findOne({ email: 'sysadmin@verifitor.com' });
    if (!existingSuperAdmin) {
      await SuperAdmin.create({
        email: 'sysadmin@verifitor.com',
        password: process.env.DEFAULT_SUPER_ADMIN_PASSWORD || 'sysadmin123',
        role: 'super admin',
        name: 'Super Admin'
      });
      console.log('Default Super Admin created (sysadmin@verifitor.com).');
    }

    // 2. Seed Standard Registrars
    const registrarsToSeed = [
      { email: 'admin@verifitor.com', password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', name: 'Admin', registrarId: 'REG-001' },
      { email: 'saetsmurf1@gmail.com', password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', name: 'Primary Admin', registrarId: 'REG-002' }
    ];

    for (const reg of registrarsToSeed) {
      const existingReg = await Registrar.findOne({ email: reg.email });
      if (!existingReg) {
        await Registrar.create({
          email: reg.email,
          password: reg.password,
          role: 'registrar',
          name: reg.name,
          registrarId: reg.registrarId
        });
        console.log(`Default Registrar created (${reg.email}).`);
      }
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

module.exports = seedUsers;
