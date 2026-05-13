const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabaseClient');
const { protect, systemAdminOnly } = require('../middleware/authMiddleware');

console.log('Registrar routes loaded');

// All routes here are protected and SystemAdmin only
router.use(protect);
router.use(systemAdminOnly);

// @route   GET /api/registrars
router.get('/', async (req, res) => {
  console.log('GET /api/registrars called');
  try {
    const { data: registrars, error: regError } = await supabase
      .from('registrars').select('id, registrar_id, name, email, role, status, created_at, updated_at');
    
    const { data: admins, error: adminError } = await supabase
      .from('admins').select('id, email, role, name, created_at, updated_at');

    if (regError) throw regError;
    if (adminError) throw adminError;

    // Combine results
    const combined = [
        ...(registrars || []).map(r => ({
            ...r,
            _id: r.id, // Compatibility with frontend
            registrarId: r.registrar_id // Compatibility with frontend
        })),
        ...(admins || []).map(a => ({
            ...a,
            _id: a.id, // Compatibility with frontend
            registrarId: 'ADMIN-' + a.id.toString().substring(0, 4),
            registrar_id: 'ADMIN-' + a.id.toString().substring(0, 4),
            status: 'Active',
            createdAt: a.created_at,
            updatedAt: a.updated_at
        }))
    ];

    console.log('Found combined staff:', combined.length);
    console.log('Sample staff:', combined[0]);
    res.json(combined);
  } catch (error) {
    console.error('Error fetching registrars:', error);
    res.status(500).json({ message: 'Error fetching registrars' });
  }
});

// @route   POST /api/registrars
router.post('/', async (req, res) => {
  console.log('POST /api/registrars called with body:', req.body);
  try {
    const { name, email, password, role } = req.body;

    // Check both tables for existing email
    const { data: existingReg } = await supabase.from('registrars').select('id').eq('email', email).single();
    const { data: existingAdmin } = await supabase.from('admins').select('id').eq('email', email).single();
    
    if (existingReg || existingAdmin) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If role is System Admin or Admin, put in admins table? 
    // Actually, based on current logic, let's keep things as they are but handle both.
    // For simplicity, new staff added via this page go to 'registrars' table.
    
    const registrarId = 'REG-' + Math.floor(100000 + Math.random() * 900000);
    const { data: newRegistrar, error } = await supabase.from('registrars').insert({
      registrar_id: registrarId,
      name,
      email,
      password: hashedPassword,
      role: role || 'registrar'
    }).select('id, registrar_id, name, email, role').single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'User Created',
      type: '------',
      status: 'Successful',
      details: `Created new staff account: ${name} (${email})`
    });

    res.status(201).json({ message: 'Staff created successfully', registrar: newRegistrar });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ message: 'Error creating staff' });
  }
});

// @route   PUT /api/registrars/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, status } = req.body;

    // Try finding in registrars first
    let { data: staff, error: fetchError } = await supabase.from('registrars').select('*').eq('id', req.params.id).single();
    let table = 'registrars';

    if (!staff) {
        // Try in admins
        const { data: admin } = await supabase.from('admins').select('*').eq('id', req.params.id).single();
        if (admin) {
            staff = admin;
            table = 'admins';
        }
    }

    if (!staff) return res.status(404).json({ message: 'User not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const { data: updated, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'User Updated',
      type: '------',
      status: 'Successful',
      details: `Updated staff: ${updated.name}`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff' });
  }
});

// @route   DELETE /api/registrars/:id
router.delete('/:id', async (req, res) => {
  try {
    let table = 'registrars';
    let { data: staff } = await supabase.from('registrars').select('*').eq('id', req.params.id).single();

    if (!staff) {
        const { data: admin } = await supabase.from('admins').select('*').eq('id', req.params.id).single();
        if (admin) {
            staff = admin;
            table = 'admins';
        }
    }

    if (!staff) return res.status(404).json({ message: 'User not found' });

    const name = staff.name;
    const { error } = await supabase.from(table).delete().eq('id', req.params.id);
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'User Deleted',
      type: '------',
      status: 'Successful',
      details: `Deleted staff account: ${name}`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;
