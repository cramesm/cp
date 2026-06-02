const Alumni = require('../models/Users/Alumni');
const mongoose = require('mongoose');

const AlumniController = {
    // Get all alumni
    getAllAlumni: async (req, res) => {
        try {
            // Find all alumni, sorted by newest first
            const alumni = await Alumni.find().sort({ createdAt: -1 });
            res.status(200).json(alumni);
        } catch (error) {
            console.error('Error fetching alumni:', error);
            res.status(500).json({ message: 'Failed to fetch alumni', error: error.message });
        }
    },

    // Add a new alumni
    addAlumni: async (req, res) => {
        try {
            const { firstName, lastName, email, password } = req.body;

            // Validate required fields
            if (!firstName || !lastName || !email || !password) {
                return res.status(400).json({ message: 'Please provide all required fields (firstName, lastName, email, password)' });
            }

            // Check if alumni with email already exists
            const existingAlumni = await Alumni.findOne({ email });
            if (existingAlumni) {
                return res.status(400).json({ message: 'A user with this email already exists' });
            }

            const studentId = `ALU-${Date.now().toString().slice(-6)}`;

            const newAlumni = new Alumni({
                firstName,
                lastName,
                email,
                password,
                studentId,
                role: 'alumni'
            });

            await newAlumni.save();

            // Omit password from response
            const alumniResponse = newAlumni.toObject();
            delete alumniResponse.password;

            res.status(201).json({ message: 'Alumni successfully added', alumni: alumniResponse });
        } catch (error) {
            console.error('Error adding alumni:', error);
            res.status(500).json({ message: 'Failed to add alumni', error: error.message });
        }
    },

    // Delete an alumni by ID
    deleteAlumni: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid alumni ID' });
            }

            const deletedAlumni = await Alumni.findByIdAndDelete(id);

            if (!deletedAlumni) {
                return res.status(404).json({ message: 'Alumni not found' });
            }

            res.status(200).json({ message: 'Alumni successfully deleted', alumni: deletedAlumni });
        } catch (error) {
            console.error('Error deleting alumni:', error);
            res.status(500).json({ message: 'Failed to delete alumni', error: error.message });
        }
    },

    // Update alumni status
    updateAlumniStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid alumni ID' });
            }

            if (!['Active', 'Inactive'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }

            const updatedAlumni = await Alumni.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );

            if (!updatedAlumni) {
                return res.status(404).json({ message: 'Alumni not found' });
            }

            res.status(200).json({ message: 'Alumni status updated successfully', alumni: updatedAlumni });
        } catch (error) {
            console.error('Error updating alumni status:', error);
            res.status(500).json({ message: 'Failed to update alumni status', error: error.message });
        }
    }
};

module.exports = AlumniController;
