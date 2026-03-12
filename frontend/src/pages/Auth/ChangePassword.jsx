import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [modal, setModal] = useState({ show: false, title: '', message: '' });
    const navigate = useNavigate();

    const validatePassword = (pwd) => {
        return pwd.length >= 8; // simplified validation for this step
    };

    const handleSave = (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setModal({
                show: true,
                title: 'Password Mismatch',
                message: 'The entered passwords do not match. Please try again.'
            });
            return;
        }

        if (!validatePassword(password)) {
            setModal({
                show: true,
                title: 'Weak Password',
                message: 'Password must be at least 8 characters long.'
            });
            return;
        }

        // Normally, call API to save new password here.
        // On success:
        navigate('/login', { state: { message: 'Password reset successful. Please login.' } });
    };

    return (
        <div className="font-sans bg-[#f2f2f2] m-0 p-0 bg-[url('/assets/verifitor_bgimage.png')] bg-cover bg-center bg-no-repeat h-screen flex items-center justify-center">
            <div className="bg-white w-[420px] px-[40px] py-[50px] rounded-[15px] text-center shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative">
                <h2 className="text-2xl font-bold text-black mb-10">Reset Password</h2>
                
                <form onSubmit={handleSave} id="reset-form">
                    
                    <div className="text-left mb-[25px]">
                        <label htmlFor="new-password" className="block text-[14px] font-medium text-[#333] mb-2">New Password</label>
                        <div className="relative w-full">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="new-password" 
                                className="w-full pl-[15px] pr-[40px] py-[12px] border border-[#dcdcdc] rounded-lg text-[14px] outline-none bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-colors duration-300 focus:border-[#213448]" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            <i 
                                className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} absolute right-[15px] top-1/2 -translate-y-1/2 text-[#777] cursor-pointer text-[14px] hover:text-[#333]`}
                                onClick={() => setShowPassword(!showPassword)}
                            ></i>
                        </div>
                    </div>

                    <div className="text-left mb-[25px]">
                        <label htmlFor="confirm-password" className="block text-[14px] font-medium text-[#333] mb-2">Confirm Password</label>
                        <div className="relative w-full">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                id="confirm-password" 
                                className="w-full pl-[15px] pr-[40px] py-[12px] border border-[#dcdcdc] rounded-lg text-[14px] outline-none bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-colors duration-300 focus:border-[#213448]" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                            />
                            <i 
                                className={`fa-solid ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'} absolute right-[15px] top-1/2 -translate-y-1/2 text-[#777] cursor-pointer text-[14px] hover:text-[#333]`}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            ></i>
                        </div>
                    </div>

                    <div className="mt-[35px]">
                        <button type="submit" className="w-full bg-[#213448] text-white border-none py-[12px] px-[30px] rounded-lg font-semibold text-[14px] cursor-pointer transition-all duration-300 hover:bg-[#1a252f] hover:-translate-y-0.5">Save New Password</button>
                    </div>
                </form>

                {modal.show && (
                    <div id="error-modal" className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1000] flex justify-center items-center">
                        <div className="bg-white w-[320px] p-[30px] rounded-xl text-center shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                            <div className="text-[40px] text-[#e74c3c] mb-[15px]">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <h3 className="m-0 mb-2.5 text-[#333] text-[18px]">{modal.title}</h3>
                            <p id="modal-message" className="text-[#666] text-[14px] mb-[25px] leading-relaxed">{modal.message}</p>
                            <button className="bg-[#213448] text-white border-none py-[10px] px-[30px] rounded-lg font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#1a252f]" onClick={() => setModal({ show: false, title: '', message: '' })}>Try Again</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ChangePassword;
