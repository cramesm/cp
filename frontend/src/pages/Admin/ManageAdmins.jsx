import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const resp = await api.get('/admins');
            setAdmins(resp.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admins', { email, password });
            setMessage('Admin added successfully');
            setEmail('');
            setPassword('');
            fetchAdmins();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error adding admin');
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm('Are you sure you want to delete this admin?')) return;
        try {
            await api.delete(`/admins/${id}`);
            fetchAdmins();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Add New Admin Account</h3>
                    <form onSubmit={handleAddAdmin} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                        <button type="submit" className="bg-[#213448] text-white px-6 py-2 rounded font-medium hover:bg-[#1a2735]">Add Admin</button>
                    </form>
                    {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <h3 className="bg-[#213448] text-white p-4 font-bold text-lg">Admin Accounts</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">{admin.email}</td>
                                    <td className="p-4 capitalize">{admin.role}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteAdmin(admin._id)}
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default ManageAdmins;
