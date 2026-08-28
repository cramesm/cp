import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

// Import local assets
import loginImage from '../../assets/verifitor-login.webp';
import smallLogo from '../../assets/verifitor_logo.webp';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.success) {
                navigate('/otp', { state: { email } });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
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

            {/* Right Column - Form */}
            <main className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-[#ffffff] relative overflow-y-auto">
                
                {/* Clean Pill/Circle Back Arrow */}
                <button 
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 sm:top-8 sm:left-8 w-11 h-11 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 shadow-sm focus:outline-none"
                    aria-label="Back to Login"
                >
                    <i className="fa-solid fa-arrow-left text-[14px]"></i>
                </button>

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

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-[30px] sm:text-[34px] font-extrabold text-[#111827] mb-2 tracking-tight">
                            Forgot password?
                        </h2>
                        <p className="text-[#6B7280] text-[13.5px] font-normal leading-relaxed">
                            Enter your registered email address to receive a One-Time Password (OTP) verification code.
                        </p>
                    </div>

                    <form onSubmit={handleSendOTP} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-[13px] flex items-center gap-2 animate-shake" role="alert">
                                <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Email Pill Input */}
                        <div className="relative">
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="Enter your email address" 
                                className="w-full px-6 py-3.5 bg-white border border-gray-300 rounded-full text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#213448] focus:ring-4 focus:ring-[#213448]/10 transition-all duration-200 shadow-sm hover:border-gray-400"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>

                        {/* Submit Pill Button */}
                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full py-3.5 bg-[#111827] text-white rounded-full font-bold text-[15px] tracking-wide shadow-md flex justify-center items-center gap-2 transition-all duration-200 active:scale-[0.99] ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#213448] hover:shadow-lg'}`}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fa-solid fa-spinner animate-spin"></i>
                                        Sending Code...
                                    </>
                                ) : 'Send OTP'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-8">
                        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#2B6D9B] hover:text-[#184869] font-medium transition-colors">
                            <i className="fa-solid fa-chevron-left text-[10px]"></i>
                            <span>Back to Login</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;
