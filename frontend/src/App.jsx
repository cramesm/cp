import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/Auth/AdminLogin';
import ForgotPassword from './pages/Auth/ForgotPassword';
import OTP from './pages/Auth/OTP';
import ChangePassword from './pages/Auth/ChangePassword';

// Registrar Staff Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Requests from './pages/Requests/Requests';
import RequestDetails from './pages/Requests/RequestDetails';
import Transactions from './pages/Transactions/Transactions';
import TransactionDetails from './pages/Transactions/TransactionDetails';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile'; // This is the Edit Page
import ProfileInfo from './pages/Profile/ProfileInfo'; // This is the View Page

// System Admin Pages
import ManageRegistrar from './pages/SystemAdmin/ManageRegistrar';
import AddRegistrar from './pages/SystemAdmin/AddRegistrar';
import RegistrarInformation from './pages/SystemAdmin/RegistrarInformation';
import ActivityLogs from './pages/SystemAdmin/ActivityLogs';

import ValidationLanding from './pages/Validation/Landing';
import ValidationResults from './pages/Validation/Validation';

import TORManagement from './pages/TOR/TORManagement';
import TORDetails from './pages/TOR/TORDetails';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
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

        {/* Profile Management - Protected */}
        <Route path="/profile/info" element={<ProtectedRoute><ProfileInfo /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* System Admin / Registrar Management - Protected */}
        <Route path="/manage-registrar" element={<ProtectedRoute><ManageRegistrar /></ProtectedRoute>} />
        <Route path="/manage-registrar/add" element={<ProtectedRoute><AddRegistrar /></ProtectedRoute>} />
        <Route path="/manage-registrar/details/:id" element={<ProtectedRoute><RegistrarInformation /></ProtectedRoute>} />
        
        <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />

        {/* TOR Management - Protected */}
        <Route path="/tor" element={<ProtectedRoute><TORManagement /></ProtectedRoute>} />
        <Route path="/tor/:id" element={<ProtectedRoute><TORDetails /></ProtectedRoute>} />

        {/* Public Validation Page */}
        <Route path="/verify" element={<ValidationLanding />} />
        <Route path="/verify/results" element={<ValidationResults />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

