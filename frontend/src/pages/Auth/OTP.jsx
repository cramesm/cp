import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const OTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showModal, setShowModal] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

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

    const handleVerify = (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            setShowModal(true);
            return;
        }

        // Normally verify OTP via API here. 
        // We'll simulate success and navigate to change password.
        navigate('/change-password', { state: { email, otp: otpCode } });
    };

    return (
        <div className="font-sans bg-[#f2f2f2] m-0 p-0 bg-[url('/assets/verifitor_bgimage.png')] bg-cover bg-center bg-no-repeat h-screen flex items-center justify-center">
            <div className="bg-white w-[450px] px-[40px] py-[60px] rounded-[15px] text-center shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative">
                <h2 className="text-[26px] font-bold text-black mb-10">Verify OTP</h2>
                
                <p className="text-left text-[14px] text-[#333] mb-[15px] pl-[5px]">Enter OTP Code sent to {email}</p>

                <form onSubmit={handleVerify} id="otp-form">
                    <div className="flex justify-between gap-2.5 mb-[30px]">
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => (inputRefs.current[idx] = el)}
                                type="text"
                                maxLength="1"
                                className="w-[50px] h-[55px] border border-[#dcdcdc] rounded-lg text-center text-2xl font-semibold text-[#333] outline-none bg-white shadow-[0_2px_5px_rgba(0,0,0,0.05)] transition-colors duration-300 focus:border-[#213448] focus:shadow-[0_0_0_2px_rgba(33,52,72,0.1)]"
                                inputMode="numeric"
                                value={digit}
                                onChange={(e) => handleChange(idx, e)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                            />
                        ))}
                    </div>

                    <div className="mb-[15px]">
                        <button type="submit" className="bg-[#213448] text-white border-none py-2.5 px-[25px] rounded-lg font-semibold text-[14px] cursor-pointer transition-all duration-300 hover:bg-[#1a252f]">Verify</button>
                    </div>
                </form>

                <Link to="#" className="block text-[13px] text-[#5d7b9d] no-underline font-medium hover:underline">Resend OTP</Link>
            </div>

            {showModal && (
                <div id="error-modal" className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1000] flex justify-center items-center">
                    <div className="bg-white w-[320px] p-[30px] rounded-xl text-center shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <div className="text-[40px] text-[#e74c3c] mb-[15px]">
                            <i className="fa-solid fa-circle-exclamation"></i>
                        </div>
                        <h3 className="m-0 mb-2.5 text-[#333] text-[18px]">Incomplete Code</h3>
                        <p className="text-[#666] text-[14px] mb-[25px] leading-relaxed">Please enter the complete 6-digit code to proceed.</p>
                        <button className="bg-[#213448] text-white border-none py-2.5 px-[30px] rounded-lg font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#1a252f]" onClick={() => setShowModal(false)}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OTP;
