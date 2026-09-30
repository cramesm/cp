const mongoose = require('mongoose');

/**
 * Resolves user role and department reliably from JWT payload or database
 */
async function resolveUserRoleAndDept(user) {
  let role = (user?.role || '').toLowerCase().trim();
  let department = (user?.department || '').toLowerCase().trim();
  const id = user?.id || user?._id || user?.userId;

  if (id && (!department || role === 'user' || role === 'admin' || role === 'staff')) {
    try {
      const Registrar = require('../models/Registrar');
      const SuperAdmin = require('../models/Users/SuperAdmin');
      const dbStaff = await Registrar.findById(id).lean();
      if (dbStaff) {
        role = (dbStaff.role || role).toLowerCase().trim();
        department = (dbStaff.department || department).toLowerCase().trim();
      } else {
        const dbAdmin = await SuperAdmin.findById(id).lean();
        if (dbAdmin) {
          role = (dbAdmin.role || 'super admin').toLowerCase().trim();
          department = (dbAdmin.department || 'administration').toLowerCase().trim();
        }
      }
    } catch (_err) {
      // Fallback to token values
    }
  }

  return { role, department };
}

/**
 * Generates MongoDB filter for notifications based on user's role and department
 */
function getRoleNotificationFilter(role = '', department = '') {
  const normRole = (role || '').toLowerCase().trim();
  const normDept = (department || '').toLowerCase().trim();

  // Only Super Admin has executive oversight across all departments
  const isSuperAdmin = normRole === 'super admin' || normRole === 'superadmin' || (normRole === 'admin' && (normDept === 'administration' || !normDept));

  // Common exclusion for student personal notifications
  const baseAdminExclusions = [
    { targetRole: { $ne: 'student' } },
    { message: { $not: /^(your request|your refund|your account|your password|your profile|your document request|your payment)/i } }
  ];

  if (isSuperAdmin) {
    return {
      $and: [
        ...baseAdminExclusions
      ]
    };
  }

  // Departmental identification
  const isAccounting = normDept === 'accounting' || normRole.includes('accounting');
  const isRegistrar = normDept === 'registrar' || normRole.includes('registrar');
  const isIT = normDept.includes('it') || normRole.includes('it');

  // Accounting Department (Accounting Admin & Accounting Staff)
  if (isAccounting) {
    return {
      $and: [
        ...baseAdminExclusions,
        {
          $or: [
            { targetDepartment: { $regex: /^accounting$/i } },
            { targetRole: { $regex: /accounting/i } },
            { type: { $in: ['payment', 'refund'] } },
            {
              type: { $in: ['system', 'general'] },
              targetRole: 'all'
            },
            // Fallback for notifications where type was not set, check message content
            {
              type: { $ne: 'request' },
              message: { $regex: /(payment|receipt|refund|transaction)/i }
            }
          ]
        },
        // Accounting excludes registrar document request processing notifications
        { type: { $ne: 'request' } },
        { message: { $not: /^(new document request|document request received)/i } }
      ]
    };
  }

  // Registrar Department (Registrar Admin & Registrar Staff)
  // Strictly handles document requests — MUST NEVER receive refund notifications
  if (isRegistrar) {
    return {
      $and: [
        ...baseAdminExclusions,
        {
          $or: [
            { targetDepartment: { $regex: /^registrar$/i } },
            { targetRole: { $regex: /registrar/i } },
            { type: { $in: ['request', 'document', 'system'] } },
            {
              type: { $in: ['system', 'general'] },
              targetRole: 'all'
            },
            // Fallback for notifications where type was not set, check message content
            {
              message: { $regex: /(document request|docu request|verification request)/i }
            }
          ]
        },
        // STRICTLY exclude refund notifications from Registrar personnel
        { type: { $ne: 'refund' } },
        { targetDepartment: { $not: /^accounting$/i } },
        { message: { $not: /(refund)/i } },
        { link: { $not: /refund/i } }
      ]
    };
  }

  // IT Department (IT Admin & IT Staff)
  if (isIT) {
    return {
      $and: [
        ...baseAdminExclusions,
        {
          $or: [
            { targetDepartment: { $regex: /it/i } },
            { targetRole: { $regex: /it/i } },
            { type: { $in: ['system', 'general', 'account'] } },
            { targetRole: 'all' }
          ]
        },
        { type: { $nin: ['refund', 'request'] } },
        { message: { $not: /(refund|document request)/i } }
      ]
    };
  }

  // Generic fallback: never show refunds to non-accounting staff
  return {
    $and: [
      ...baseAdminExclusions,
      { type: { $ne: 'refund' } },
      { targetDepartment: { $not: /^accounting$/i } },
      { message: { $not: /(refund)/i } }
    ]
  };
}

module.exports = {
  resolveUserRoleAndDept,
  getRoleNotificationFilter
};
