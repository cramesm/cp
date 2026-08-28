import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Search, Plus, SlidersHorizontal, ArrowDownAZ, ArrowUpZA, Eye, EyeOff } from 'lucide-react';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import axiosInstance from '../../components/config/axiosConfig';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import TableSkeleton from '../../components/TableSkeleton';
import { useModals } from '../../hooks/useModals';

const StudentManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('student'); // 'student' or 'alumni'
    const [filterProgram, setFilterProgram] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    
    // Pagination
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        studentId: '',
        programLevel: 'Bachelors'
    });
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState(null);

    // Confirm Modal
    const [confirmConfig, setConfirmConfig] = useState(null);
    let isExecuting = false;
    const showConfirm = ({ title, message, onConfirm, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
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
            cancelText,
            isLoading: false
        });
    };

    // Feedback Modal
    const [feedbackConfig, setFeedbackConfig] = useState(null);
    const showFeedback = ({ title, message, type = 'error' }) => {
        setFeedbackConfig({ title, message, type });
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const [studentsRes, alumniRes] = await Promise.all([
                axiosInstance.get('/v1/students'),
                axiosInstance.get('/v1/alumni').catch(() => ({ data: { data: [] } }))
            ]);
            setUsers([...studentsRes.data.data, ...alumniRes.data.data]);
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

    const handleDelete = (userId, userRole, userName) => {
        showConfirm({
            title: 'Delete User',
            message: `Are you sure you want to permanently delete the account for ${userName}? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    const endpoint = userRole === 'alumni' ? `/v1/alumni/${userId}` : `/v1/students/${userId}`;
                    await axiosInstance.delete(endpoint);
                    setUsers(prev => prev.filter(user => user._id !== userId));
                } catch (err) {
                    console.error('Error deleting user:', err);
                    showFeedback({
                        title: 'Error Deleting User',
                        message: 'Oops! We couldn\'t delete this user right now. Please try again later.',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleStatusChange = (userId, userRole, newStatus) => {
        showConfirm({
            title: 'Change Status',
            message: `Are you sure you want to change this account's status to ${newStatus}?`,
            type: 'warning',
            confirmText: 'Change',
            onConfirm: async () => {
                try {
                    const endpoint = userRole === 'alumni' ? `/v1/alumni/${userId}/status` : `/v1/students/${userId}/status`;
                    const response = await axiosInstance.put(endpoint, { status: newStatus });
                    if (response.data && response.data.data) {
                        setUsers(prev => prev.map(user => 
                            user._id === userId ? { ...user, status: response.data.data.status } : user
                        ));
                    }
                } catch (err) {
                    console.error('Error updating status:', err);
                    showFeedback({
                        title: 'Update Failed',
                        message: 'We couldn\'t update the account status. Please try again later.',
                        type: 'error'
                    });
                }
            }
        });
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
            const endpoint = activeTab === 'alumni' ? '/v1/alumni' : '/v1/students';
            const payload = { ...formData, role: activeTab };
            const response = await axiosInstance.post(endpoint, payload);
            
            const newUser = response.data.data;
            // Add new user to the top of the list
            setUsers([newUser, ...users]);
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', email: '', password: '', studentId: '', programLevel: 'Bachelors' });
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
            const matchesSearch = (
                (user.firstName && user.firstName.toLowerCase().includes(search)) ||
                (user.lastName && user.lastName.toLowerCase().includes(search)) ||
                (user.email && user.email.toLowerCase().includes(search)) ||
                (user.studentId && user.studentId.toLowerCase().includes(search))
            );

            const userStatus = user.status || 'Active';
            const matchesStatus = filterStatus === 'All' || userStatus === filterStatus;
            
            const userProgram = user.programLevel || 'Bachelors';
            const matchesProgram = activeTab === 'alumni' || filterProgram === 'All' || userProgram === filterProgram;

            return matchesSearch && matchesStatus && matchesProgram;
        }).sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            // Special handling for nested or specific types
            if (sortConfig.key === 'createdAt') {
                valA = new Date(valA || Date.now()).getTime();
                valB = new Date(valB || Date.now()).getTime();
            } else if (sortConfig.key === 'firstName') {
                valA = valA ? valA.toLowerCase() : '';
                valB = valB ? valB.toLowerCase() : '';
            } else if (sortConfig.key === 'email') {
                valA = valA ? valA.toLowerCase() : '';
                valB = valB ? valB.toLowerCase() : '';
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [users, activeTab, searchTerm, filterStatus, filterProgram, sortConfig]);

    const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab, entriesPerPage, filterStatus, filterProgram]);

    return (
        <Layout>
            {confirmConfig && (
                <ConfirmModal 
                    {...confirmConfig} 
                    isOpen={!!confirmConfig} 
                    onClose={closeConfirm} 
                />
            )}
            <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold">
                        {error}
                    </div>
                )}

                <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
                    
                    {/* Header Section */}
                    <div className="flex flex-col gap-3.5 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-[18px] font-black text-slate-900 m-0">User Management</h1>
                                <p className="text-[11.5px] text-slate-500 font-medium m-0">View and manage registered student and alumni mobile accounts</p>
                            </div>

                            {/* 3D Segmented Tabs */}
                            <div className="inline-flex bg-slate-200/70 p-1 rounded-full border border-slate-200 self-start sm:self-auto">
                                <button
                                    onClick={() => setActiveTab('student')}
                                    className={`px-4 py-1 rounded-full font-extrabold text-[11.5px] transition-all ${
                                        activeTab === 'student'
                                            ? 'bg-[#2c3543] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Students
                                </button>
                                <button
                                    onClick={() => setActiveTab('alumni')}
                                    className={`px-4 py-1 rounded-full font-extrabold text-[11.5px] transition-all ${
                                        activeTab === 'alumni'
                                            ? 'bg-[#2c3543] text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Alumni
                                </button>
                            </div>
                        </div>

                        {/* Toolbar Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                    <input
                                        aria-label="Search users"
                                        type="text"
                                        placeholder="Search users..."
                                        className="w-56 sm:w-64 rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3.5 text-[12px] font-medium outline-none focus:border-blue-500 shadow-2xs"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsFilterDrawerOpen(true)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-full font-bold text-[11.5px] border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
                                >
                                    <SlidersHorizontal size={13} />
                                    <span>Filters & Sort</span>
                                </button>
                            </div>

                            {/* 3D Add Button */}
                            <button 
                                onClick={() => setShowModal(true)}
                                className="flex items-center justify-center gap-1.5 rounded-full bg-[#2c3543] hover:bg-[#1f2631] px-4 py-1.5 text-[12px] font-bold text-white border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:border-b-0 transition-all self-start sm:self-auto"
                            >
                                <Plus size={14} />
                                <span>Add New {activeTab === 'student' ? 'Student' : 'Alumni'}</span>
                            </button>
                        </div>

                        <ActiveFilterChips 
                            filters={[
                                { label: 'Program', value: activeTab === 'student' ? filterProgram : null, key: 'filterProgram' },
                                { label: 'Status', value: filterStatus, key: 'filterStatus' },
                            ]}
                            onRemove={(key) => {
                                if (key === 'filterProgram') setFilterProgram('All');
                                if (key === 'filterStatus') setFilterStatus('All');
                            }}
                        />
                    </div>

                    {/* Filter Drawer */}
                    <FilterDrawer 
                        isOpen={isFilterDrawerOpen} 
                        onClose={() => setIsFilterDrawerOpen(false)}
                        onClearAll={() => {
                            setFilterProgram('All');
                            setFilterStatus('All');
                            setSortConfig({ key: 'createdAt', direction: 'desc' });
                        }}
                    >
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sorting</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="sortBy" className="text-xs font-bold text-slate-700">Sort By:</label>
                                    <select 
                                        id="sortBy"
                                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                        value={sortConfig.key}
                                        onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                                    >
                                        <option value="createdAt">Joined Date</option>
                                        <option value="firstName">Name</option>
                                        <option value="email">Email</option>
                                        <option value="status">Status</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-700">Order:</label>
                                    <button 
                                        onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                                    >
                                        <span>{sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}</span>
                                        {sortConfig.direction === 'asc' ? <ArrowUpZA size={14} className="text-slate-500"/> : <ArrowDownAZ size={14} className="text-slate-500"/>}
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 my-1"></div>

                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtering</h3>
                            
                            {activeTab === 'student' && (
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="filterProgramLevel" className="text-xs font-bold text-slate-700">Program Level:</label>
                                    <select 
                                        id="filterProgramLevel"
                                        value={filterProgram}
                                        onChange={e => setFilterProgram(e.target.value)}
                                        className="rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 bg-white cursor-pointer text-slate-700"
                                    >
                                        <option value="All">All Programs</option>
                                        <option value="Bachelors">Bachelors</option>
                                        <option value="Masters">Masters</option>
                                        <option value="Doctorate">Doctorate</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="filterStatus" className="text-xs font-bold text-slate-700">Status:</label>
                                <select 
                                    id="filterStatus"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none focus:border-blue-500 bg-white cursor-pointer text-slate-700"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Stopped">Stopped</option>
                                </select>
                            </div>
                        </div>
                    </FilterDrawer>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                    <th className="py-3 px-5">Name</th>
                                    <th className="py-3 px-5">{activeTab === 'student' ? 'School Email' : 'Email'}</th>
                                    <th className="py-3 px-5">Student ID</th>
                                    {activeTab === 'student' && <th className="py-3 px-5">Program</th>}
                                    <th className="py-3 px-5">Joined Date</th>
                                    <th className="py-3 px-5 text-center">Status</th>
                                    <th className="py-3 px-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[12.5px]">
                                {loading ? (
                                    <TableSkeleton columns={6} rows={entriesPerPage || 10} />
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user, idx) => (
                                        <tr
                                            key={user._id}
                                            className="hover:bg-slate-50/80 transition-colors"
                                        >
                                            <td className="py-3 px-5 font-bold text-slate-900">
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className="py-3 px-5 text-slate-600">{user.email}</td>
                                            <td className="py-3 px-5 font-mono text-slate-600">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11.5px] font-bold">
                                                    {user.studentId ? user.studentId : 'N/A'}
                                                </span>
                                            </td>
                                            {activeTab === 'student' && (
                                                <td className="py-3 px-5">
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider border border-blue-200/60">
                                                        {user.programLevel || 'Bachelors'}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="py-3 px-5 text-slate-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                <div className="relative inline-block min-w-[95px]">
                                                    <select
                                                        aria-label={`Status for ${user.firstName} ${user.lastName}`}
                                                        value={user.status || 'Active'}
                                                        onChange={(e) => handleStatusChange(user._id, user.role || 'student', e.target.value)}
                                                        className={`w-full appearance-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide outline-none cursor-pointer text-center transition-all border ${
                                                            (user.status || 'Active') === 'Active'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                        }`}
                                                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                                                    >
                                                        <option value="Active" className="text-slate-800 font-bold bg-white">ACTIVE</option>
                                                        <option value="Inactive" className="text-slate-800 font-bold bg-white">INACTIVE</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                                        <i className={`fa-solid fa-chevron-down text-[7.5px] ${
                                                            (user.status || 'Active') === 'Active' ? 'text-emerald-700' : 'text-slate-600'
                                                        }`}></i>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDelete(user._id, user.role || 'student', `${user.firstName} ${user.lastName}`)}
                                                        className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 flex items-center justify-center transition-all shadow-2xs border border-red-200/60 hover:-translate-y-0.5 active:translate-y-0.5"
                                                        title="Delete User"
                                                    >
                                                        <i className="fa-regular fa-trash-can text-xs"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="py-12 text-center text-slate-400 italic">No {activeTab === 'student' ? 'students' : 'alumni'} found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer / Pagination */}
                    <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
                        <div className="flex items-center gap-1.5">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={`text-xs px-2.5 py-1 rounded-md ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 cursor-pointer font-bold'}`}
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
                                            className={`w-7 h-7 rounded-lg text-xs transition-colors font-bold ${
                                                currentPage === pageNumber 
                                                    ? 'bg-[#2c3543] text-white shadow-2xs' 
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                                    return <span key={pageNumber} className="text-slate-400 text-xs px-1">...</span>;
                                }
                                return null;
                            })}

                            <button 
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className={`text-xs px-2.5 py-1 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 cursor-pointer font-bold'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Student Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-[#1D2D44]/60 flex items-center justify-center z-[1100] backdrop-blur-xs p-4">
                        <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-[17px] font-black text-slate-900 m-0">Add New {activeTab === 'student' ? 'Student' : 'Alumni'}</h3>
                                    <p className="text-[11px] text-slate-400 font-medium m-0 mt-0.5">Register a new verified mobile user</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                                >
                                    <i className="fa-solid fa-xmark text-xs"></i>
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddStudent} className="p-6">
                                {addError && (
                                    <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-bold mb-4 border border-red-200">
                                        <i className="fa-solid fa-circle-exclamation mr-1"></i> {addError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="firstName" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                                            <input
                                                id="firstName"
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white transition-all"
                                                placeholder="First Name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                                            <input
                                                id="lastName"
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white transition-all"
                                                placeholder="Last Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="email" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">{activeTab === 'student' ? 'School Email' : 'Email'}</label>
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white transition-all"
                                                placeholder={activeTab === 'student' ? "student@school.edu" : "alumni@email.com"}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="studentId" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Student ID</label>
                                            <input
                                                id="studentId"
                                                type="text"
                                                name="studentId"
                                                value={activeTab === 'alumni' ? 'Auto-generated' : formData.studentId}
                                                onChange={handleInputChange}
                                                required={activeTab === 'student'}
                                                disabled={activeTab === 'alumni'}
                                                className={`w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all ${activeTab === 'alumni' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                                                placeholder={activeTab === 'student' ? "e.g. 2021-00001" : "Auto-generated"}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3.5 py-2 pr-9 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white transition-all"
                                                placeholder="Assign a secure password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                    {activeTab === 'student' && (
                                        <div>
                                            <label htmlFor="modalProgramLevel" className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Program Level</label>
                                            <select
                                                id="modalProgramLevel"
                                                name="programLevel"
                                                value={formData.programLevel}
                                                onChange={handleInputChange}
                                                className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white transition-all cursor-pointer"
                                            >
                                                <option value="Bachelors">Bachelors</option>
                                                <option value="Masters">Masters</option>
                                                <option value="Doctorate">Doctorate</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adding}
                                        className="px-5 py-2 text-xs font-bold text-white bg-[#2c3543] hover:bg-[#1f2631] rounded-full border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-50 flex items-center"
                                    >
                                        {adding ? (
                                            <><i className="fa-solid fa-spinner fa-spin mr-1.5"></i> Registering...</>
                                        ) : (
                                            'Register ' + (activeTab === 'student' ? 'Student' : 'Alumni')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Feedback Modal */}
                {feedbackConfig && (
                    <FeedbackModal 
                        {...feedbackConfig} 
                        isOpen={!!feedbackConfig} 
                        onClose={closeFeedback} 
                    />
                )}
            </div>
        </Layout>
    );
};

export default StudentManagement;
