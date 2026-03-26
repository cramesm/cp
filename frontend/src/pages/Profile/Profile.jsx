import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

const Profile = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: '',
        profilePic: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                setProfile(res.data);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.put('/auth/profile', { name: profile.name, profilePic: profile.profilePic });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        setSaving(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Password change failed' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="p-5">Loading Profile...</div></Layout>;

    return (
        <Layout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">My Profile & Settings</h1>
                
                {message.text && (
                    <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-6 border-b pb-2">Personal Information</h2>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                                <input type="text" value={profile.email} disabled className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input type="text" value={profile.role.toUpperCase()} disabled className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={profile.name} 
                                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full bg-[#2c3e50] text-white py-2.5 rounded-lg font-bold hover:bg-[#1a252f] transition-colors disabled:bg-gray-400"
                            >
                                {saving ? 'Saving...' : 'Update Details'}
                            </button>
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-6 border-b pb-2">Security Settings</h2>
                        <form onSubmit={handlePasswordChange}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                                {saving ? 'Updating Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
