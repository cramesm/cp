import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showDemoAccounts, setShowDemoAccounts] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();

    // Create Account Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [regData, setRegData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: 'Registrar'
    });
    const [emailStatus, setEmailStatus] = useState({ checking: false, available: null, message: '' });
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState('');
    const [regSuccessData, setRegSuccessData] = useState(null);

    // Debounced real-time email check
    useEffect(() => {
        const clean = regData.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!clean || !emailRegex.test(clean)) {
            setEmailStatus({ checking: false, available: null, message: '' });
            return;
        }

        setEmailStatus({ checking: true, available: null, message: 'Checking email...' });
        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/auth/check-email?email=${encodeURIComponent(clean)}`);
                setEmailStatus({
                    checking: false,
                    available: res.data.available,
                    message: res.data.message
                });
            } catch (err) {
                setEmailStatus({ checking: false, available: null, message: '' });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [regData.email]);

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setRegError('');

        if (!regData.firstName.trim() || !regData.lastName.trim()) {
            setRegError('Please enter both First Name and Last Name.');
            return;
        }
        if (!regData.email.trim()) {
            setRegError('Email address is required.');
            return;
        }
        if (emailStatus.available === false) {
            setRegError('This email is already registered. Please choose another or log in.');
            return;
        }

        setRegLoading(true);
        try {
            const res = await api.post('/auth/register-staff', {
                firstName: regData.firstName.trim(),
                lastName: regData.lastName.trim(),
                email: regData.email.trim(),
                department: regData.department
            });

            if (res.data.success) {
                setRegSuccessData({
                    email: regData.email.trim(),
                    department: regData.department
                });
            }
        } catch (err) {
            setRegError(err.response?.data?.message || 'Failed to create account. Please try again.');
        } finally {
            setRegLoading(false);
        }
    };

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return false;
        }
        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.success || response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.user));

                if (response.data.user && response.data.user.role) {
                    localStorage.setItem('userRole', response.data.user.role);
                }
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.response?.status === 429) {
                const msg = err.response.data.message;
                const match = msg.match(/in (\d+) seconds/);
                if (match) {
                    setCooldown(parseInt(match[1], 10));
                }
            }
            const message = err.response?.data?.message || 'Invalid credentials. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-[#ffffff]">
            {/* Left Column - Branding Banner */}
            <div className="hidden lg:flex lg:w-1/2 relative p-5 bg-[#ffffff] items-center justify-center">
                <img 
                    src="/verifitor-login.webp" 
                    alt="Verifitor Login Design" 
                    className="w-full h-full max-h-[96vh] object-cover rounded-3xl shadow-xl"
                    width="1414"
                    height="2000"
                    fetchPriority="high"
                />
            </div>

            {/* Right Column - Login Form */}
            <main className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-[#ffffff] overflow-y-auto">
                <div className="w-full max-w-[420px]">
                    
                    {/* Logo Header */}
                    <div className="mb-6 flex justify-center">
                        <img 
                            src="/verifitor_logo.webp" 
                            alt="Verifitor Logo" 
                            className="w-[80%] max-w-[300px] max-h-[120px] object-contain drop-shadow-sm" 
                            width="621" 
                            height="213" 
                            fetchPriority="high" 
                        />
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-[32px] sm:text-[36px] font-extrabold text-[#111827] mb-2 tracking-tight">
                            Welcome back!
                        </h2>
                        <p className="text-[#6B7280] text-[13.5px] font-normal leading-relaxed">
                            Enter your credentials to access your VeriFitor account
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-[13px] flex items-center gap-2 animate-shake" role="alert">
                                <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email Pill Input */}
                            <div className="relative">
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="Username or Email"
                                    className="w-full px-6 py-3.5 bg-white border border-gray-300 rounded-full text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#213448] focus:ring-4 focus:ring-[#213448]/10 transition-all duration-200 shadow-sm hover:border-gray-400"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password Pill Input */}
                            <div>
                                <div className="relative">
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Password"
                                        className="w-full px-6 py-3.5 pr-14 bg-white border border-gray-300 rounded-full text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#213448] focus:ring-4 focus:ring-[#213448]/10 transition-all duration-200 shadow-sm hover:border-gray-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} text-[15px]`}></i>
                                    </button>
                                </div>
                                <div className="mt-2 text-right pr-2">
                                    <Link to="/forgot-password" className="text-[12.5px] text-[#2B6D9B] hover:text-[#184869] font-medium transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Pill Login Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading || cooldown > 0}
                                className={`w-full py-3.5 bg-[#111827] text-white rounded-full font-bold text-[15px] tracking-wide shadow-md flex justify-center items-center gap-2 transition-all duration-200 active:scale-[0.99] ${(isLoading || cooldown > 0) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#213448] hover:shadow-lg'}`}
                            >
                                {cooldown > 0 ? (
                                    <>
                                        <i className="fa-solid fa-lock"></i>
                                        Try again in {cooldown}s
                                    </>
                                ) : isLoading ? (
                                    <>
                                        <i className="fa-solid fa-spinner animate-spin"></i>
                                        Logging in...
                                    </>
                                ) : 'Login'}
                            </button>
                        </div>

                        {/* Create Account Link */}
                        <div className="pt-3 text-center">
                            <p className="text-[13px] text-gray-600">
                                Need a staff or department account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(true);
                                        setRegSuccessData(null);
                                        setRegError('');
                                        setRegData({ firstName: '', lastName: '', email: '', department: 'Registrar' });
                                        setEmailStatus({ checking: false, available: null, message: '' });
                                    }}
                                    className="font-bold text-[#111827] hover:text-[#2B6D9B] transition-colors underline underline-offset-2 ml-1"
                                >
                                    Create Account
                                </button>
                            </p>
                        </div>
                    </form>

                    {/* Account Hints / Demo Accounts */}
                    {showDemoAccounts && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-[11px] text-gray-500 text-center mb-3 uppercase tracking-wider font-semibold">Demo Accounts</p>
                        
                        <div className="flex gap-3">
                            <div
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3.5 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-sm transition-all focus:outline-none"
                                onClick={() => { setEmail('admin@verifitor.com'); setPassword('admin123'); }}
                                role="button"
                                tabIndex={0}
                            >
                                <p className="text-[12px] font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                                    <i className="fa-solid fa-user-tie text-blue-600"></i> Registrar
                                </p>
                                <p className="text-[11px] text-gray-500 m-0 truncate">admin@verifitor.com</p>
                            </div>

                            <div
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3.5 cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 hover:shadow-sm transition-all focus:outline-none"
                                onClick={() => { setEmail('sysadmin@verifitor.com'); setPassword('sysadmin123'); }}
                                role="button"
                                tabIndex={0}
                            >
                                <p className="text-[12px] font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                                    <i className="fa-solid fa-shield-halved text-amber-600"></i> Super Admin
                                </p>
                                <p className="text-[11px] text-gray-500 m-0 truncate">sysadmin@verifitor.com</p>
                            </div>
                        </div>
                    </div>
                    )}

                </div>

                {/* Create Account Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative border border-gray-100 overflow-hidden">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>

                            {!regSuccessData ? (
                                <>
                                    <div className="mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-[#111827] text-white flex items-center justify-center mb-3 text-lg shadow-sm">
                                            <i className="fa-solid fa-user-plus"></i>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Create Staff Account</h3>
                                        <p className="text-gray-500 text-xs mt-1">
                                            Register for your department. A temporary password and verification OTP will be delivered to your email.
                                        </p>
                                    </div>

                                    {regError && (
                                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-[12.5px] flex items-center gap-2">
                                            <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                                            <span>{regError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleCreateAccount} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">First Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="First name"
                                                    value={regData.firstName}
                                                    onChange={(e) => setRegData({ ...regData, firstName: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 focus:bg-white focus:outline-none focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Last Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Last name"
                                                    value={regData.lastName}
                                                    onChange={(e) => setRegData({ ...regData, lastName: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 focus:bg-white focus:outline-none focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-[12px] font-semibold text-gray-700">Official Email</label>
                                                {emailStatus.checking && (
                                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        <i className="fa-solid fa-spinner animate-spin"></i> Checking...
                                                    </span>
                                                )}
                                                {!emailStatus.checking && emailStatus.available === true && (
                                                    <span className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                                                        <i className="fa-solid fa-circle-check"></i> Available
                                                    </span>
                                                )}
                                                {!emailStatus.checking && emailStatus.available === false && (
                                                    <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                                                        <i className="fa-solid fa-circle-xmark"></i> Already registered
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                placeholder="e.g. employee@university.edu"
                                                value={regData.email}
                                                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                                                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-[13.5px] text-gray-800 focus:bg-white focus:outline-none transition-all ${
                                                    emailStatus.available === false 
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                                                        : emailStatus.available === true
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                                                        : 'border-gray-200 focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10'
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Department</label>
                                            <div className="relative">
                                                <select
                                                    value={regData.department}
                                                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-800 focus:bg-white focus:outline-none focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="Registrar">Registrar Department (Staff Level)</option>
                                                    <option value="Accounting">Accounting Department (Staff Level)</option>
                                                    <option value="IT Administration">IT Administration Department</option>
                                                </select>
                                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                                    <i className="fa-solid fa-chevron-down"></i>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                                                <i className="fa-solid fa-circle-info text-blue-500 mr-1"></i>
                                                New accounts are created at <strong>Staff level</strong>. Administrative roles (Registrar Admin & Accounting Admin) are appointed by the Super Administrator.
                                            </p>
                                        </div>

                                        <div className="pt-3 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateModal(false)}
                                                className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-semibold text-[13.5px] transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={regLoading || emailStatus.available === false}
                                                className="w-2/3 py-2.5 bg-[#111827] hover:bg-[#213448] text-white rounded-full font-bold text-[13.5px] tracking-wide shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                                            >
                                                {regLoading ? (
                                                    <>
                                                        <i className="fa-solid fa-spinner animate-spin"></i>
                                                        Sending Credentials...
                                                    </>
                                                ) : (
                                                    'Create Account'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl animate-bounce">
                                        <i className="fa-solid fa-circle-check"></i>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h3>
                                    <p className="text-gray-600 text-xs leading-relaxed max-w-sm mx-auto mb-6">
                                        A <strong>Temporary Password</strong> and your <strong>Verification OTP</strong> have been dispatched to <strong>{regSuccessData.email}</strong>.
                                    </p>
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left mb-6">
                                        <p className="text-[12px] text-amber-800 leading-relaxed m-0">
                                            <i className="fa-solid fa-shield-halved text-amber-600 mr-1.5"></i>
                                            <strong>Next Steps:</strong> Check your inbox for your credentials, log in, and proceed to <em>Profile Settings → Change Password</em> to set your permanent password.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEmail(regSuccessData.email);
                                            setShowCreateModal(false);
                                            setRegSuccessData(null);
                                        }}
                                        className="w-full py-3 bg-[#111827] hover:bg-[#213448] text-white rounded-full font-bold text-[14px] shadow-md transition-all"
                                    >
                                        Proceed to Login
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Hidden UI Button for Demo Accounts Toggle */}
                <button 
                    onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                    className="fixed bottom-0 right-0 w-8 h-8 opacity-0 cursor-default"
                    aria-hidden="true"
                    tabIndex={-1}
                />
            </main>
        </div>
    );
};

export default AdminLogin;

