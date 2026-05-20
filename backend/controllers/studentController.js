const Student = require('../models/Users/Student');
const mongoose = require('mongoose');

const StudentController = {
    // Get all students
    getAllStudents: async (req, res) => {
        try {
            // Find all students, sorted by newest first
            const students = await Student.find().sort({ createdAt: -1 });
            res.status(200).json(students);
        } catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({ message: 'Failed to fetch students', error: error.message });
        }
    },

    // Add a new student
    addStudent: async (req, res) => {
        try {
            const { firstName, lastName, email, password } = req.body;

            // Validate required fields
            if (!firstName || !lastName || !email || !password) {
                return res.status(400).json({ message: 'Please provide all required fields (firstName, lastName, email, password)' });
            }

            // Check if student with email already exists
            const existingStudent = await Student.findOne({ email });
            if (existingStudent) {
                return res.status(400).json({ message: 'A user with this email already exists' });
            }

            // Generate a random studentId if not provided (optional, since it's unique in schema we should probably create one if it's not typed, but let's leave it blank or generate a random one to avoid unique constraints if missing. Or we can just let schema handle it if it's not strictly required in req body)
            // The Student schema has studentId as unique, so we should generate a placeholder one if empty, or just omit it if it's not required. Wait, unique: true means nulls can cause issues if there are multiple nulls.
            const studentId = `STU-${Date.now().toString().slice(-6)}`;

            const newStudent = new Student({
                firstName,
                lastName,
                email,
                password,
                studentId,
                role: 'student'
            });

            await newStudent.save();

            // Omit password from response
            const studentResponse = newStudent.toObject();
            delete studentResponse.password;

            res.status(201).json({ message: 'Student successfully added', student: studentResponse });
        } catch (error) {
            console.error('Error adding student:', error);
            res.status(500).json({ message: 'Failed to add student', error: error.message });
        }
    },

    // Delete a student by ID
    deleteStudent: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid student ID' });
            }

            const deletedStudent = await Student.findByIdAndDelete(id);

            if (!deletedStudent) {
                return res.status(404).json({ message: 'Student not found' });
            }

            res.status(200).json({ message: 'Student successfully deleted', student: deletedStudent });
        } catch (error) {
            console.error('Error deleting student:', error);
            res.status(500).json({ message: 'Failed to delete student', error: error.message });
        }
    }
};

module.exports = StudentController;
