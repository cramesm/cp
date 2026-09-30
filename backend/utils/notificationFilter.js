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

  const isSuperAdmin = normRole.includes('super admin') || normRole === 'admin';
  const isAdmin = isSuperAdmin || normRole.includes('admin') || normDept === 'administration';

  // Common exclusion for student personal notifications
  const baseAdminExclusions = [
    { targetRole: { $ne: 'student' } },
    { message: { $not: /^(your request|your refund|your account|your password|your profile|your document request|your payment)/i } }
  ];

  // Super Admin or Departmental Administrators (Registrar Admin, Accounting Admin, IT Admin)
  // have executive oversight and see all operational alerts across departments
  if (isAdmin) {
    return {
      $and: [
        ...baseAdminExclusions
      ]
    };
  }

  const isAccountingStaff = !isAdmin && (
    normDept === 'accounting' ||
    normRole.includes('accounting')
  );
  const isRegistrarStaff = !isAdmin && (
    normDept === 'registrar' ||
    normRole.includes('registrar')
  );
  const isITStaff = !isAdmin && (
    normDept.includes('it') ||
    normRole.includes('it')
  );

  if (isAccountingStaff) {
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
        // Accounting staff excludes registrar document request processing notifications
        { type: { $ne: 'request' } },
        { message: { $not: /^(new document request|document request received)/i } }
      ]
    };
  }

  if (isRegistrarStaff) {
    return {
      $and: [
        ...baseAdminExclusions,
        {
          $or: [
            { targetDepartment: { $regex: /^registrar$/i } },
            { targetRole: { $regex: /registrar/i } },
            { type: { $in: ['request', 'payment'] } },
            {
              type: { $in: ['system', 'general'] },
              targetRole: 'all'
            },
            // Fallback for notifications where type was not set, check message content
            {
              message: { $regex: /(document request|docu request|payment receipt|payment verified)/i }
            }
          ]
        },
        // Registrar staff excludes non-document refund notifications
        { type: { $ne: 'refund' } },
        { message: { $not: /(new refund request|refund request received)/i } }
      ]
    };
  }

  if (isITStaff) {
    return {
      $and: [
        ...baseAdminExclusions,
        {
          $or: [
            { targetDepartment: { $regex: /it/i } },
            { targetRole: { $regex: /it/i } },
            { type: { $in: ['system', 'general'] } },
            { targetRole: 'all' }
          ]
        }
      ]
    };
  }

  // Generic fallback admin sees all administrative notifications
  return {
    $and: [
      ...baseAdminExclusions
    ]
  };
}

module.exports = {
  resolveUserRoleAndDept,
  getRoleNotificationFilter
};
