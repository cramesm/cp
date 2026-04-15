import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/Auth/AdminLogin';
import ForgotPassword from './pages/Auth/ForgotPassword';
import OTP from './pages/Auth/OTP';
import ChangePassword from './pages/Auth/ChangePassword';

{/* Registrar Staff Pages */}
import Dashboard from './pages/Dashboard/Dashboard';
import Requests from './pages/Requests/Requests';
import RequestDetails from './pages/Requests/RequestDetails';
import Transactions from './pages/Transactions/Transactions';
import TransactionDetails from './pages/Transactions/TransactionDetails';
import Notifications from './pages/Notifications/Notifications';
import Profile from './pages/Profile/Profile'; // This is the Edit Page
import ProfileInfo from './pages/Profile/ProfileInfo'; // This is the View Page
import Payments from './pages/Payments/Payments';
import PaymentDetails from './pages/Payments/PaymentDetails'; // Added this import

{/* System Admin Pages */}
import ManageRegistrar from './pages/SystemAdmin/ManageRegistrar';
import AddRegistrar from './pages/SystemAdmin/AddRegistrar';
import RegistrarInformation from './pages/SystemAdmin/RegistrarInformation';
import ActivityLogs from './pages/Admin/ActivityLogs';

import Validation from './pages/Validation/Validation';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Main Dashboard - Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Requests Management */}
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestDetails />} />

        {/* Payments Management */}
        <Route path="/payments" element={<Payments />} />
        <Route path="/payments/:id" element={<PaymentDetails />} />
        
        {/* Transaction History */}
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetails />} />
        
        {/* Notifications */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Profile Management */}
        <Route path="/profile/info" element={<ProfileInfo />} />
        <Route path="/profile" element={<Profile />} />

        {/* System Admin / Registrar Management */}
        <Route path="/manage-registrar" element={<ManageRegistrar />} />
        <Route path="/manage-registrar/add" element={<AddRegistrar />} />
        <Route path="/manage-registrar/details/:id" element={<RegistrarInformation />} />
        
        <Route path="/activity-logs" element={<ActivityLogs />} />

        <Route path="/validation" element={<Validation />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
