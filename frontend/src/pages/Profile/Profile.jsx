import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';

const Profile = () => {
    const navigate = useNavigate();

    // Mock initial state representing an fetched user
    const [user, setUser] = useState({
        name: 'John Dela Cruz',
        email: 'john@email.com',
        username: 'john.123',
        role: 'Registrar Administrator'
    });

    const [passwords, setPasswords] = useState({
        current: '',
        newGroup: '',
        confirm: ''
    });

    const handleProfileChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const saveBasicInfo = () => {
        console.log("Saving new info", user);
        // Dispatch API
    };

    const saveSecurity = () => {
        console.log("Saving new security", passwords);
        // Dispatch API 
    };

    return (
        <Layout>
            <div className="py-5 px-10 max-w-[1000px] mx-auto">
                <h3 className="text-[22px] font-bold mb-[25px] text-black">Admin Profile</h3>

                <div className="bg-white rounded-xl p-[30px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#e0e0e0] mb-[25px]">
                    <h4 className="text-[18px] mb-[25px] text-[#222] font-semibold">Basic Information</h4>
                    
                    <div className="flex flex-col md:flex-row gap-[50px]">
                        <div className="flex flex-col items-center w-full md:w-[200px]">
                            <div className="w-[120px] h-[120px] bg-[#e0e0e0] rounded-full mb-[15px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
                                <img src="/assets/user.png" alt="Profile Picture" className="w-full h-full object-cover block" />
                            </div>
                            <span className="text-[#5d8aa8] underline text-[13px] cursor-pointer hover:text-[#4a6b82]">Change Profile Picture</span>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center mb-5">
                                <label className="w-[150px] text-[14px] text-[#444] mb-2 md:mb-0">Name:</label>
                                <input type="text" name="name" value={user.name} onChange={handleProfileChange} className="flex-1 py-2.5 px-[15px] border border-[#ddd] rounded-md text-[14px] outline-none bg-white transition-colors focus:border-[#5d8aa8]" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center mb-5">
                                <label className="w-[150px] text-[14px] text-[#444] mb-2 md:mb-0">Email:</label>
                                <input type="email" name="email" value={user.email} onChange={handleProfileChange} className="flex-1 py-2.5 px-[15px] border border-[#ddd] rounded-md text-[14px] outline-none bg-white transition-colors focus:border-[#5d8aa8]" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center mb-5">
                                <label className="w-[150px] text-[14px] text-[#444] mb-2 md:mb-0">Username:</label>
                                <input type="text" name="username" value={user.username} onChange={handleProfileChange} className="flex-1 py-2.5 px-[15px] border border-[#ddd] rounded-md text-[14px] outline-none bg-white transition-colors focus:border-[#5d8aa8]" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center mb-5">
                                <label className="w-[150px] text-[14px] text-[#444] mb-2 md:mb-0">Role:</label>
                                <span className="text-[14px] text-[#333] font-medium">{user.role}</span>
                            </div>
                            <div className="flex justify-end mt-2.5">
                                <button className="bg-[#343a40] text-white border-none py-2 px-[25px] rounded-[20px] text-[13px] cursor-pointer transition-colors hover:bg-[#1d2124]" onClick={saveBasicInfo}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-[30px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#e0e0e0] mb-[25px]">
                    <h4 className="text-[18px] mb-[25px] text-[#222] font-semibold">Security</h4>
                    
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center mb-5">
                            <label className="w-[150px] text-[14px] text-[#444] mb-2 md:mb-0">Current Password:</label>
                            <input type="password" name="current" value={passwords.current} onChange={handlePasswordChange} placeholder="Current Password" className="flex-1 py-2.5 px-[15px] border border-[#ddd] rounded-md text-[14px] outline-none bg-white transition-colors focus:border-[#5d8aa8]" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center mb-5">
                            <label className="w-[150px] text-[14px] text-[#444] mb-2 md:mb-0">New Password:</label>
                            <input type="password" name="newGroup" value={passwords.newGroup} onChange={handlePasswordChange} placeholder="New Password" className="flex-1 py-2.5 px-[15px] border border-[#ddd] rounded-md text-[14px] outline-none bg-white transition-colors focus:border-[#5d8aa8]" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center mb-5">
                            <label className="w-[150px] text-[14px] text-[#444] mb-2 md:mb-0">Confirm Password:</label>
                            <input type="password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} placeholder="Confirm Password" className="flex-1 py-2.5 px-[15px] border border-[#ddd] rounded-md text-[14px] outline-none bg-white transition-colors focus:border-[#5d8aa8]" />
                        </div>
                        <div className="flex justify-end mt-2.5">
                            <button className="bg-[#343a40] text-white border-none py-2 px-[25px] rounded-[20px] text-[13px] cursor-pointer transition-colors hover:bg-[#1d2124]" onClick={saveSecurity}>Save</button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-[15px] mt-5">
                    <button className="bg-[#dcdcdc] text-[#333] border-none py-2.5 px-[30px] rounded-[25px] font-semibold cursor-pointer transition-colors hover:bg-[#c0c0c0]" onClick={() => navigate('/')}>Cancel</button>
                    <button className="bg-[#2c3e50] text-white border-none py-2.5 px-[30px] rounded-[25px] font-semibold cursor-pointer transition-colors hover:bg-[#1a252f]" onClick={() => navigate('/')}>Confirm</button>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
