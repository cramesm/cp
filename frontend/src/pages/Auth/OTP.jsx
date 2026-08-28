import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api';

const OTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (index, e) => {
        const value = e.target.value;
        if (/^[0-9]$/.test(value) || value === '') {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Move to next input if typing a number
            if (value !== '' && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            setShowModal(true);
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/verify-otp', { email, otp: otpCode });
            if (response.data.success) {
                navigate('/change-password', { state: { resetToken: response.data.resetToken } });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsResending(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.success) {
                setMessage('A new OTP has been sent to your email.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setIsResending(false);
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
                
                {/* Back Arrow */}
                <button 
                    onClick={() => navigate('/forgot-password')}
                    className="absolute top-6 left-6 sm:top-8 sm:left-8 w-11 h-11 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 shadow-sm focus:outline-none"
                    aria-label="Back to Forgot Password"
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
                            Verify OTP
                        </h2>
                        <p className="text-[#6B7280] text-[13.5px] font-normal leading-relaxed">
                            Enter the 6-digit code sent to <span className="font-semibold text-gray-800">{email || 'your email'}</span>
                        </p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-[13px] mb-6 flex items-center gap-2" role="alert">
                            <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {message && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-[13px] mb-6 flex items-center gap-2" role="status">
                            <i className="fa-solid fa-circle-check shrink-0"></i>
                            <span>{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleVerify} id="otp-form" className="space-y-6">
                        <div className="flex justify-center gap-2 sm:gap-3 my-4 w-full">
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => (inputRefs.current[idx] = el)}
                                    type="text"
                                    maxLength="1"
                                    className="w-[46px] h-[56px] sm:w-[52px] sm:h-[62px] border border-gray-300 rounded-2xl text-center text-2xl font-bold text-[#111827] outline-none bg-white shadow-sm transition-all duration-200 focus:border-[#213448] focus:ring-4 focus:ring-[#213448]/10 hover:border-gray-400"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handleChange(idx, e)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    autoFocus={idx === 0}
                                />
                            ))}
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
                                        Verifying...
                                    </>
                                ) : 'Verify Code'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center space-y-3 mt-8">
                        <p className="text-[13px] text-gray-500">
                            Didn't receive code?{' '}
                            <button 
                                onClick={handleResendOTP} 
                                disabled={isResending}
                                className="text-[#2B6D9B] font-semibold hover:underline focus:outline-none disabled:opacity-50"
                            >
                                {isResending ? 'Sending...' : 'Resend Code'}
                            </button>
                        </p>
                        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#2B6D9B] hover:text-[#184869] font-medium transition-colors">
                            <i className="fa-solid fa-chevron-left text-[10px]"></i>
                            <span>Back to Login</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Incomplete code modal */}
            {showModal && (
                <div id="error-modal" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-[340px] p-6 rounded-3xl text-center shadow-2xl animate-scaleIn">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl">
                            <i className="fa-solid fa-circle-exclamation"></i>
                        </div>
                        <h3 className="text-[18px] font-bold text-gray-900 mb-2">Incomplete Code</h3>
                        <p className="text-gray-500 text-[13.5px] mb-6 leading-relaxed">Please enter the complete 6-digit verification code to proceed.</p>
                        <button 
                            className="bg-[#111827] text-white py-3 px-6 rounded-full font-semibold text-sm cursor-pointer w-full transition-colors hover:bg-[#213448]" 
                            onClick={() => setShowModal(false)}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OTP;
