const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const STAFF_ROLES = {
  SUPER_ADMIN: 'super admin',
  IT_ADMIN: 'it admin',
  IT_ADMINISTRATOR: 'it administrator',
  IT_STAFF: 'it staff',
  REGISTRAR_ADMIN: 'registrar admin',
  REGISTRAR_STAFF: 'registrar staff',
  ACCOUNTING_ADMIN: 'accounting admin',
  ACCOUNTING_STAFF: 'accounting staff',
};

const DEPARTMENTS = {
  ADMINISTRATION: 'Administration',
  IT: 'IT Administration',
  REGISTRAR: 'Registrar',
  ACCOUNTING: 'Accounting',
};

module.exports = { 
  HttpStatus,
  STAFF_ROLES,
  DEPARTMENTS
};
