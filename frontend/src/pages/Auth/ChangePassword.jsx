import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api';

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'error' });
    const navigate = useNavigate();
    const location = useLocation();
    const resetToken = location.state?.resetToken;

    const validatePassword = (pwd) => {
        return pwd.length >= 8;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setModal({
                show: true,
                title: 'Password Mismatch',
                message: 'The entered passwords do not match. Please make sure both fields match.',
                type: 'error'
            });
            return;
        }

        if (!validatePassword(password)) {
            setModal({
                show: true,
                title: 'Weak Password',
                message: 'Password must be at least 8 characters long.',
                type: 'error'
            });
            return;
        }
        
        if (!resetToken) {
            setModal({
                show: true,
                title: 'Session Expired',
                message: 'Missing or expired reset token. Please restart the password reset process.',
                type: 'error'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/reset-password', {
                resetToken,
                newPassword: password
            });

            if (response.data.success) {
                setModal({
                    show: true,
                    title: 'Success!',
                    message: 'Your password has been changed successfully. You can now log in.',
                    type: 'success'
                });
            }
        } catch (err) {
            setModal({
                show: true,
                title: 'Reset Failed',
                message: err.response?.data?.message || 'Failed to reset password. Please try again.',
                type: 'error'
            });
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
                
                {/* Back Arrow */}
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
                            Reset password
                        </h2>
                        <p className="text-[#6B7280] text-[13.5px] font-normal leading-relaxed">
                            Create a strong new password for your account (min. 8 characters)
                        </p>
                    </div>
                    
                    <form onSubmit={handleSave} id="reset-form" className="space-y-5">
                        <div className="space-y-4">
                            {/* New Password Pill Input */}
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="new-password" 
                                    placeholder="New Password"
                                    className="w-full px-6 py-3.5 pr-14 bg-white border border-gray-300 rounded-full text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#213448] focus:ring-4 focus:ring-[#213448]/10 transition-all duration-200 shadow-sm hover:border-gray-400" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} text-[15px]`}></i>
                                </button>
                            </div>

                            {/* Confirm Password Pill Input */}
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    id="confirm-password" 
                                    placeholder="Confirm New Password"
                                    className="w-full px-6 py-3.5 pr-14 bg-white border border-gray-300 rounded-full text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#213448] focus:ring-4 focus:ring-[#213448]/10 transition-all duration-200 shadow-sm hover:border-gray-400" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required 
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                >
                                    <i className={`fa-solid ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'} text-[15px]`}></i>
                                </button>
                            </div>
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
                                        Saving Password...
                                    </>
                                ) : 'Save New Password'}
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

            {/* Modal */}
            {modal.show && (
                <div id="error-modal" className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-[340px] p-6 rounded-3xl text-center shadow-2xl animate-scaleIn">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl ${modal.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            <i className={`fa-solid ${modal.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                        </div>
                        <h3 className="text-[18px] font-bold text-gray-900 mb-2">{modal.title}</h3>
                        <p id="modal-message" className="text-gray-500 text-[13.5px] mb-6 leading-relaxed">{modal.message}</p>
                        <button 
                            className="bg-[#111827] text-white py-3 px-6 rounded-full font-semibold text-sm cursor-pointer w-full transition-colors hover:bg-[#213448]" 
                            onClick={() => {
                                setModal({ show: false, title: '', message: '', type: 'error' });
                                if (modal.type === 'success') {
                                    navigate('/');
                                }
                            }}
                        >
                            {modal.type === 'success' ? 'Go to Login' : 'Try Again'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChangePassword;
