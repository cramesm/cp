const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

// Route to get all students (Super Admin only)
router.get('/', protect, superAdminOnly, StudentController.getAllStudents);

// Route to add a new student (Super Admin only)
router.post('/', protect, superAdminOnly, StudentController.addStudent);

// Route to delete a student (Super Admin only)
router.delete('/:id', protect, superAdminOnly, StudentController.deleteStudent);

module.exports = router;
