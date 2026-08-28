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

                    {/* Footer / Info note */}
                    <div className="mt-8 text-center">
                        <p className="text-[12.5px] text-gray-500">
                            Need technical support? <span className="text-[#2B6D9B] font-medium cursor-pointer hover:underline" onClick={() => setShowDemoAccounts(!showDemoAccounts)}>Contact Administrator</span>
                        </p>
                    </div>

                </div>

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

