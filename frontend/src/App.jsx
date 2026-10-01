import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import OTP from './pages/auth/OTP';
import ChangePassword from './pages/auth/ChangePassword';

// Registrar Staff Pages
import Dashboard from './pages/dashboard/Dashboard';
import Requests from './pages/requests/Requests';
import RequestDetails from './pages/requests/RequestDetails';
import Transactions from './pages/transactions/Transactions';
import TransactionDetails from './pages/transactions/TransactionDetails';
import Notifications from './pages/notifications/Notifications';
import Profile from './pages/profile/Profile'; // This is the Edit Page
import ProfileInfo from './pages/profile/ProfileInfo'; // This is the View Page

// Super Admin Pages
import ManageRegistrar from './pages/super-admin/ManageRegistrar';
import RegistrarInformation from './pages/super-admin/RegistrarInformation';
import ActivityLogs from './pages/super-admin/ActivityLogs';

import ValidationResults from './pages/validation/Validation';

import StudentManagement from './pages/users/StudentManagement';

// Blockchain Pages
import Blockchain from './pages/blockchain/Blockchain';
import MyTransactions from './pages/blockchain/MyTransactions';
import VerifyTransactions from './pages/blockchain/VerifyTransactions';

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
        
        {/* Requests Management - Protected */}
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />

        
        {/* Transaction History - Protected */}
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/transactions/:id" element={<ProtectedRoute><TransactionDetails /></ProtectedRoute>} />
        
        {/* Notifications - Protected */}
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        {/* Blockchain - Protected */}
        <Route path="/blockchain" element={<ProtectedRoute><Blockchain /></ProtectedRoute>} />
        <Route path="/blockchain/my-transactions" element={<ProtectedRoute><MyTransactions /></ProtectedRoute>} />
        <Route path="/blockchain/verify" element={<ProtectedRoute><VerifyTransactions /></ProtectedRoute>} />

        {/* Profile Management - Protected */}
        <Route path="/profile/info" element={<ProtectedRoute><ProfileInfo /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Staff Management - Protected */}
        <Route 
          path="/manage-registrar" 
          element={
            <RoleRoute allowedRoles={['super admin', 'it administrator', 'it admin', 'registrar admin', 'accounting admin']}>
              <ManageRegistrar />
            </RoleRoute>
          } 
        />
        <Route path="/manage-registrar/add" element={<Navigate to="/manage-registrar" replace />} />
        <Route 
          path="/manage-registrar/details/:id" 
          element={
            <RoleRoute allowedRoles={['super admin', 'it administrator', 'it admin', 'registrar admin', 'accounting admin']}>
              <RegistrarInformation />
            </RoleRoute>
          } 
        />
        <Route 
          path="/manage-users" 
          element={
            <RoleRoute allowedRoles={['super admin', 'it administrator', 'it admin', 'it staff', 'it']}>
              <StudentManagement />
            </RoleRoute>
          } 
        />
        
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

