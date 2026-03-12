import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            // Simulated API call for sending OTP
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.success) {
                // For demonstration, navigate straight to OTP page.
                // Normally you'd pass the email in state so the OTP page knows who to verify.
                navigate('/otp', { state: { email } });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        }
    };

    return (
        <div className="font-sans bg-[#f2f2f2] m-0 p-0 bg-[url('/assets/verifitor_bgimage.png')] bg-cover bg-center bg-no-repeat h-screen flex items-center justify-center">
            <div className="bg-white w-[420px] px-[30px] py-[40px] rounded-[15px] text-center shadow-[0_10px_25px_rgba(0,0,0,0.15)]">
                <div className="mb-5">
                    <img src="/assets/verifitorlogo.png" alt="Verifitor" className="w-[160px] block mx-auto" />
                </div>

                <h2 className="text-2xl font-bold text-black mb-[15px]">Forgot Password</h2>
                
                <p className="text-[13px] text-[#666] leading-relaxed mb-[30px] px-5">
                    Enter your registered email address to receive a One-Time Password (OTP).
                </p>

                <div className="text-left">
                    <form onSubmit={handleSendOTP}>
                        <div className="mb-[25px]">
                            <label htmlFor="email" className="block text-[14px] font-medium text-[#333] mb-2">Email Address</label>
                            {error && <p className="text-red-500 text-[12px] mb-[5px]">{error}</p>}
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="Email" 
                                className="w-full px-[15px] py-[12px] border border-[#e0e0e0] rounded-lg text-[14px] outline-none bg-white transition-colors duration-300 focus:border-[#2c3e50] placeholder:text-[#bbb]" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="mb-[15px] text-center">
                            <button 
                                type="submit" 
                                className="bg-[#213448] text-white border-none py-2.5 px-[25px] rounded-lg font-semibold text-[14px] cursor-pointer transition-all duration-300 hover:bg-[#1a252f] hover:-translate-y-0.5"
                            >
                                Send OTP
                            </button>
                        </div>
                    </form>

                    <Link to="/login" className="inline-block text-[13px] text-[#5d7b9d] no-underline font-medium transition-colors duration-300 hover:text-[#213448] hover:underline mx-auto text-center w-full">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
