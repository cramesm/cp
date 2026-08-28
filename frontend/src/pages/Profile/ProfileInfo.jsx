import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { User, Edit3, LogOut } from 'lucide-react';

const ProfileInfo = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: 'John Dela Cruz',
        email: 'john@email.com',
        role: 'Registrar Administrator',
        profilePic: ''
    });

    // Sync with localStorage so the display reflects edits made in the other page
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('adminUser'));
        if (storedUser) {
            setUser(prev => ({
                ...prev,
                name: storedUser.name || prev.name,
                email: storedUser.email || prev.email,
                role: storedUser.role || prev.role,
                profilePic: storedUser.profilePic || prev.profilePic
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
            <div className="max-w-[860px] mx-auto py-2 px-2 sm:px-4 font-sans space-y-4">
                {/* Top Avatar & Profile Header Card */}
                <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-full bg-[#2c3543] text-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md border-2 border-white">
                            {user.profilePic ? (
                                <img src={user.profilePic.startsWith('http') ? user.profilePic : `http://localhost:5000${user.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} color="white" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-[22px] font-black text-slate-900 m-0 leading-tight">{user.name || 'Registrar Name'}</h3>
                            <span className="inline-block bg-blue-50 text-blue-700 text-[11.5px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full mt-1.5 border border-blue-200/60">
                                {user.role || 'Super Admin'}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/profile')} 
                        className="bg-[#2c3543] hover:bg-[#1f2631] text-white px-6 py-2 rounded-full font-bold text-[13px] transition-all shadow-xs hover:shadow-md cursor-pointer border-none flex items-center gap-2 active:scale-95"
                    >
                        <Edit3 size={14} />
                        <span>Edit Profile</span>
                    </button>
                </div>

                {/* Personal Information Card */}
                <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
                    <div className="py-3.5 px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-black text-slate-900 m-0">Personal Information</h3>
                        <span className="text-[11.5px] font-medium text-slate-400">Account details & identity</span>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-6">
                            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider m-0 mb-1">Firstname</p>
                                <p className="text-[14.5px] font-bold text-slate-800 m-0">{user.name ? user.name.split(' ')[0] : 'Registrar'}</p>
                            </div>
                            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider m-0 mb-1">Lastname</p>
                                <p className="text-[14.5px] font-bold text-slate-800 m-0">{user.name ? user.name.split(' ').slice(1).join(' ') || 'Name' : 'Lastname'}</p>
                            </div>
                            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider m-0 mb-1">Employee ID</p>
                                <p className="text-[14.5px] font-bold text-slate-800 m-0 font-mono">ID-123456</p>
                            </div>
                            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 lg:col-span-2">
                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider m-0 mb-1">Email Address</p>
                                <p className="text-[14.5px] font-bold text-slate-800 m-0">{user.email || 'registrarname@sample.com'}</p>
                            </div>
                            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider m-0 mb-1">User Role</p>
                                <p className="text-[14.5px] font-bold text-slate-800 m-0 capitalize">{user.role || 'Super Admin'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfileInfo;