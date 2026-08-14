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
        <div className="min-h-screen flex items-center justify-center font-sans bg-[#212121] p-4">
            {/* Centered Card */}
            <div className="flex flex-col lg:flex-row w-full max-w-[1000px] bg-[#f4f4f4] rounded-2xl overflow-hidden shadow-2xl min-h-[600px]">
                
                {/* Left Column - Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-[#385b7c] p-10 overflow-hidden">
                    {/* Dark overlay or background image if verifitor_bgimage.png exists */}
                    <div className="absolute inset-0 bg-[url('/assets/verifitor_bgimage.png')] bg-cover bg-center opacity-50 mix-blend-overlay"></div>

                    {/* Logo Icon Top Left */}
                    <div className="z-10 relative">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md p-1">
                            <img src="/assets/verifitorlogo.png" className="w-full h-full object-contain scale-[1.3] object-left" alt="Icon" />
                        </div>
                    </div>

                    {/* Hero Text */}
                    <div className="z-10 relative mt-6">
                        <h1 className="text-white text-[32px] font-bold leading-tight tracking-wide text-center">
                            INOVATION IN EVERY<br />CREDENTIALS
                        </h1>
                    </div>

                    {/* Illustration/Image */}
                    <div className="flex-grow flex items-end justify-center z-10 relative mt-4">
                        <img 
                            src={loginImage} 
                            alt="Verifitor Platform Preview" 
                            className="w-full max-w-[350px] h-auto object-contain translate-y-6"
                        />
                    </div>
                </div>

                {/* Right Column - Login Form */}
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-[#f4f4f4]">
                    <div className="w-full max-w-[340px]">
                        
                        {/* Logo Header */}
                        <div className="mb-6 flex justify-center">
                            <img src="/assets/verifitorlogo.png" alt="Verifitor Logo" className="h-[60px] object-contain" />
                        </div>

                        {/* Welcome Text */}
                        <div className="text-center mb-8">
                            <h2 className="text-[28px] font-bold text-[#1f2937] mb-2 tracking-wide">WELCOME!</h2>
                            <p className="text-[#6b7280] text-[11px]">Enter your email and password to access your account</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center gap-2" role="alert">
                                    <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#213448] shadow-sm"
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
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#213448] shadow-sm pr-12"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        </button>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <Link to="/forgot-password" className="text-[11px] text-[#73A9D4] hover:text-[#213448] font-medium transition-colors">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3.5 mt-4 bg-[#213448] text-white rounded-lg font-semibold text-[14px] tracking-wide shadow-md flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#152230]'}`}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fa-solid fa-spinner animate-spin"></i>
                                        Logging in...
                                    </>
                                ) : 'LOGIN'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

