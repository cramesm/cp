import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Search, Plus } from 'lucide-react';
import axiosInstance from '../../components/config/axiosConfig';

const StudentManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('student'); // 'student' or 'alumni'
    
    // Pagination
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const [studentsRes, alumniRes] = await Promise.all([
                axiosInstance.get('/students'),
                axiosInstance.get('/alumni').catch(() => ({ data: [] }))
            ]);
            setUsers([...studentsRes.data, ...alumniRes.data]);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId, userRole, userName) => {
        if (window.confirm(`Are you sure you want to permanently delete the account for ${userName}? This action cannot be undone.`)) {
            try {
                const endpoint = userRole === 'alumni' ? `/alumni/${userId}` : `/students/${userId}`;
                await axiosInstance.delete(endpoint);
                setUsers(users.filter(user => user._id !== userId));
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Failed to delete the user. Please try again later.');
            }
        }
    };

    const handleToggleStatus = async (userId, userRole, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        if (window.confirm(`Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} this account?`)) {
            try {
                const endpoint = userRole === 'alumni' ? `/alumni/${userId}/status` : `/students/${userId}/status`;
                const response = await axiosInstance.put(endpoint, { status: newStatus });
                if (response.data) {
                    setUsers(users.map(user => 
                        user._id === userId ? { ...user, status: response.data.student?.status || response.data.alumni?.status } : user
                    ));
                }
            } catch (err) {
                console.error('Error updating status:', err);
                alert('Failed to update account status. Please try again later.');
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setAddError(null);
        setAdding(true);
        try {
            const endpoint = activeTab === 'alumni' ? '/alumni' : '/students';
            const payload = { ...formData, role: activeTab };
            const response = await axiosInstance.post(endpoint, payload);
            
            const newUser = response.data.student || response.data.alumni;
            // Add new user to the top of the list
            setUsers([newUser, ...users]);
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', email: '', password: '' });
        } catch (err) {
            console.error('Error adding user:', err);
            setAddError(err.response?.data?.message || 'Failed to add user. Please check the details and try again.');
        } finally {
            setAdding(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const roleMatch = (user.role || 'student') === activeTab;
            if (!roleMatch) return false;

            const search = searchTerm.toLowerCase();
            return (
                (user.firstName && user.firstName.toLowerCase().includes(search)) ||
                (user.lastName && user.lastName.toLowerCase().includes(search)) ||
                (user.email && user.email.toLowerCase().includes(search)) ||
                (user.studentId && user.studentId.toLowerCase().includes(search))
            );
        });
    }, [users, activeTab, searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab, entriesPerPage]);

    return (
        <Layout>
            <div className="p-8 bg-[#f8fafc] min-h-screen relative">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <p className="text-sm text-gray-500">View and manage registered mobile app users.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex space-x-6 mb-6">
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`pb-2 font-bold text-sm transition-colors border-b-[3px] ${
                            activeTab === 'student'
                                ? 'border-[#1D2D44] text-[#1D2D44]'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Students
                    </button>
                    <button
                        onClick={() => setActiveTab('alumni')}
                        className={`pb-2 font-bold text-sm transition-colors border-b-[3px] ${
                            activeTab === 'alumni'
                                ? 'border-[#1D2D44] text-[#1D2D44]'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Alumni
                    </button>
                </div>

                <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                    
                    {/* Header Section */}
                    <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between border-b border-gray-100">
                        <div className="flex items-center gap-6">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-64 rounded-md border border-gray-300 py-2 pl-9 pr-4 text-xs outline-none focus:border-[#1D2D44]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Add Button */}
                        <button 
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center gap-2 rounded-md bg-[#6c4df6] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#5a3ed9] transition-all shadow-sm"
                        >
                            <Plus size={16} />
                            Add New {activeTab === 'student' ? 'Student' : 'Alumni'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200">
                                    <th className="px-8 py-5">Name</th>
                                    <th className="px-8 py-5">{activeTab === 'student' ? 'School Email' : 'Email'}</th>
                                    <th className="px-8 py-5">Student ID</th>
                                    <th className="px-8 py-5">Joined Date</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[13px]">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-20 text-center text-gray-400">Loading users...</td></tr>
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user, idx) => (
                                        <tr
                                            key={user._id}
                                            className={`transition-colors ${idx % 2 !== 0 ? 'bg-[#F9FAFF]' : 'bg-white hover:bg-gray-50'}`}
                                        >
                                            <td className="px-8 py-4 font-semibold text-gray-800">
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className="px-8 py-4 text-gray-600">{user.email}</td>
                                            <td className="px-8 py-4 font-mono text-gray-500">
                                                {user.studentId ? user.studentId : 'N/A'}
                                            </td>
                                            <td className="px-8 py-4 text-gray-600">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                    user.status === 'Active' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {user.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(user._id, user.role || 'student', user.status || 'Active')}
                                                        className={`min-w-[90px] rounded-full px-4 py-2 text-[11px] font-bold text-white text-center transition-colors shadow-sm ${
                                                            (user.status || 'Active') === 'Active'
                                                                ? 'bg-orange-500 hover:bg-orange-600'
                                                                : 'bg-green-500 hover:bg-green-600'
                                                        }`}
                                                    >
                                                        {(user.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user._id, user.role || 'student', `${user.firstName} ${user.lastName}`)}
                                                        className="min-w-[80px] rounded-full bg-[#fce8e8] px-4 py-2 text-[11px] font-bold text-red-600 text-center hover:bg-red-600 hover:text-white transition-colors shadow-sm border border-red-100"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="py-20 text-center text-gray-400 italic">No {activeTab === 'student' ? 'students' : 'alumni'} found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer / Pagination Placeholder */}
                    <div className="p-6 border-t border-gray-100 flex justify-center">
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={`text-xs px-2 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black hover:underline cursor-pointer'}`}
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: totalPages }).map((_, idx) => {
                                const pageNumber = idx + 1;
                                if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`w-8 h-8 rounded text-xs transition-colors font-bold ${
                                                currentPage === pageNumber 
                                                    ? 'bg-[#1D2D44] text-white' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                    return <span key={pageNumber} className="text-gray-400 mt-2 text-xs">...</span>;
                                }
                                return null;
                            })}

                            <button 
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className={`text-xs px-2 ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black hover:underline cursor-pointer'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Student Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-[#1D2D44]/80 flex items-center justify-center z-[1100] backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFF]">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Add New {activeTab === 'student' ? 'Student' : 'Alumni'}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Register a new mobile user</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddStudent} className="p-8">
                                {addError && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-xs font-medium mb-5 border border-red-200">
                                        <i className="fa-solid fa-circle-exclamation mr-1"></i> {addError}
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c4df6] focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                                                placeholder="First Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c4df6] focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                                                placeholder="Last Name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">School Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c4df6] focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                                            placeholder="student@school.edu"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
                                        <input
                                            type="text"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c4df6] focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                                            placeholder="Assign a secure password"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adding}
                                        className="px-6 py-2.5 text-xs font-bold text-white bg-[#6c4df6] rounded-lg hover:bg-[#5a3ed9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md shadow-[#6c4df6]/20"
                                    >
                                        {adding ? (
                                            <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Registering...</>
                                        ) : (
                                            'Register ' + (activeTab === 'student' ? 'Student' : 'Alumni')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default StudentManagement;
