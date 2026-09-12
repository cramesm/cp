const express = require('express');
const router = express.Router();
const AlumniController = require('../controllers/alumniController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

// Route to get all alumni (Super Admin only)
router.get('/', auth, superAdminOnly, AlumniController.getAllAlumni);

// Route to add a new alumni (Super Admin only)
router.post('/', auth, superAdminOnly, AlumniController.addAlumni);

// Route to delete an alumni (Super Admin only)
router.delete('/:id', auth, superAdminOnly, AlumniController.deleteAlumni);

// Route to update alumni status (Super Admin only)
router.put('/:id/status', auth, superAdminOnly, AlumniController.updateAlumniStatus);

// Route for an alumni to update their own profile (Ownership check inside controller)
router.put('/:id/profile', auth, AlumniController.updateAlumniProfile);

module.exports = router;
