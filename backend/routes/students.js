const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { auth, superAdminOnly } = require('../middleware/authMiddleware');

// Route to get all students (Super Admin only)
router.get('/', auth, superAdminOnly, StudentController.getAllStudents);

// Route to add a new student (Super Admin only)
router.post('/', auth, superAdminOnly, StudentController.addStudent);

// Route to delete a student (Super Admin only)
router.delete('/:id', auth, superAdminOnly, StudentController.deleteStudent);

// Route to update student status (Super Admin only)
router.put('/:id/status', auth, superAdminOnly, StudentController.updateStudentStatus);

// Route for a student to update their own profile (Ownership check inside controller)
router.put('/:id/profile', auth, StudentController.updateStudentProfile);

module.exports = router;
