import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { User, Edit3, LogOut } from 'lucide-react';

const ProfileInfo = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: 'John Dela Cruz',
        username: 'john.123',
        email: 'john@email.com',
        contact: '63987654321',
        role: 'Registrar Administrator'
    });

    // Sync with localStorage so the display reflects edits made in the other page
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('adminUser'));
        if (storedUser) {
            setUser(prev => ({
                ...prev,
                name: storedUser.name || prev.name,
                username: storedUser.username || prev.username,
                email: storedUser.email || prev.email,
                role: storedUser.role || prev.role
            }));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <Layout>
            <div className="p-10 bg-[#f8fafc] min-h-screen font-sans">
                {/* Profile Card */}
                <div className="max-w-[900px] mx-auto bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <h3 className="text-[20px] font-semibold text-[#1D2D44] mb-8 px-4">
                            Basic Information
                        </h3>

                        <div className="flex flex-col md:flex-row items-center gap-12 px-4">
                            {/* Avatar Section */}
                            <div className="flex-shrink-0">
                                <div className="w-48 h-48 rounded-full bg-[#1D2D44] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                    <User size={100} color="white" strokeWidth={1.5} />
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="flex-1 grid grid-cols-[150px_1fr] gap-y-6 text-[15px]">
                                <span className="text-gray-500 font-medium">Name:</span>
                                <span className="text-gray-800">{user.name}</span>

                                <span className="text-gray-500 font-medium">Username:</span>
                                <span className="text-gray-800">{user.username}</span>

                                <span className="text-gray-500 font-medium">Email:</span>
                                <span className="text-gray-800 underline decoration-gray-200">{user.email}</span>

                                <span className="text-gray-500 font-medium">Contact Number:</span>
                                <span className="text-gray-800">{user.contact}</span>

                                <span className="text-gray-500 font-medium">Role:</span>
                                <span className="text-[#1D2D44] font-bold uppercase tracking-wide text-xs">{user.role}</span>
                            </div>
                        </div>

                        {/* Updated Edit Button to Navigate to Profile */}
                        <div className="mt-10 flex justify-center border-t border-gray-50 pt-8">
                            <button 
                                onClick={() => navigate('/profile')} 
                                className="flex items-center gap-2 bg-[#1D2D44] text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-[#152030] transition-all shadow-md active:scale-95"
                            >
                                <Edit3 size={16} />
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Logout Button */}
                <div className="max-w-[900px] mx-auto mt-8 flex justify-end px-4">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-[#1D2D44] text-white px-10 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg active:scale-95"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default ProfileInfo;