import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showDemoAccounts, setShowDemoAccounts] = useState(false);
    const [demoDeptFilter, setDemoDeptFilter] = useState('All');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();

    // If already authenticated with active token & staff role, auto-navigate to dashboard
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = (localStorage.getItem('userRole') || '').toLowerCase().trim();
        const staffRoles = [
            'super admin', 'it administrator', 'it admin', 'it staff', 'it',
            'registrar admin', 'registrar staff', 'registrar',
            'accounting admin', 'accounting staff', 'accounting',
            'admin', 'staff'
        ];
        const isStaff = staffRoles.includes(role) || 
            (role && !['student', 'alumni'].includes(role) && (
                role.includes('admin') || role.includes('staff') || role.includes('registrar') || role.includes('accounting') || role.includes('it')
            ));

        if (token && isStaff) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const demoAccountsList = [
        {
            dept: 'Executive',
            role: 'Super Admin',
            name: 'Super Admin',
            email: 'sysadmin@verifitor.com',
            pass: 'sysadmin123',
            icon: 'fa-shield-halved',
            color: 'text-amber-600',
            bg: 'bg-amber-50/60 border-amber-200 hover:border-amber-400',
            badgeBg: 'bg-amber-100 text-amber-800',
            desc: 'Root authority across all 3 departments'
        },
        {
            dept: 'Registrar',
            role: 'Registrar Admin',
            name: 'Dr. Maria Santos',
            email: 'reg.admin@verifitor.com',
            pass: 'registrar123',
            icon: 'fa-user-tie',
            color: 'text-blue-600',
            bg: 'bg-blue-50/60 border-blue-200 hover:border-blue-400',
            badgeBg: 'bg-blue-100 text-blue-800',
            desc: 'Supervises document queues & staff logs'
        },
        {
            dept: 'Registrar',
            role: 'Registrar Staff',
            name: 'Juan De La Cruz',
            email: 'reg.staff@verifitor.com',
            pass: 'registrar123',
            icon: 'fa-file-signature',
            color: 'text-cyan-600',
            bg: 'bg-cyan-50/60 border-cyan-200 hover:border-cyan-400',
            badgeBg: 'bg-cyan-100 text-cyan-800',
            desc: 'Compiles & anchors credentials on blockchain'
        },
        {
            dept: 'Accounting',
            role: 'Accounting Admin',
            name: 'Eleanor Reyes',
            email: 'acc.admin@verifitor.com',
            pass: 'accounting123',
            icon: 'fa-wallet',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400',
            badgeBg: 'bg-emerald-100 text-emerald-800',
            desc: 'EOD reconciliation & refund authorization'
        },
        {
            dept: 'Accounting',
            role: 'Accounting Staff',
            name: 'Carlos Mendoza',
            email: 'acc.staff@verifitor.com',
            pass: 'accounting123',
            icon: 'fa-cash-register',
            color: 'text-teal-600',
            bg: 'bg-teal-50/60 border-teal-200 hover:border-teal-400',
            badgeBg: 'bg-teal-100 text-teal-800',
            desc: 'Audits student GCash/Bank receipts'
        },
        {
            dept: 'IT Administration',
            role: 'IT Administrator',
            name: 'Mark Anthony Diaz',
            email: 'it.admin@verifitor.com',
            pass: 'itadmin123',
            icon: 'fa-server',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-400',
            badgeBg: 'bg-indigo-100 text-indigo-800',
            desc: 'System health, backups & staff IAM'
        }
    ];

    const filteredDemoAccounts = demoDeptFilter === 'All' 
        ? demoAccountsList 
        : demoAccountsList.filter(acc => acc.dept.toLowerCase().includes(demoDeptFilter.toLowerCase()));


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
            const response = await api.post('/auth/login', { 
                email: email.trim().toLowerCase(), 
                password: password.trim() 
            });
            if (response.data.success || response.data.token) {
                const user = response.data.user || {};
                const role = (user.role || '').toLowerCase();
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

                const isInstitutionalStaff = 
                    staffRoles.includes(role) || 
                    role.includes('admin') || 
                    role.includes('staff') || 
                    role.includes('registrar') || 
                    role.includes('accounting') || 
                    role.includes('it');

                if (!isInstitutionalStaff || role === 'student' || role === 'alumni') {
                    setError('Access Restricted: Student and alumni accounts must sign in using the VeriFitor Mobile App.');
                    setIsLoading(false);
                    return;
                }

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(user));

                if (user.role) {
                    localStorage.setItem('userRole', user.role);
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
                    </form>

                    {/* Account Hints / Demo Accounts Expanded Panel */}
                    {showDemoAccounts && (
                        <div className="mt-6 pt-4 border-t border-gray-200 animate-fadeIn">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Demo Accounts (By Role)</p>
                                <button
                                    type="button"
                                    onClick={() => setShowDemoAccounts(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xs px-1 cursor-pointer transition-colors"
                                    title="Close Demo Accounts"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* Department Filter Pills */}
                            <div className="flex flex-wrap gap-1 mb-3">
                                {['All', 'Registrar', 'Accounting', 'IT', 'Executive'].map(dept => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => setDemoDeptFilter(dept)}
                                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                                            demoDeptFilter === dept 
                                                ? 'bg-[#111827] text-white shadow-xs' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                            </div>

                            {/* Demo Accounts Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                {filteredDemoAccounts.map((acc) => (
                                    <div
                                        key={acc.email}
                                        onClick={() => {
                                            setEmail(acc.email);
                                            setPassword(acc.pass);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className={`border rounded-xl p-2.5 cursor-pointer transition-all focus:outline-none ${acc.bg} ${
                                            email === acc.email ? 'ring-2 ring-[#111827] shadow-sm' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`text-[11.5px] font-bold ${acc.color} flex items-center gap-1.5`}>
                                                <i className={`fa-solid ${acc.icon}`}></i> {acc.role}
                                            </p>
                                            <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-semibold ${acc.badgeBg}`}>
                                                {acc.dept}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-800 font-medium truncate">{acc.name}</p>
                                        <p className="text-[10px] text-gray-500 font-mono truncate">{acc.email}</p>
                                        <p className="text-[9.5px] text-gray-400 mt-1 italic leading-tight truncate">{acc.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Hidden UI Button for Demo Accounts Toggle (Bottom Right) */}
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

