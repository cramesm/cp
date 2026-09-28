const SuperAdmin = require('../models/Users/SuperAdmin');
const Registrar = require('../models/Registrar');
const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');

/**
 * Seed initial administrative, departmental staff, and mobile demo accounts for each role
 */
async function seedUsers() {
  try {
    // 1. Seed / Ensure Super Admin
    const superAdminData = {
      email: 'sysadmin@verifitor.com',
      password: process.env.DEFAULT_SUPER_ADMIN_PASSWORD || 'sysadmin123',
      role: 'super admin',
      name: 'Super Admin'
    };

    const existingSuperAdmin = await SuperAdmin.findOne({ email: superAdminData.email });
    if (!existingSuperAdmin) {
      await SuperAdmin.create(superAdminData);
      console.log('✓ Default Super Admin seeded: sysadmin@verifitor.com');
    }

    // 2. Departmental Staff & Admins Across the 3 Divisions
    const departmentalAccounts = [
      // --- Office of the Registrar ---
      {
        email: 'reg.admin@verifitor.com',
        password: 'registrar123',
        name: 'Dr. Maria Santos',
        role: 'Registrar Admin',
        department: 'Registrar',
        registrarId: 'REG-ADM-001',
        status: 'Active',
        mustChangePassword: false
      },
      {
        email: 'reg.staff@verifitor.com',
        password: 'registrar123',
        name: 'Juan De La Cruz',
        role: 'Registrar Staff',
        department: 'Registrar',
        registrarId: 'REG-STF-001',
        status: 'Active',
        mustChangePassword: false
      },
      {
        email: 'admin@verifitor.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        name: 'Primary Registrar Admin',
        role: 'Registrar Admin',
        department: 'Registrar',
        registrarId: 'REG-001',
        status: 'Active',
        mustChangePassword: false
      },
      {
        email: 'saetsmurf1@gmail.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        name: 'Primary Admin',
        role: 'Registrar Admin',
        department: 'Registrar',
        registrarId: 'REG-002',
        status: 'Active',
        mustChangePassword: false
      },

      // --- Accounting Department ---
      {
        email: 'acc.admin@verifitor.com',
        password: 'accounting123',
        name: 'Eleanor Reyes',
        role: 'Accounting Admin',
        department: 'Accounting',
        registrarId: 'ACC-ADM-001',
        status: 'Active',
        mustChangePassword: false
      },
      {
        email: 'acc.staff@verifitor.com',
        password: 'accounting123',
        name: 'Carlos Mendoza',
        role: 'Accounting Staff',
        department: 'Accounting',
        registrarId: 'ACC-STF-001',
        status: 'Active',
        mustChangePassword: false
      },

      // --- IT Administration Department ---
      {
        email: 'it.admin@verifitor.com',
        password: 'itadmin123',
        name: 'Mark Anthony Diaz',
        role: 'IT Administrator',
        department: 'IT Administration',
        registrarId: 'IT-ADM-001',
        status: 'Active',
        mustChangePassword: false
      }
    ];

    for (const acc of departmentalAccounts) {
      const existing = await Registrar.findOne({ email: acc.email });
      if (!existing) {
        await Registrar.create(acc);
        console.log(`✓ Seeded ${acc.role} (${acc.email})`);
      } else {
        // Ensure active status and proper role/department alignment
        let shouldSave = false;
        if (existing.status !== 'Active') {
          existing.status = 'Active';
          shouldSave = true;
        }
        if (existing.role !== acc.role) {
          existing.role = acc.role;
          shouldSave = true;
        }
        if (existing.department !== acc.department) {
          existing.department = acc.department;
          shouldSave = true;
        }
        if (existing.mustChangePassword) {
          existing.mustChangePassword = false;
          shouldSave = true;
        }
        if (shouldSave) {
          await existing.save();
          console.log(`✓ Synchronized ${acc.role} (${acc.email})`);
        }
      }
    }

    // 3. Mobile Demo Accounts (Student & Alumni)
    const existingStudent = await Student.findOne({ email: 'student@verifitor.com' });
    if (!existingStudent) {
      await Student.create({
        email: 'student@verifitor.com',
        password: 'student123',
        firstName: 'Sarah Mae',
        lastName: 'Concepcion',
        studentId: '2024-00101',
        course: 'BS Information Technology',
        yearLevel: '4th Year',
        role: 'student',
        status: 'Active'
      });
      console.log('✓ Seeded Demo Student: student@verifitor.com');
    }

    const existingAlumni = await Alumni.findOne({ email: 'alumni@verifitor.com' });
    if (!existingAlumni) {
      await Alumni.create({
        email: 'alumni@verifitor.com',
        password: 'alumni123',
        firstName: 'Roberto',
        lastName: 'Valderama',
        studentId: '2020-00888',
        course: 'BS Computer Science',
        yearLevel: 'Graduated 2024',
        role: 'alumni',
        status: 'Active'
      });
      console.log('✓ Seeded Demo Alumni: alumni@verifitor.com');
    }

  } catch (error) {
    console.error('Error seeding demo accounts:', error);
  }
}

module.exports = seedUsers;
