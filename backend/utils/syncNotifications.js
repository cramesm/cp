const mongoose = require('mongoose');
const Notification = require('../models/Notification');
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

    // 3. Backfill notifications for existing pending transactions if not already notified
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
          link: '/payments',
          date: tx.date || tx.createdAt || new Date()
        });
      }
    }

    // 4. Backfill notifications for existing pending refunds if not already notified
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
          link: '/payments?tab=refunds',
          date: rf.createdAt || new Date()
        });
      }
    }
  } catch (err) {
    console.warn('Notification sync notice:', err.message);
  }
}

module.exports = syncNotifications;
