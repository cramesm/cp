const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

const Student = require('../models/Users/Student');
const Alumni = require('../models/Users/Alumni');
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const Refund = require('../models/Refund');
const Registrar = require('../models/Registrar');
const ActivityLog = require('../models/ActivityLog');
let BlockchainTransaction;
try {
  BlockchainTransaction = require('../blockchain_essentials/modelBC/blockchainTransactionModel');
} catch (e) {
  BlockchainTransaction = null;
}

// All backup routes require Super Admin authorization
router.use(protect);
router.use(superAdminOnly);

// @route   GET /api/backup/stats
// @desc    Get archive counts and last backup timestamp
router.get('/stats', async (req, res) => {
  try {
    const [studentsCount, alumniCount, requestsCount, transactionsCount, refundsCount, registrarsCount] = await Promise.all([
      Student.countDocuments(),
      Alumni.countDocuments(),
      Request.countDocuments(),
      Transaction.countDocuments(),
      Refund.countDocuments(),
      Registrar.countDocuments()
    ]);

    const lastBackupLog = await ActivityLog.findOne({ action: 'Database Backup Export' }).sort({ timestamp: -1 });

    const totalArchives = studentsCount + alumniCount;

    res.json({
      success: true,
      stats: {
        totalArchives,
        studentsCount,
        alumniCount,
        requestsCount,
        transactionsCount,
        refundsCount,
        registrarsCount,
        lastBackupAt: lastBackupLog ? lastBackupLog.timestamp : null,
        lastBackupBy: lastBackupLog ? lastBackupLog.userName : null
      }
    });
  } catch (error) {
    console.error('Error fetching backup stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve archive stats' });
  }
});

// @route   GET /api/backup/export
// @desc    Export full database snapshot for disaster recovery (>10k student archives)
router.get('/export', async (req, res) => {
  try {
    const [students, alumni, requests, transactions, refunds, registrars, activityLogs, blockchainLedgers] = await Promise.all([
      Student.find({}).lean(),
      Alumni.find({}).lean(),
      Request.find({}).lean(),
      Transaction.find({}).lean(),
      Refund.find({}).lean(),
      Registrar.find({}, '-password').lean(),
      ActivityLog.find({}).sort({ timestamp: -1 }).limit(1000).lean(),
      BlockchainTransaction ? BlockchainTransaction.find({}).lean() : Promise.resolve([])
    ]);

    const totalRecords = students.length + alumni.length + requests.length + transactions.length + refunds.length;

    const backupPayload = {
      metadata: {
        system: 'VeriFitor Academic Records & Digital Ledger System',
        version: '2.0.0',
        exportTimestamp: new Date().toISOString(),
        exportedBy: req.user?.email || 'Super Admin',
        totalRecords,
        breakdown: {
          students: students.length,
          alumni: alumni.length,
          requests: requests.length,
          transactions: transactions.length,
          refunds: refunds.length,
          registrars: registrars.length,
          blockchainLedgers: blockchainLedgers.length,
          activityLogs: activityLogs.length
        }
      },
      data: {
        students,
        alumni,
        requests,
        transactions,
        refunds,
        registrars,
        blockchainLedgers,
        activityLogs
      }
    };

    // Log the backup creation in ActivityLog
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || req.ip || '';
    await ActivityLog.create({
      userEmail: req.user.email,
      userName: req.user.name || 'Super Admin',
      action: 'Database Backup Export',
      type: 'Archive Backup',
      status: 'Successful',
      details: `Generated snapshot with ${totalRecords} academic records & student archives`,
      ipAddress: clientIp
    });

    const filename = `verifitor_academic_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backupPayload, null, 2));
  } catch (error) {
    console.error('Error creating database export:', error);
    res.status(500).json({ success: false, message: 'Failed to generate database backup snapshot' });
  }
});

// @route   POST /api/backup/restore
// @desc    Restore database from backup snapshot with batch upsert
router.post('/restore', async (req, res) => {
  try {
    const { metadata, data } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid backup file format: Missing data payload' });
    }

    const restoredCounts = {
      students: 0,
      alumni: 0,
      requests: 0,
      transactions: 0,
      refunds: 0
    };

    // 1. Restore Students in chunks
    if (Array.isArray(data.students) && data.students.length > 0) {
      const studentOps = data.students.map(s => ({
        updateOne: {
          filter: { email: s.email },
          update: { $set: s },
          upsert: true
        }
      }));
      const resStudents = await Student.bulkWrite(studentOps, { ordered: false });
      restoredCounts.students = (resStudents.upsertedCount || 0) + (resStudents.modifiedCount || 0);
    }

    // 2. Restore Alumni
    if (Array.isArray(data.alumni) && data.alumni.length > 0) {
      const alumniOps = data.alumni.map(a => ({
        updateOne: {
          filter: { email: a.email },
          update: { $set: a },
          upsert: true
        }
      }));
      const resAlumni = await Alumni.bulkWrite(alumniOps, { ordered: false });
      restoredCounts.alumni = (resAlumni.upsertedCount || 0) + (resAlumni.modifiedCount || 0);
    }

    // 3. Restore Requests
    if (Array.isArray(data.requests) && data.requests.length > 0) {
      const reqOps = data.requests.map(r => ({
        updateOne: {
          filter: { requestId: r.requestId },
          update: { $set: r },
          upsert: true
        }
      }));
      const resReq = await Request.bulkWrite(reqOps, { ordered: false });
      restoredCounts.requests = (resReq.upsertedCount || 0) + (resReq.modifiedCount || 0);
    }

    // 4. Restore Transactions
    if (Array.isArray(data.transactions) && data.transactions.length > 0) {
      const txOps = data.transactions.map(t => ({
        updateOne: {
          filter: { transactionId: t.transactionId },
          update: { $set: t },
          upsert: true
        }
      }));
      const resTx = await Transaction.bulkWrite(txOps, { ordered: false });
      restoredCounts.transactions = (resTx.upsertedCount || 0) + (resTx.modifiedCount || 0);
    }

    // 5. Restore Refunds
    if (Array.isArray(data.refunds) && data.refunds.length > 0) {
      const rfOps = data.refunds.map(rf => ({
        updateOne: {
          filter: { refundId: rf.refundId || rf._id },
          update: { $set: rf },
          upsert: true
        }
      }));
      const resRf = await Refund.bulkWrite(rfOps, { ordered: false });
      restoredCounts.refunds = (resRf.upsertedCount || 0) + (resRf.modifiedCount || 0);
    }

    // Log the restore activity
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || req.ip || '';
    await ActivityLog.create({
      userEmail: req.user.email,
      userName: req.user.name || 'Super Admin',
      action: 'Database Disaster Recovery Restore',
      type: 'Disaster Recovery',
      status: 'Successful',
      details: `Restored snapshot containing ${metadata?.totalRecords || 'multiple'} records`,
      ipAddress: clientIp
    });

    res.json({
      success: true,
      message: 'Database snapshot restored successfully',
      restoredCounts
    });
  } catch (error) {
    console.error('Error during disaster recovery restore:', error);
    res.status(500).json({ success: false, message: 'Disaster recovery restore failed', error: error.message });
  }
});

module.exports = router;
