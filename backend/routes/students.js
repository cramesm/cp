const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { auth, canManageUsers } = require('../middleware/authMiddleware');

// Route to get all students (Super Admin & IT Admin)
router.get('/', auth, canManageUsers, StudentController.getAllStudents);

// Route to add a new student (Super Admin & IT Admin)
router.post('/', auth, canManageUsers, StudentController.addStudent);

// Route to delete a student (Super Admin & IT Admin)
router.delete('/:id', auth, canManageUsers, StudentController.deleteStudent);

// Route to update student status (Super Admin & IT Admin)
router.put('/:id/status', auth, canManageUsers, StudentController.updateStudentStatus);

// Route for a student to update their own profile (Ownership check inside controller)
router.put('/:id/profile', auth, StudentController.updateStudentProfile);

module.exports = router;
