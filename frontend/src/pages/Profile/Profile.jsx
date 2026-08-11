import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api';
import { User, ShieldCheck, Save, X, Camera, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();

    // User Information State
    const [user, setUser] = useState({
        name: '',
        email: '',
        role: ''
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        newGroup: '',
        confirm: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState(null);
    let isExecuting = false;
    const showConfirm = ({ title, message, onConfirm, type = 'info', confirmText = 'Confirm' }) => {
        setConfirmConfig({
            title,
            message,
            onConfirm: async () => {
                if (isExecuting) return;
                isExecuting = true;
                setConfirmConfig(prev => ({ ...prev, isLoading: true }));
                try {
                    await onConfirm();
                } catch (err) {
                    console.error(err);
                } finally {
                    isExecuting = false;
                    setConfirmConfig(null);
                }
            },
            type,
            confirmText,
            cancelText: 'Cancel',
            isLoading: false
        });
    };

    const triggerToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        // Auto-hide toast after 3s
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleProfileChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                setUser({
                    name: res.data.name || '',
                    email: res.data.email || '',
                    role: res.data.role || ''
                });
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = () => {
        if (!user.name || !user.name.trim()) {
            triggerToast("Name is required", "error");
            return;
        }

        showConfirm({
            title: 'Update Profile Details',
            message: 'Are you sure you want to update your profile information?',
            type: 'info',
            confirmText: 'Update Profile',
            onConfirm: async () => {
                setSaving(true);
                try {
                    await api.put('/auth/profile', { name: user.name });
                    localStorage.setItem('adminUser', JSON.stringify(user));
                    triggerToast("Profile details updated successfully!", "success");
                } catch (err) {
                    triggerToast(err.response?.data?.message || 'Failed to update profile.', "error");
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const handleUpdatePassword = () => {
        if (!passwords.current) {
            triggerToast("Current password is required to change password", "error");
            return;
        }
        if (!passwords.newGroup) {
            triggerToast("New password is required", "error");
            return;
        }
        if (passwords.newGroup !== passwords.confirm) {
            triggerToast("New passwords do not match!", "error");
            return;
        }

        showConfirm({
            title: 'Change Password',
            message: 'Are you sure you want to change your password? You will use this new password next time you log in.',
            type: 'warning',
            confirmText: 'Change Password',
            onConfirm: async () => {
                setSaving(true);
                try {
                    await api.put('/auth/change-password', {
                        currentPassword: passwords.current,
                        newPassword: passwords.newGroup
                    });
                    triggerToast("Password changed successfully!", "success");
                    setPasswords({ current: '', newGroup: '', confirm: '' });
                } catch (err) {
                    triggerToast(err.response?.data?.message || 'Failed to change password.', "error");
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    if (loading) return <Layout><div className="p-8 flex items-center justify-center">Loading Profile Data...</div></Layout>;

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

                {/* Confirm Modal */}
                {confirmConfig && (
                    <ConfirmModal 
                        {...confirmConfig} 
                        isOpen={!!confirmConfig} 
                        onClose={() => !confirmConfig.isLoading && setConfirmConfig(null)} 
                    />
                )}

                <div className="max-w-[900px] mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[22px] font-bold text-[#1D2D44]">Edit Admin Profile</h3>
                    </div>

                    {/* --- BASIC INFORMATION CARD --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="p-8">
                            <div className="flex items-center gap-2 mb-8 text-[#1D2D44]">
                                <User size={20} />
                                <h4 className="text-[18px] font-bold">Basic Information</h4>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-12">
                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-[#1D2D44]">Full Name</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            value={user.name} 
                                            onChange={handleProfileChange} 
                                            className="w-full max-w-md border border-gray-300 rounded-md px-4 py-2.5 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44] transition-all bg-white" 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-[#1D2D44]">Email Address (Cannot be changed)</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={user.email} 
                                            disabled 
                                            title="Email cannot be changed"
                                            className="w-full max-w-md border border-gray-200 bg-gray-50 text-gray-500 rounded-md px-4 py-2.5 text-sm outline-none cursor-not-allowed" 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-[#1D2D44]">Role</label>
                                        <span className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold rounded-full uppercase tracking-wider w-max">
                                            {user.role}
                                        </span>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-100">
                                        <button 
                                            className="bg-[#1D2D44] text-white py-2.5 px-6 rounded-md font-bold text-xs hover:bg-[#152030] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                                            onClick={handleUpdateProfile}
                                            disabled={saving}
                                        >
                                            {saving ? 'Updating...' : 'Update Profile Details'}
                                        </button>
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
                            
                            <div className="max-w-md space-y-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-[#1D2D44]">Current Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            name="current" 
                                            placeholder="••••••••"
                                            value={passwords.current} 
                                            onChange={handlePasswordChange} 
                                            className="w-full border border-gray-300 rounded-md px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44] transition-all bg-white" 
                                        />
                                        <button 
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-[#1D2D44]">New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? 'text' : 'password'}
                                            name="newGroup" 
                                            placeholder="New Password"
                                            value={passwords.newGroup} 
                                            onChange={handlePasswordChange} 
                                            className="w-full border border-gray-300 rounded-md px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44] transition-all bg-white" 
                                        />
                                        <button 
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-[#1D2D44]">Confirm New Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirm" 
                                            placeholder="Confirm New Password"
                                            value={passwords.confirm} 
                                            onChange={handlePasswordChange} 
                                            className="w-full border border-gray-300 rounded-md px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44] transition-all bg-white" 
                                        />
                                        <button 
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-100">
                                    <button 
                                        className="bg-red-500 text-white py-2.5 px-6 rounded-md font-bold text-xs hover:bg-red-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                                        onClick={handleUpdatePassword}
                                        disabled={saving}
                                    >
                                        {saving ? 'Updating...' : 'Change Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default Profile;
