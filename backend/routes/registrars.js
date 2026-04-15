const express = require('express');
const router = express.Router();
const Registrar = require('../models/Registrar');
const ActivityLog = require('../models/ActivityLog');
const { protect, systemAdminOnly } = require('../middleware/authMiddleware');

console.log('Registrar routes loaded');

// All routes here are protected and SystemAdmin only
router.use(protect);
router.use(systemAdminOnly);

// @route   GET /api/registrars
// @desc    Get all registrars
router.get('/', async (req, res) => {
  console.log('GET /api/registrars called');
  try {
    const registrars = await Registrar.find().select('-password');
    console.log('Found registrars:', registrars.length);
    res.json(registrars);
  } catch (error) {
    console.error('Error fetching registrars:', error);
    res.status(500).json({ message: 'Error fetching registrars' });
  }
});

// @route   POST /api/registrars
// @desc    Create a new registrar
router.post('/', async (req, res) => {
  console.log('POST /api/registrars called with body:', req.body);
  try {
    const { name, email, password, role } = req.body;

    // Check if registrar already exists
    const existingRegistrar = await Registrar.findOne({ email });
    if (existingRegistrar) {
      console.log('Registrar already exists:', email);
      return res.status(400).json({ message: 'Registrar with this email already exists' });
    }

    // Generate registrar ID
    const registrarId = 'REG-' + Math.floor(100000 + Math.random() * 900000);

    const newRegistrar = new Registrar({
      registrarId,
      name,
      email,
      password,
      role: role || 'Registrar Staff'
    });

    await newRegistrar.save();
    console.log('New registrar created:', newRegistrar.registrarId);

    // Log the action
    const log = new ActivityLog({
      userEmail: req.user.email,
      userName: req.user.name || 'System Admin',
      action: 'User Created',
      type: '------',
      status: 'Successful',
      details: `Created new registrar account: ${name} (${email})`
    });
    await log.save();

    res.status(201).json({
      message: 'Registrar created successfully',
      registrar: {
        id: newRegistrar._id,
        registrarId: newRegistrar.registrarId,
        name: newRegistrar.name,
        email: newRegistrar.email,
        role: newRegistrar.role
      }
    });
  } catch (error) {
    console.error('Error creating registrar:', error);
    res.status(500).json({ message: 'Error creating registrar' });
  }
});

// @route   PUT /api/registrars/:id
// @desc    Update a registrar
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, status } = req.body;

    // Try to find by _id first, then by registrarId
    let registrar = await Registrar.findById(req.params.id);
    if (!registrar) {
      registrar = await Registrar.findOne({ registrarId: req.params.id });
    }

    if (!registrar) {
      return res.status(404).json({ message: 'Registrar not found' });
    }

    // Update the registrar
    registrar.name = name || registrar.name;
    registrar.email = email || registrar.email;
    registrar.role = role || registrar.role;
    if (status) registrar.status = status;

    await registrar.save();

    // Log the action
    const log = new ActivityLog({
      userEmail: req.user.email,
      userName: req.user.name || 'System Admin',
      action: 'User Updated',
      type: '------',
      status: 'Successful',
      details: `Updated registrar: ${registrar.name}`
    });
    await log.save();

    res.json(registrar);
  } catch (error) {
    res.status(500).json({ message: 'Error updating registrar' });
  }
});

// @route   DELETE /api/registrars/:id
// @desc    Delete a registrar
router.delete('/:id', async (req, res) => {
  try {
    // Try to find by _id first, then by registrarId
    let registrarToDelete = await Registrar.findById(req.params.id);
    if (!registrarToDelete) {
      registrarToDelete = await Registrar.findOne({ registrarId: req.params.id });
    }

    if (!registrarToDelete) {
      return res.status(404).json({ message: 'Registrar not found' });
    }

    const name = registrarToDelete.name;
    await Registrar.findByIdAndDelete(registrarToDelete._id);

    // Log the action
    const log = new ActivityLog({
      userEmail: req.user.email,
      userName: req.user.name || 'System Admin',
      action: 'User Deleted',
      type: '------',
      status: 'Successful',
      details: `Deleted registrar account: ${name}`
    });
    await log.save();

    res.json({ message: 'Registrar deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting registrar' });
  }
});

module.exports = router;
