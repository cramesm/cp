import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

// Import local assets
import loginImage from '../../assets/verifitor-login.png';
import smallLogo from '../../assets/logo-verifitor.png';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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
            const message = err.response?.data?.message || 'Invalid credentials. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans bg-[#F5F6F8]">
            {/* Left Column - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-[#426487] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 bg-[url('/assets/verifitor_bgimage.png')] bg-cover bg-center mix-blend-overlay opacity-80"></div>

                {/* Logo Icon Top Left */}
                <div className="p-8 z-10 relative">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden p-2">
                        <img src={smallLogo} className="w-full h-full object-contain object-left" alt="Icon" />
                    </div>
                </div>

                {/* Hero Text */}
                <div className="px-12 z-10 pt-4 pb-8 relative">
                    <h1 className="text-white text-[42px] font-extrabold leading-[1.2] tracking-wide shadow-sm">
                        INOVATION IN EVERY<br />CREDENTIALS
                    </h1>
                </div>

                {/* Illustration/Image */}
                <div className="flex-grow flex items-end justify-center px-12 z-10 relative">
                    <img 
                        src={loginImage} 
                        alt="Verifitor Platform Preview" 
                        className="max-w-[90%] h-auto object-contain drop-shadow-2xl translate-y-4"
                    />
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-[#f4f7f6]">
                <div className="w-full max-w-[440px]">
                    
                    {/* Logo Header - using the new logo */}
                    <div className="mb-10 flex justify-center">
                        <img src={smallLogo} alt="Verifitor Logo" className="h-[90px] object-contain drop-shadow-sm" />
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center mb-10">
                        <h2 className="text-[32px] font-black text-[#223345] mb-3 tracking-wide">WELCOME!</h2>
                        <p className="text-[#6c757d] text-[13px] font-medium">Enter your email and password to access your account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2" role="alert">
                                <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="relative">
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3.5 bg-white border border-[#dee2e6] rounded-lg text-sm text-[#495057] placeholder-[#adb5bd] focus:outline-none focus:border-[#213448] focus:ring-1 focus:ring-[#213448] transition-all shadow-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <div className="relative">
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        className="w-full px-4 py-3.5 bg-white border border-[#dee2e6] rounded-lg text-sm text-[#495057] placeholder-[#adb5bd] focus:outline-none focus:border-[#213448] focus:ring-1 focus:ring-[#213448] transition-all shadow-sm pr-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#495057] transition-colors focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} text-lg`}></i>
                                    </button>
                                </div>
                                <div className="mt-2 text-right">
                                    <Link to="/forgot-password" className="text-[12px] text-[#73A9D4] hover:text-[#213448] hover:underline font-medium transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 mt-2 bg-[#213448] text-white rounded-lg font-bold text-[15px] tracking-wide transition-all shadow-md flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#152230] hover:shadow-lg hover:-translate-y-0.5'}`}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fa-solid fa-spinner animate-spin"></i>
                                    Logging in...
                                </>
                            ) : 'LOGIN'}
                        </button>
                    </form>

                    {/* Account Hints - Restored */}
                    <div className="mt-10 pt-6 border-t border-gray-200">
                        <p className="text-[10px] text-[#adb5bd] text-center mb-3 uppercase tracking-widest font-bold">Demo Accounts</p>
                        
                        <div className="flex gap-3">
                            <div
                                className="flex-1 bg-white border border-[#e9ecef] rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onClick={() => { setEmail('admin@verifitor.com'); setPassword('admin123'); }}
                                role="button"
                                tabIndex={0}
                            >
                                <p className="text-[11px] font-bold text-[#343a40] mb-1 flex items-center gap-1.5">
                                    <i className="fa-solid fa-user-tie text-blue-500"></i> Registrar
                                </p>
                                <p className="text-[10px] text-[#6c757d] m-0 truncate">admin@verifitor.com</p>
                            </div>

                            <div
                                className="flex-1 bg-white border border-[#e9ecef] rounded-lg p-3 cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                                onClick={() => { setEmail('sysadmin@verifitor.com'); setPassword('sysadmin123'); }}
                                role="button"
                                tabIndex={0}
                            >
                                <p className="text-[11px] font-bold text-[#343a40] mb-1 flex items-center gap-1.5">
                                    <i className="fa-solid fa-shield-halved text-amber-500"></i> Super Admin
                                </p>
                                <p className="text-[10px] text-[#6c757d] m-0 truncate">sysadmin@verifitor.com</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

