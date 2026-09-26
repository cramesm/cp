const express = require('express');
const router = express.Router();
const AlumniController = require('../controllers/alumniController');
const { auth, canManageUsers } = require('../middleware/authMiddleware');

// Route to get all alumni (Super Admin & IT Admin)
router.get('/', auth, canManageUsers, AlumniController.getAllAlumni);

// Route to add a new alumni (Super Admin & IT Admin)
router.post('/', auth, canManageUsers, AlumniController.addAlumni);

// Route to delete an alumni (Super Admin & IT Admin)
router.delete('/:id', auth, canManageUsers, AlumniController.deleteAlumni);

// Route to update alumni status (Super Admin & IT Admin)
router.put('/:id/status', auth, canManageUsers, AlumniController.updateAlumniStatus);

// Route for an alumni to update their own profile (Ownership check inside controller)
router.put('/:id/profile', auth, AlumniController.updateAlumniProfile);

module.exports = router;
