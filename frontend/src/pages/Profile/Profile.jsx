import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api';
import { Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();

    // User Information State
    const [user, setUser] = useState({
        name: '',
        firstname: '',
        lastname: '',
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

    const closeConfirm = () => setConfirmConfig(null);

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
                const fullName = res.data.name || '';
                const parts = fullName.split(' ');
                setUser({
                    name: fullName,
                    firstname: parts[0] || '',
                    lastname: parts.slice(1).join(' ') || '',
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
        const fullName = `${user.firstname} ${user.lastname}`.trim();
        if (!fullName) {
            triggerToast("Firstname and Lastname are required", "error");
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
                    const res = await api.put('/auth/profile', { name: fullName });
                    const updatedUser = res.data;
                    
                    // We must merge it into the existing adminUser to not lose token and other frontend-only fields
                    const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
                    localStorage.setItem('adminUser', JSON.stringify({ ...currentAdmin, ...updatedUser }));
                    
                    window.dispatchEvent(new Event('profileUpdated'));
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

    if (loading) return <Layout><div className="p-8 flex items-center justify-center font-bold text-slate-600">Loading Profile Data...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-[860px] mx-auto py-2 px-2 sm:px-4 font-sans space-y-4 relative">
                
                {/* --- DYNAMIC TOAST COMPONENT --- */}
                {toast.show && (
                    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 transform translate-y-0 ${
                        toast.type === 'success' ? 'bg-[#1D2D44] text-white' : 'bg-red-600 text-white'
                    }`}>
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <p className="font-bold text-xs tracking-wide m-0">{toast.message}</p>
                        <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Confirm Modal */}
                {confirmConfig && (
                    <ConfirmModal 
                        {...confirmConfig} 
                        isOpen={!!confirmConfig} 
                        onClose={closeConfirm} 
                    />
                )}

                {/* Basic Information Card */}
                <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
                    <div className="py-3.5 px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-black text-slate-900 m-0">Basic Information</h3>
                        <span className="text-[11.5px] font-medium text-slate-400">Edit your name details</span>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-slate-700" htmlFor="firstname">Firstname</label>
                                <input 
                                    type="text" 
                                    id="firstname"
                                    name="firstname" 
                                    value={user.firstname}
                                    onChange={handleProfileChange}
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13.5px] outline-none focus:border-blue-500 transition-all bg-white" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-slate-700" htmlFor="lastname">Lastname</label>
                                <input 
                                    type="text" 
                                    id="lastname"
                                    name="lastname" 
                                    value={user.lastname}
                                    onChange={handleProfileChange}
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13.5px] outline-none focus:border-blue-500 transition-all bg-white" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-slate-700" htmlFor="email">Email Address</label>
                                <input 
                                    type="email" 
                                    id="email"
                                    name="email" 
                                    value={user.email || 'registrarname@sample.com'} 
                                    disabled 
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13.5px] outline-none bg-slate-50 text-slate-500 cursor-not-allowed" 
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-slate-700" htmlFor="role">User Role</label>
                                <input 
                                    type="text" 
                                    id="role"
                                    value={user.role || 'Super Admin'} 
                                    disabled 
                                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-[13.5px] outline-none bg-slate-50 text-slate-500 cursor-not-allowed capitalize" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security & Password Card */}
                <div className="bg-white rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
                    <div className="py-3.5 px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-black text-slate-900 m-0">Security & Password</h3>
                        <span className="text-[11.5px] font-medium text-slate-400">Leave blank if unchanged</span>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 max-w-xl">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="text-[12px] font-bold text-slate-700 w-[150px]" htmlFor="current">Current Password</label>
                                <div className="relative flex-1">
                                    <input 
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        id="current"
                                        name="current" 
                                        value={passwords.current} 
                                        onChange={handlePasswordChange} 
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 pr-10 text-[13.5px] outline-none focus:border-blue-500 transition-all bg-white" 
                                    />
                                    <button 
                                        type="button"
                                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none p-1.5"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="text-[12px] font-bold text-slate-700 w-[150px]" htmlFor="newGroup">New Password</label>
                                <div className="relative flex-1">
                                    <input 
                                        type={showNewPassword ? 'text' : 'password'}
                                        id="newGroup"
                                        name="newGroup" 
                                        value={passwords.newGroup} 
                                        onChange={handlePasswordChange} 
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 pr-10 text-[13.5px] outline-none focus:border-blue-500 transition-all bg-white" 
                                    />
                                    <button 
                                        type="button"
                                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none p-1.5"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="text-[12px] font-bold text-slate-700 w-[150px]" htmlFor="confirm">Confirm Password</label>
                                <div className="relative flex-1">
                                    <input 
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirm"
                                        name="confirm" 
                                        value={passwords.confirm} 
                                        onChange={handlePasswordChange} 
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 pr-10 text-[13.5px] outline-none focus:border-blue-500 transition-all bg-white" 
                                    />
                                    <button 
                                        type="button"
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none p-1.5"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-1">
                    <button 
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-6 rounded-full font-bold text-[13px] transition-all cursor-pointer border-none"
                        onClick={() => navigate('/profile/info')}
                    >
                        Cancel
                    </button>
                    <button 
                        className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-2 px-7 rounded-full font-bold text-[13px] transition-all shadow-xs hover:shadow-md cursor-pointer border-none active:scale-95"
                        onClick={() => {
                            if (passwords.current || passwords.newGroup) {
                                handleUpdatePassword();
                            }
                            handleUpdateProfile();
                        }}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Confirm Changes'}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
