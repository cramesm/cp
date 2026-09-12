const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const TOR = require('../models/TOR');
const ActivityLog = require('../models/ActivityLog');

const TORController = {
  // @desc    Upload TOR CSV file and import records
  uploadCSV: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded' });
      }

      const rows = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      if (rows.length === 0) {
        return res.status(400).json({ message: 'CSV contains no records' });
      }

      const studentId = (rows[0]['Student ID'] || rows[0]['studentId'] || '').trim();
      const studentName = (rows[0]['Student Name'] || rows[0]['studentName'] || '').trim();
      const course = (rows[0]['Course'] || rows[0]['course'] || '').trim();
      const yearLevel = (rows[0]['Year Level'] || rows[0]['yearLevel'] || '').trim();

      const torId = 'TOR-' + Date.now();
      const tor = await TOR.create({
        torId,
        studentId: studentId || `STU-${Date.now().toString().slice(-6)}`,
        studentName: studentName || 'Unknown Student',
        course: course || 'N/A',
        yearLevel: yearLevel || 'N/A',
        status: 'Draft',
        generatedBy: req.user?.email || 'Registrar'
      });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'CSV Import',
        type: 'Transcript of Records',
        status: 'Successful',
        details: `Imported TOR record for ${tor.studentName} (${tor.studentId})`
      });

      res.json({ message: 'TOR records imported successfully', tor });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Error importing TOR CSV:', error);
      res.status(500).json({ message: 'Error processing CSV file', error: error.message });
    }
  },

  // @desc    Get all TOR records
  getAllTOR: async (req, res) => {
    try {
      const tors = await TOR.find().sort({ createdAt: -1 });
      res.json(tors);
    } catch (error) {
      console.error('Error fetching TOR records:', error);
      res.status(500).json({ message: 'Error fetching TOR records' });
    }
  },

  // @desc    Get single TOR by torId
  getTORById: async (req, res) => {
    try {
      const tor = await TOR.findOne({ torId: req.params.id });
      if (!tor) return res.status(404).json({ message: 'TOR not found' });
      res.json(tor);
    } catch (error) {
      console.error('Error fetching TOR:', error);
      res.status(500).json({ message: 'Error fetching TOR' });
    }
  },

  // @desc    Update TOR record
  updateTOR: async (req, res) => {
    try {
      const tor = await TOR.findOne({ torId: req.params.id });
      if (!tor) return res.status(404).json({ message: 'TOR not found' });

      const { studentName, course, yearLevel, status } = req.body;
      if (studentName) tor.studentName = studentName;
      if (course) tor.course = course;
      if (yearLevel !== undefined) tor.yearLevel = yearLevel;
      if (status) tor.status = status;

      const updated = await tor.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Edit TOR',
        type: 'Transcript of Records',
        status: 'Successful',
        details: `Updated TOR for ${updated.studentName} (${updated.studentId})`
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating TOR:', error);
      res.status(500).json({ message: 'Error updating TOR' });
    }
  },

  // @desc    Finalize / Generate status for TOR
  generateTOR: async (req, res) => {
    try {
      const tor = await TOR.findOne({ torId: req.params.id });
      if (!tor) return res.status(404).json({ message: 'TOR not found' });

      tor.status = 'Finalized';
      await tor.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Finalize TOR',
        type: 'Transcript of Records',
        status: 'Successful',
        details: `Finalized TOR status for ${tor.studentName} (${tor.studentId})`
      });

      res.json({ message: 'TOR finalized successfully', tor });
    } catch (error) {
      console.error('Error finalizing TOR:', error);
      res.status(500).json({ message: 'Error finalizing TOR' });
    }
  },

  // @desc    Download TOR file
  downloadTOR: async (req, res) => {
    try {
      const tor = await TOR.findOne({ torId: req.params.id });
      if (!tor) return res.status(404).json({ message: 'TOR not found' });

      if (tor.pdfPath) {
        const pdfFullPath = path.join(__dirname, '..', 'uploads', 'tor', tor.pdfPath);
        if (fs.existsSync(pdfFullPath)) {
          return res.download(pdfFullPath, `TOR-${tor.studentName}-${tor.studentId}.pdf`);
        }
      }

      res.json({ success: true, message: 'TOR record retrieved', tor });
    } catch (error) {
      console.error('Error downloading TOR:', error);
      res.status(500).json({ message: 'Error downloading TOR' });
    }
  },

  // @desc    Delete TOR record
  deleteTOR: async (req, res) => {
    try {
      const tor = await TOR.findOne({ torId: req.params.id });
      if (!tor) return res.status(404).json({ message: 'TOR not found' });

      await TOR.deleteOne({ torId: req.params.id });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Delete TOR',
        type: 'Transcript of Records',
        status: 'Successful',
        details: `Deleted TOR for ${tor.studentName} (${tor.studentId})`
      });

      res.json({ message: 'TOR deleted successfully' });
    } catch (error) {
      console.error('Error deleting TOR:', error);
      res.status(500).json({ message: 'Error deleting TOR' });
    }
  }
};

module.exports = TORController;
