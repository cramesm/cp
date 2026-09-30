const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const Refund = require('../models/Refund');

/**
 * Ensures legacy notifications and existing pending payments/refunds
 * are properly classified by department (Registrar / Accounting)
 */
async function syncNotifications() {
  try {
    // 0. Ensure all personal user notifications are correctly flagged with targetRole: 'student'
    await Notification.updateMany(
      {
        message: { $regex: /^(your request|your refund|your account|your password|your profile|your document request|your payment)/i }
      },
      {
        $set: { targetRole: 'student' },
        $unset: { targetDepartment: 1 }
      }
    );

    // 1. Tag legacy document request notifications with targetDepartment: 'Registrar'
    await Notification.updateMany(
      {
        targetRole: { $ne: 'student' },
        message: { $regex: /(new document request|document request received)/i },
        targetDepartment: { $in: ['', null, undefined] }
      },
      {
        $set: {
          targetDepartment: 'Registrar',
          type: 'request',
          targetRole: 'admin'
        }
      }
    );

    // 2. Tag legacy payment & refund notifications with targetDepartment: 'Accounting'
    await Notification.updateMany(
      {
        $or: [
          { message: { $regex: /(payment receipt|new payment)/i } },
          { type: 'payment' }
        ],
        targetRole: { $ne: 'student' },
        targetDepartment: { $in: ['', null, undefined] }
      },
      {
        $set: {
          targetDepartment: 'Accounting',
          type: 'payment',
          targetRole: 'admin'
        }
      }
    );

    await Notification.updateMany(
      {
        $or: [
          { message: { $regex: /(refund request|new refund)/i } },
          { type: 'refund' }
        ],
        targetRole: { $ne: 'student' },
        targetDepartment: { $in: ['', null, undefined] }
      },
      {
        $set: {
          targetDepartment: 'Accounting',
          type: 'refund',
          targetRole: 'admin'
        }
      }
    );

    // 2.1 Migrate any legacy /payments links to /transactions
    await Notification.updateMany(
      { link: '/payments' },
      { $set: { link: '/transactions' } }
    );
    await Notification.updateMany(
      { link: '/payments?tab=refunds' },
      { $set: { link: '/transactions?tab=refunds' } }
    );
    await Notification.updateMany(
      { targetRole: 'admin', type: 'request', link: { $in: ['', null] } },
      { $set: { link: '/requests' } }
    );

    // 3. Backfill notifications for existing pending document requests if not already notified
    const pendingReqs = await Request.find({ status: 'Pending' }).lean();
    for (const req of pendingReqs) {
      const exists = await Notification.findOne({
        type: 'request',
        message: { $regex: new RegExp(req.requestId, 'i') }
      });

      if (!exists) {
        await Notification.create({
          title: 'New Document Request',
          message: `New document request received: ${req.documentType} from ${req.name || 'Student'} (ID: ${req.studentId || 'N/A'}) — Request #${req.requestId}`,
          isRead: false,
          targetRole: 'admin',
          targetDepartment: 'Registrar',
          type: 'request',
          link: '/requests',
          date: req.dateRequested || req.createdAt || new Date()
        });
      }
    }

    // 4. Backfill notifications for existing pending transactions if not already notified
    const pendingTxs = await Transaction.find({ status: 'Pending Verification' }).lean();
    for (const tx of pendingTxs) {
      const exists = await Notification.findOne({
        targetDepartment: 'Accounting',
        type: 'payment',
        message: { $regex: new RegExp(tx.requestId || tx.transactionId, 'i') }
      });

      if (!exists) {
        await Notification.create({
          title: 'New Payment Receipt',
          message: `New payment receipt submitted for Request #${tx.requestId || 'N/A'} (${tx.documentType || 'Document'}) by ${tx.payerName || tx.name || 'Student'} — ₱${tx.amount || '0.00'}`,
          isRead: false,
          targetRole: 'admin',
          targetDepartment: 'Accounting',
          type: 'payment',
          link: '/transactions',
          date: tx.date || tx.createdAt || new Date()
        });
      }
    }

    // 5. Backfill notifications for existing pending refunds if not already notified
    const pendingRefunds = await Refund.find({ status: { $regex: /^pending$/i } }).lean();
    for (const rf of pendingRefunds) {
      const exists = await Notification.findOne({
        targetDepartment: 'Accounting',
        type: 'refund',
        message: { $regex: new RegExp(rf.refundId || rf.transactionId, 'i') }
      });

      if (!exists) {
        await Notification.create({
          title: 'New Refund Request',
          message: `New refund request (${rf.refundId || 'RFD'}) received from ${rf.studentName || 'Student'} for ₱${rf.amount || '0.00'} — Awaiting review`,
          isRead: false,
          targetRole: 'admin',
          targetDepartment: 'Accounting',
          type: 'refund',
          link: '/transactions?tab=refunds',
          date: rf.createdAt || new Date()
        });
      }
    }
  } catch (err) {
    console.warn('Notification sync notice:', err.message);
  }
}

module.exports = syncNotifications;
