import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { User, ShieldCheck, Save, X, Camera, CheckCircle, AlertCircle } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();

    // User Information State
    const [user, setUser] = useState({
        name: 'John Dela Cruz',
        email: 'john@email.com',
        username: 'john.123',
        role: 'Registrar Administrator'
    });

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        newGroup: '',
        confirm: ''
    });

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const handleProfileChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const triggerToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const handleConfirmAll = () => {
        // 1. Password Validation (Only if user typed something in new password)
        if (passwords.newGroup && passwords.newGroup !== passwords.confirm) {
            triggerToast("New passwords do not match!", "error");
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
            return;
        }

        // 2. Save logic to LocalStorage
        localStorage.setItem('adminUser', JSON.stringify(user));
        
        // 3. Show Toast
        triggerToast("Changes are saved successfully!");

        // 4. Navigate specifically to /profile/info after a short delay
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
            navigate('/profile/info');
        }, 2000);
    };

    return (
        <Layout>
            <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans relative">
                
                {/* --- DYNAMIC TOAST COMPONENT --- */}
                {toast.show && (
                    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl transition-all duration-300 transform translate-y-0 ${
                        toast.type === 'success' ? 'bg-[#1D2D44] text-white' : 'bg-red-600 text-white'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                        <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="max-w-[900px] mx-auto">
                    <h3 className="text-[22px] font-bold mb-6 text-[#1D2D44]">Edit Admin Profile</h3>

                    {/* --- BASIC INFORMATION CARD --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="p-8">
                            <div className="flex items-center gap-2 mb-8 text-[#1D2D44]">
                                <User size={20} />
                                <h4 className="text-[18px] font-bold">Basic Information</h4>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-12">
                                <div className="flex flex-col items-center w-full md:w-48">
                                    <div className="relative group">
                                        <div className="w-32 h-32 bg-[#F1F5F9] rounded-full mb-4 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                                            <User size={80} className="text-gray-300" />
                                        </div>
                                        <button className="absolute bottom-4 right-0 bg-[#1D2D44] text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                                            <Camera size={16} />
                                        </button>
                                    </div>
                                    <span className="text-[#1D2D44] font-bold text-[12px] cursor-pointer hover:underline uppercase tracking-wide">Change Photo</span>
                                </div>

                                <div className="flex-1 space-y-5">
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="w-32 text-sm font-bold text-gray-600">Name:</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            value={user.name} 
                                            onChange={handleProfileChange} 
                                            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:border-[#1D2D44] transition-all" 
                                        />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="w-32 text-sm font-bold text-gray-600">Email:</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={user.email} 
                                            onChange={handleProfileChange} 
                                            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:border-[#1D2D44] transition-all" 
                                        />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="w-32 text-sm font-bold text-gray-600">Username:</label>
                                        <input 
                                            type="text" 
                                            name="username" 
                                            value={user.username} 
                                            onChange={handleProfileChange} 
                                            className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:border-[#1D2D44] transition-all" 
                                        />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <label className="w-32 text-sm font-bold text-gray-600">Role:</label>
                                        <span className="text-sm text-[#1D2D44] font-bold px-1 uppercase tracking-widest">{user.role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- SECURITY CARD --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-8">
                            <div className="flex items-center gap-2 mb-8 text-[#1D2D44]">
                                <ShieldCheck size={20} />
                                <h4 className="text-[18px] font-bold">Security & Password</h4>
                            </div>
                            
                            <div className="max-w-xl space-y-5">
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <label className="w-40 text-sm font-bold text-gray-600">Current Password:</label>
                                    <input 
                                        type="password" 
                                        name="current" 
                                        placeholder="••••••••"
                                        value={passwords.current} 
                                        onChange={handlePasswordChange} 
                                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:border-[#1D2D44]" 
                                    />
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <label className="w-40 text-sm font-bold text-gray-600">New Password:</label>
                                    <input 
                                        type="password" 
                                        name="newGroup" 
                                        placeholder="New Password"
                                        value={passwords.newGroup} 
                                        onChange={handlePasswordChange} 
                                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:border-[#1D2D44]" 
                                    />
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <label className="w-40 text-sm font-bold text-gray-600">Confirm Password:</label>
                                    <input 
                                        type="password" 
                                        name="confirm" 
                                        placeholder="Confirm New Password"
                                        value={passwords.confirm} 
                                        onChange={handlePasswordChange} 
                                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:border-[#1D2D44]" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- GLOBAL ACTIONS --- */}
                    <div className="flex justify-end gap-3 mt-8">
                        <button 
                            className="bg-white border border-gray-300 text-gray-600 py-2.5 px-8 rounded-full font-bold text-[12px] hover:bg-gray-50 transition-colors uppercase tracking-wide"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button 
                            className="bg-[#1D2D44] text-white py-2.5 px-10 rounded-full font-bold text-[12px] hover:bg-[#152030] transition-all shadow-lg active:scale-95 flex items-center gap-2 uppercase tracking-widest"
                            onClick={handleConfirmAll}
                        >
                            <Save size={16} />
                            Confirm Changes
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
