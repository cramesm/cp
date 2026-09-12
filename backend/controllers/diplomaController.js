const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Diploma = require('../models/Diploma');
const ActivityLog = require('../models/ActivityLog');

const DiplomaController = {
  // @desc    Upload Diploma CSV file and import records
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

      const createdDiplomas = [];

      for (const row of rows) {
        const studentId = (row['Student ID'] || row['studentId'] || '').trim();
        const studentName = (row['Student Name'] || row['studentName'] || '').trim();
        const course = (row['Course'] || row['course'] || '').trim();
        const honors = (row['Honors'] || row['honors'] || '').trim();
        const dateOfGraduation = (row['Date of Graduation'] || row['dateOfGraduation'] || '').trim();

        if (!studentId || !studentName) continue;

        const diplomaId = 'DIP-' + Date.now() + Math.floor(Math.random() * 1000);
        const diploma = await Diploma.create({
          diplomaId,
          studentId,
          studentName,
          course: course || 'N/A',
          honors: honors || '',
          dateOfGraduation: dateOfGraduation || '',
          status: 'Draft',
          generatedBy: req.user?.email || 'Registrar'
        });
        createdDiplomas.push(diploma);
      }

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'CSV Import',
        type: 'Diploma',
        status: 'Successful',
        details: `Imported ${createdDiplomas.length} diploma records`
      });

      res.json({ message: 'Diploma records imported successfully', count: createdDiplomas.length });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Error uploading Diploma CSV:', error);
      res.status(500).json({ message: 'Error processing CSV file', error: error.message });
    }
  },

  // @desc    Get all Diploma records
  getAllDiplomas: async (req, res) => {
    try {
      const diplomas = await Diploma.find().sort({ createdAt: -1 });
      res.json(diplomas);
    } catch (error) {
      console.error('Error fetching Diploma records:', error);
      res.status(500).json({ message: 'Error fetching Diploma records' });
    }
  },

  // @desc    Get single Diploma by diplomaId
  getDiplomaById: async (req, res) => {
    try {
      const diploma = await Diploma.findOne({ diplomaId: req.params.id });
      if (!diploma) return res.status(404).json({ message: 'Diploma not found' });
      res.json(diploma);
    } catch (error) {
      console.error('Error fetching Diploma:', error);
      res.status(500).json({ message: 'Error fetching Diploma' });
    }
  },

  // @desc    Update draft Diploma
  updateDiploma: async (req, res) => {
    try {
      const diploma = await Diploma.findOne({ diplomaId: req.params.id });
      if (!diploma) return res.status(404).json({ message: 'Diploma not found' });

      const { studentName, course, honors, dateOfGraduation, status } = req.body;
      if (studentName) diploma.studentName = studentName;
      if (course) diploma.course = course;
      if (honors !== undefined) diploma.honors = honors;
      if (dateOfGraduation) diploma.dateOfGraduation = dateOfGraduation;
      if (status) diploma.status = status;

      const updated = await diploma.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Edit Diploma',
        type: 'Diploma',
        status: 'Successful',
        details: `Updated Diploma for ${updated.studentName} (${updated.studentId})`
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating Diploma:', error);
      res.status(500).json({ message: 'Error updating Diploma' });
    }
  },

  // @desc    Finalize Diploma
  generateDiploma: async (req, res) => {
    try {
      const diploma = await Diploma.findOne({ diplomaId: req.params.id });
      if (!diploma) return res.status(404).json({ message: 'Diploma not found' });

      diploma.status = 'Finalized';
      await diploma.save();

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Finalize Diploma',
        type: 'Diploma',
        status: 'Successful',
        details: `Finalized Diploma for ${diploma.studentName} (${diploma.studentId})`
      });

      res.json({ message: 'Diploma finalized successfully', diploma });
    } catch (error) {
      console.error('Error finalizing Diploma:', error);
      res.status(500).json({ message: 'Error finalizing Diploma' });
    }
  },

  // @desc    Download Diploma file
  downloadDiploma: async (req, res) => {
    try {
      const diploma = await Diploma.findOne({ diplomaId: req.params.id });
      if (!diploma) return res.status(404).json({ message: 'Diploma not found' });

      if (diploma.pdfPath) {
        const pdfFullPath = path.join(__dirname, '..', 'uploads', 'diploma', diploma.pdfPath);
        if (fs.existsSync(pdfFullPath)) {
          return res.download(pdfFullPath, `Diploma-${diploma.studentName}-${diploma.studentId}.pdf`);
        }
      }

      res.json({ success: true, message: 'Diploma record retrieved', diploma });
    } catch (error) {
      console.error('Error downloading Diploma:', error);
      res.status(500).json({ message: 'Error downloading Diploma' });
    }
  },

  // @desc    Delete Diploma record
  deleteDiploma: async (req, res) => {
    try {
      const diploma = await Diploma.findOne({ diplomaId: req.params.id });
      if (!diploma) return res.status(404).json({ message: 'Diploma not found' });

      await Diploma.deleteOne({ diplomaId: req.params.id });

      await ActivityLog.create({
        userEmail: req.user.email,
        userName: req.user.name || 'User',
        action: 'Delete Diploma',
        type: 'Diploma',
        status: 'Successful',
        details: `Deleted Diploma for ${diploma.studentName} (${diploma.studentId})`
      });

      res.json({ message: 'Diploma deleted successfully' });
    } catch (error) {
      console.error('Error deleting Diploma:', error);
      res.status(500).json({ message: 'Error deleting Diploma' });
    }
  }
};

module.exports = DiplomaController;
