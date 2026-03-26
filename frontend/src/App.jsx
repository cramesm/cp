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
import Profile from './pages/Profile/Profile';

{/* System Admin Pages */}
import ManageRegistrar from './pages/SystemAdmin/ManageRegistrar';
import ActivityLogs from './pages/SystemAdmin/ActivityLogs';
import AddRegistrar from './pages/SystemAdmin/AddRegistrar';
import RegistrarInformation from './pages/SystemAdmin/RegistrarInformation';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        {/* Protected Routes (Assuming dashboard relies on layout wrapper later) */}
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestDetails />} />
        
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetails />} />
        
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/manage-registrar" element={<ManageRegistrar />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />
        <Route path="/manage-registrar/add" element={<AddRegistrar />} />
        <Route path="/manage-registrar/details/:id" element={<RegistrarInformation />} />


        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
