const express = require('express');
const router = express.Router();
const AlumniController = require('../controllers/alumniController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

// Route to get all alumni (Super Admin only)
router.get('/', protect, superAdminOnly, AlumniController.getAllAlumni);

// Route to add a new alumni (Super Admin only)
router.post('/', protect, superAdminOnly, AlumniController.addAlumni);

// Route to delete an alumni (Super Admin only)
router.delete('/:id', protect, superAdminOnly, AlumniController.deleteAlumni);

// Route to update alumni status (Super Admin only)
router.put('/:id/status', protect, superAdminOnly, AlumniController.updateAlumniStatus);

module.exports = router;
