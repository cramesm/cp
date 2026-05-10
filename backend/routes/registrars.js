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
    const { data: registrars, error } = await supabase
      .from('registrars').select('id, registrar_id, name, email, role, status, created_at, updated_at');
    if (error) throw error;
    console.log('Found registrars:', (registrars || []).length);
    res.json(registrars || []);
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

    const { data: existingRegistrar } = await supabase
      .from('registrars').select('id').eq('email', email).single();
    if (existingRegistrar) {
      console.log('Registrar already exists:', email);
      return res.status(400).json({ message: 'Registrar with this email already exists' });
    }

    const registrarId = 'REG-' + Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newRegistrar, error } = await supabase.from('registrars').insert({
      registrar_id: registrarId,
      name,
      email,
      password: hashedPassword,
      role: role || 'Registrar Staff'
    }).select('id, registrar_id, name, email, role').single();

    if (error) throw error;
    console.log('New registrar created:', newRegistrar.registrar_id);

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'User Created',
      type: '------',
      status: 'Successful',
      details: `Created new registrar account: ${name} (${email})`
    });

    res.status(201).json({ message: 'Registrar created successfully', registrar: newRegistrar });
  } catch (error) {
    console.error('Error creating registrar:', error);
    res.status(500).json({ message: 'Error creating registrar' });
  }
});

// @route   PUT /api/registrars/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, status } = req.body;

    // Try by id first, then by registrar_id
    let { data: registrar } = await supabase
      .from('registrars').select('*').eq('id', req.params.id).single();
    if (!registrar) {
      const { data: regById } = await supabase
        .from('registrars').select('*').eq('registrar_id', req.params.id).single();
      registrar = regById;
    }
    if (!registrar) return res.status(404).json({ message: 'Registrar not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const { data: updated, error } = await supabase
      .from('registrars').update(updateData).eq('id', registrar.id).select().single();
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'User Updated',
      type: '------',
      status: 'Successful',
      details: `Updated registrar: ${updated.name}`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating registrar' });
  }
});

// @route   DELETE /api/registrars/:id
router.delete('/:id', async (req, res) => {
  try {
    let { data: registrarToDelete } = await supabase
      .from('registrars').select('*').eq('id', req.params.id).single();
    if (!registrarToDelete) {
      const { data: regById } = await supabase
        .from('registrars').select('*').eq('registrar_id', req.params.id).single();
      registrarToDelete = regById;
    }
    if (!registrarToDelete) return res.status(404).json({ message: 'Registrar not found' });

    const name = registrarToDelete.name;
    const { error } = await supabase.from('registrars').delete().eq('id', registrarToDelete.id);
    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_email: req.user.email,
      user_name: req.user.name || 'System Admin',
      action: 'User Deleted',
      type: '------',
      status: 'Successful',
      details: `Deleted registrar account: ${name}`
    });

    res.json({ message: 'Registrar deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting registrar' });
  }
});

module.exports = router;
