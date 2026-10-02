import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Authentication
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import OTP from './pages/auth/OTP';
import ChangePassword from './pages/auth/ChangePassword';

// Shared Across All Roles
import Dashboard from './pages/shared/Dashboard';
import Notifications from './pages/shared/Notifications';
import Profile from './pages/shared/Profile';
import ProfileInfo from './pages/shared/ProfileInfo';

// Registrar Department (Registrar Admin & Staff)
import DocumentRequests from './pages/registrar/DocumentRequests';
import RequestDetails from './pages/registrar/RequestDetails';
import BlockchainRecords from './pages/registrar/BlockchainRecords';
import MyBlockchainTransactions from './pages/registrar/MyTransactions';
import VerifyBlockchainTransaction from './pages/registrar/VerifyTransactions';

// Accounting Department (Accounting Admin & Staff)
import Payments from './pages/accounting/Payments';
import TransactionDetails from './pages/accounting/TransactionDetails';

// IT Department (IT Admin & Staff)
import UserManagement from './pages/it/UserManagement';

// Super Admin & Staff Oversight
import StaffManagement from './pages/super-admin/StaffManagement';
import StaffDetails from './pages/super-admin/StaffDetails';
import ActivityLogs from './pages/super-admin/ActivityLogs';

// Public Validation Portal
import ValidationResults from './pages/public/Validation';

import PropTypes from 'prop-types';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase().trim();
  const staffRoles = [
    'super admin',
    'it administrator',
    'it admin',
    'it staff',
    'it',
    'registrar admin',
    'registrar staff',
    'registrar',
    'accounting admin',
    'accounting staff',
    'accounting',
    'admin',
    'staff'
  ];

  const isInstitutional = staffRoles.includes(userRole) || 
    (userRole && !['student', 'alumni'].includes(userRole) && (
      userRole.includes('admin') || userRole.includes('staff') || userRole.includes('registrar') || userRole.includes('accounting') || userRole.includes('it')
    ));

  if (!token || !isInstitutional) {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminUser');
    return <Navigate to="/" replace />;
  }
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const RoleRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase().trim();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase().trim()).includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

RoleRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const AuthenticatedWildcardRedirect = () => {
  const token = localStorage.getItem('token');
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase().trim();
  if (token && userRole) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes (public) */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Main Dashboard - Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Registrar Department - Requests Management */}
        <Route path="/requests" element={<ProtectedRoute><DocumentRequests /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />

        {/* Accounting Department - Payments & Transactions */}
        <Route path="/transactions" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/transactions/:id" element={<ProtectedRoute><TransactionDetails /></ProtectedRoute>} />
        
        {/* Shared - Notifications */}
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        {/* Registrar Department - Blockchain Records */}
        <Route path="/blockchain" element={<ProtectedRoute><BlockchainRecords /></ProtectedRoute>} />
        <Route path="/blockchain/my-transactions" element={<ProtectedRoute><MyBlockchainTransactions /></ProtectedRoute>} />
        <Route path="/blockchain/verify" element={<ProtectedRoute><VerifyBlockchainTransaction /></ProtectedRoute>} />

        {/* Shared - Profile Management */}
        <Route path="/profile/info" element={<ProtectedRoute><ProfileInfo /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Super Admin & Department Staff Management */}
        <Route 
          path="/manage-registrar" 
          element={
            <RoleRoute allowedRoles={['super admin', 'it administrator', 'it admin', 'registrar admin', 'accounting admin']}>
              <StaffManagement />
            </RoleRoute>
          } 
        />
        <Route path="/manage-registrar/add" element={<Navigate to="/manage-registrar" replace />} />
        <Route 
          path="/manage-registrar/details/:id" 
          element={
            <RoleRoute allowedRoles={['super admin', 'it administrator', 'it admin', 'registrar admin', 'accounting admin']}>
              <StaffDetails />
            </RoleRoute>
          } 
        />

        {/* IT Department - User Management */}
        <Route 
          path="/manage-users" 
          element={
            <RoleRoute allowedRoles={['super admin', 'it administrator', 'it admin', 'it staff', 'it']}>
              <UserManagement />
            </RoleRoute>
          } 
        />
        
        {/* System & Activity Logs */}
        <Route 
          path="/activity-logs" 
          element={
            <RoleRoute allowedRoles={['super admin', 'it administrator', 'it admin', 'it staff', 'it', 'registrar admin', 'accounting admin']}>
              <ActivityLogs />
            </RoleRoute>
          } 
        />

        {/* Legacy / Alias Routes */}
        <Route path="/payments" element={<Navigate to="/transactions" replace />} />
        <Route path="/payments/*" element={<Navigate to="/transactions" replace />} />
        <Route path="/refunds" element={<Navigate to="/transactions?tab=refunds" replace />} />
        <Route path="/document-requests" element={<Navigate to="/requests" replace />} />

        {/* Public Validation Page (QR Scans go straight to /verify/results) */}
        <Route path="/verify" element={<Navigate to="/" replace />} />
        <Route path="/verify/results" element={<ValidationResults />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<AuthenticatedWildcardRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
