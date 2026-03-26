import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userRole', response.data.user.role);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="font-sans bg-[#f2f2f2] m-0 p-0 bg-[url('/assets/verifitor_bgimage.png')] bg-cover bg-center bg-no-repeat h-screen flex items-center justify-center">
            <div className="w-[400px] p-[60px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-[20px]">
                <img src="/assets/verifitorlogo.png" className="block mx-auto mb-5 w-[200px] h-auto" alt="Verifitor Logo" />
                <div>
                    <form onSubmit={handleLogin}>
                        <label htmlFor="email" className="block mb-2.5 text-black font-bold">Login to your Account</label>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            placeholder="Email" 
                            className="w-full p-2.5 mb-[15px] border border-[#ccc] rounded-[10px] shadow-[0_0_20px_rgba(0,0,0,0.1)] focus:outline-none focus:border-[#213448]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                        
                        <div className="relative w-full">
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                id="new-password" 
                                placeholder="Password" 
                                className="w-full p-2.5 mb-[15px] border border-[#ccc] rounded-[10px] shadow-[0_0_20px_rgba(0,0,0,0.1)] focus:outline-none focus:border-[#213448]" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            <i 
                                className={`fa-solid absolute right-[15px] top-[35%] -translate-y-1/2 text-[#777] cursor-pointer text-sm hover:text-[#333] ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                                onClick={() => setShowPassword(!showPassword)}
                            ></i>
                        </div>

                        <Link to="/forgot-password" className="text-right block text-xs text-[#73A9D4] no-underline">Forgot Password?</Link>

                        <button 
                            type="submit"
                            className="w-full p-2.5 bg-[#213448] text-white border-none rounded-[10px] cursor-pointer text-base mt-2.5 hover:bg-[#1a2735] transition-colors"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
