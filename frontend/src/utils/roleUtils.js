/**
 * Centralized Role and Department Definitions for VeriFitor Web
 * Supported Roles:
 * - Super Admin
 * - IT Administrator / IT Admin
 * - IT Staff
 * - Registrar Admin
 * - Registrar Staff
 * - Accounting Admin
 * - Accounting Staff
 */

export const ROLES = {
  SUPER_ADMIN: 'super admin',
  IT_ADMIN: 'it admin',
  IT_ADMINISTRATOR: 'it administrator',
  IT_STAFF: 'it staff',
  REGISTRAR_ADMIN: 'registrar admin',
  REGISTRAR_STAFF: 'registrar staff',
  ACCOUNTING_ADMIN: 'accounting admin',
  ACCOUNTING_STAFF: 'accounting staff',
};

export const DEPARTMENTS = {
  ADMINISTRATION: 'Administration',
  IT: 'IT Administration',
  REGISTRAR: 'Registrar',
  ACCOUNTING: 'Accounting',
};

export const normalizeRole = (role) => (role || '').toLowerCase().trim();
export const normalizeDept = (dept) => (dept || '').toLowerCase().trim();

export const isSuperAdmin = (role) => normalizeRole(role) === ROLES.SUPER_ADMIN;

export const isITAdmin = (role, dept = '') => {
  const normalizedRole = normalizeRole(role);
  const normalizedDept = normalizeDept(dept);
  return normalizedRole === ROLES.IT_ADMIN || 
         normalizedRole === ROLES.IT_ADMINISTRATOR || 
         (normalizedRole.includes('admin') && normalizedDept.includes('it'));
};

export const isITStaff = (role, dept = '') => {
  const normalizedRole = normalizeRole(role);
  const normalizedDept = normalizeDept(dept);
  return normalizedRole === ROLES.IT_STAFF || 
         (normalizedRole.includes('staff') && normalizedDept.includes('it'));
};

export const isIT = (role, dept = '') => isITAdmin(role, dept) || isITStaff(role, dept) || normalizeRole(role) === 'it';

export const isRegistrarAdmin = (role, dept = '') => {
  const normalizedRole = normalizeRole(role);
  const normalizedDept = normalizeDept(dept);
  return normalizedRole === ROLES.REGISTRAR_ADMIN || 
         (normalizedRole.includes('admin') && normalizedDept === 'registrar');
};

export const isRegistrarStaff = (role, dept = '') => {
  const normalizedRole = normalizeRole(role);
  const normalizedDept = normalizeDept(dept);
  return normalizedRole === ROLES.REGISTRAR_STAFF || 
         (normalizedRole.includes('registrar') && !normalizedRole.includes('admin')) ||
         (normalizedRole.includes('staff') && normalizedDept === 'registrar');
};

export const isRegistrar = (role, dept = '') => isRegistrarAdmin(role, dept) || isRegistrarStaff(role, dept);

export const isAccountingAdmin = (role, dept = '') => {
  const normalizedRole = normalizeRole(role);
  const normalizedDept = normalizeDept(dept);
  return normalizedRole === ROLES.ACCOUNTING_ADMIN || 
         (normalizedRole.includes('admin') && normalizedDept === 'accounting');
};

export const isAccountingStaff = (role, dept = '') => {
  const normalizedRole = normalizeRole(role);
  const normalizedDept = normalizeDept(dept);
  return normalizedRole === ROLES.ACCOUNTING_STAFF || 
         (normalizedRole.includes('accounting') && !normalizedRole.includes('admin')) ||
         (normalizedRole.includes('staff') && normalizedDept === 'accounting');
};

export const isAccounting = (role, dept = '') => isAccountingAdmin(role, dept) || isAccountingStaff(role, dept);

export const isDepartmentAdmin = (role, dept = '') => {
  return isSuperAdmin(role) || 
         isITAdmin(role, dept) || 
         isRegistrarAdmin(role, dept) || 
         isAccountingAdmin(role, dept);
};

export const canManageStaff = (role, dept = '') => isDepartmentAdmin(role, dept);
