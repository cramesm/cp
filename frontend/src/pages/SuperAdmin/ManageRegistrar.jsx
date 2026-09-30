import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import { Search, Building2, Lock, ShieldCheck, UserPlus, X, Copy, Check, AlertCircle } from 'lucide-react';
import api from '../../api';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import TableSkeleton from '../../components/TableSkeleton';

const ManageRegistrar = () => {
  const [registrars, setRegistrars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // User role & department
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const userDept = (localStorage.getItem('userDepartment') || '').toLowerCase();
  const isSuperAdmin = userRole === 'super admin';
  const isITAdmin = userRole.includes('it') || userDept.includes('it');
  const isRegistrarAdmin = userRole.includes('registrar admin') || (userRole.includes('admin') && userDept === 'registrar');
  const isAccountingAdmin = userRole.includes('accounting admin') || (userRole.includes('admin') && userDept === 'accounting');
  const canAddStaff = isSuperAdmin || isITAdmin || isRegistrarAdmin || isAccountingAdmin;

  const defaultDept = isAccountingAdmin ? 'Accounting' : (isITAdmin ? 'IT Administration' : 'Registrar');

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: defaultDept
  });
  const [emailStatus, setEmailStatus] = useState({ checking: false, available: null, message: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccessData, setAddSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Dynamic titles based on user role
  const pageTitle = 
    userRole.includes('registrar') || userDept === 'registrar' ? 'Manage Registrar Staff' :
    userRole.includes('accounting') || userDept === 'accounting' ? 'Manage Accounting Staff' :
    userRole.includes('it') || userDept.includes('it') ? 'Manage IT Staff' :
    'Manage Staff & Administrators';

  const pageSubtitle = 
    userRole.includes('registrar') || userDept === 'registrar' ? 'View and oversee operational staff in the Office of the Registrar' :
    userRole.includes('accounting') || userDept === 'accounting' ? 'View and oversee cashiers and auditors in the Accounting Department' :
    userRole.includes('it') || userDept.includes('it') ? 'View and oversee helpdesk and technical staff in the IT Department' :
    'Global administrative directory across all university departments';

  const scopedDeptLabel = 
    userRole.includes('registrar') || userDept === 'registrar' ? 'Registrar Department' :
    userRole.includes('accounting') || userDept === 'accounting' ? 'Accounting Department' :
    userRole.includes('it') || userDept.includes('it') ? 'IT Administration' :
    'Global Directory';

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

  const closeConfirm = () => setConfirmConfig(null);

  // Feedback Modal
  const [feedbackConfig, setFeedbackConfig] = useState(null);
  const showFeedback = ({ title, message, type = 'error' }) => {
      setFeedbackConfig({ title, message, type });
  };

  // Fetch registrars from API
  const fetchRegistrars = async () => {
    try {
      const res = await api.get('/registrars');
      setRegistrars(res.data || []);
    } catch (error) {
      console.error('Error fetching registrars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrars();
  }, []);

  // Debounced real-time email check for Add Staff modal
  useEffect(() => {
    if (!showAddModal) return;
    const clean = addForm.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clean || !emailRegex.test(clean)) {
      setEmailStatus({ checking: false, available: null, message: '' });
      return;
    }

    setEmailStatus({ checking: true, available: null, message: 'Checking email...' });
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-email?email=${encodeURIComponent(clean)}`);
        setEmailStatus({
          checking: false,
          available: res.data.available,
          message: res.data.message
        });
      } catch (err) {
        setEmailStatus({ checking: false, available: null, message: '' });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addForm.email, showAddModal]);

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!addForm.firstName.trim() || !addForm.lastName.trim()) {
      setAddError('Please enter both First Name and Last Name.');
      return;
    }
    if (!addForm.email.trim()) {
      setAddError('Official email address is required.');
      return;
    }
    if (emailStatus.available === false) {
      setAddError('This email is already registered in the system.');
      return;
    }

    setAddLoading(true);
    try {
      const res = await api.post('/registrars', {
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        email: addForm.email.trim(),
        department: addForm.department
      });

      if (res.data) {
        const createdReg = res.data.registrar || {};
        const tempPassword = res.data.tempPassword || '';

        setAddSuccessData({
          name: createdReg.name || `${addForm.firstName.trim()} ${addForm.lastName.trim()}`,
          email: createdReg.email || addForm.email.trim(),
          department: createdReg.department || addForm.department,
          role: createdReg.role || (addForm.department === 'Accounting' ? 'Accounting Staff' : addForm.department === 'IT Administration' ? 'IT Staff' : 'Registrar Staff'),
          tempPassword
        });

        // Refresh staff list immediately
        fetchRegistrars();
      }
    } catch (err) {
      console.error('Error adding staff:', err);
      setAddError(err.response?.data?.message || 'Failed to create staff account. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!addSuccessData) return;
    const textToCopy = `VeriFitor Staff Account Credentials\nName: ${addSuccessData.name}\nEmail: ${addSuccessData.email}\nTemporary Password: ${addSuccessData.tempPassword}\nDepartment: ${addSuccessData.department}\nNotice: Upon logging in, please change your temporary password in Profile Settings.`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getPromotionTarget = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'registrar staff' || r === 'registrar') {
      return { target: 'Registrar Admin', type: 'promote', label: 'Promote to Admin' };
    }
    if (r === 'registrar admin') {
      return { target: 'Registrar Staff', type: 'demote', label: 'Demote to Staff' };
    }
    if (r === 'accounting staff' || r === 'accounting') {
      return { target: 'Accounting Admin', type: 'promote', label: 'Promote to Admin' };
    }
    if (r === 'accounting admin') {
      return { target: 'Accounting Staff', type: 'demote', label: 'Demote to Staff' };
    }
    return null;
  };

  const handleRoleChange = (registrarId, currentRole, targetRole, staffName) => {
    const isPromotion = targetRole.toLowerCase().includes('admin');
    showConfirm({
      title: isPromotion ? `Promote to ${targetRole}` : `Demote to ${targetRole}`,
      message: isPromotion 
        ? `Are you sure you want to promote ${staffName} to ${targetRole}? They will be granted administrative authority over departmental workflows and an automated email notification will be dispatched.`
        : `Are you sure you want to demote ${staffName} to ${targetRole}? Their administrative authority will be revoked and set to staff processing level. An automated notification email will be sent.`,
      type: isPromotion ? 'success' : 'warning',
      confirmText: isPromotion ? 'Promote Account' : 'Demote Account',
      onConfirm: async () => {
        try {
          const response = await api.put(`/registrars/${registrarId}/role`, { role: targetRole });
          if (response.data) {
            setRegistrars(prev => prev.map(reg => 
              (reg._id === registrarId || reg.registrarId === registrarId) 
                ? { 
                    ...reg, 
                    role: targetRole,
                    department: targetRole.toLowerCase().includes('accounting') ? 'Accounting' :
                               targetRole.toLowerCase().includes('it') ? 'IT Administration' : 'Registrar'
                  } 
                : reg
            ));
            showFeedback({
              title: isPromotion ? 'Promotion Successful' : 'Demotion Processed',
              message: `${staffName} has been officially updated to ${targetRole}. An automated notification email was dispatched.`,
              type: 'success'
            });
          }
        } catch (err) {
          console.error('Error changing role:', err);
          showFeedback({
            title: 'Action Failed',
            message: err.response?.data?.message || 'Failed to update staff role. Please try again.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleToggleStatus = (registrarId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    showConfirm({
        title: newStatus === 'Active' ? 'Activate Account' : 'Deactivate Account',
        message: `Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} this account? An automated email notification will be dispatched to the staff member informing them of their account status.`,
        type: newStatus === 'Active' ? 'success' : 'warning',
        confirmText: newStatus === 'Active' ? 'Activate' : 'Deactivate',
        onConfirm: async () => {
            try {
                const response = await api.put(`/registrars/${registrarId}`, { status: newStatus });
                if (response.data) {
                    setRegistrars(prev => prev.map(reg => 
                        (reg._id === registrarId || reg.registrarId === registrarId) 
                            ? { ...reg, status: response.data.status } 
                            : reg
                    ));
                    showFeedback({
                        title: 'Status Updated',
                        message: `Account has been marked as ${newStatus}. An email notice has been sent.`,
                        type: 'success'
                    });
                }
            } catch (err) {
                console.error('Error updating status:', err);
                showFeedback({
                    title: 'Update Failed',
                    message: 'We were unable to update the account status. Please try again.',
                    type: 'error'
                });
            }
        }
    });
  };

  const filteredRegistrars = useMemo(() => {
    return registrars.filter((item) => {
      const matchesSearch = !search || Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(search.toLowerCase())
      );

      const roleStr = (item.role || '').toLowerCase();
      let effectiveDept = (item.department || '').toLowerCase();
      if (roleStr.includes('accounting')) {
        effectiveDept = 'accounting';
      } else if (roleStr.includes('it')) {
        effectiveDept = 'it administration';
      } else if (roleStr.includes('registrar')) {
        effectiveDept = 'registrar';
      }

      const matchesDept = 
        !isSuperAdmin ||
        departmentFilter === 'All Departments' || 
        effectiveDept.includes(departmentFilter.toLowerCase().replace(' departments', '').replace(' administration', ''));

      const matchesRole = 
        roleFilter === 'All Roles' ||
        (roleFilter === 'Department Admins' && roleStr.includes('admin')) ||
        (roleFilter === 'Operational Staff' && roleStr.includes('staff'));

      const matchesStatus = 
        statusFilter === 'All Status' || 
        (item.status || 'Inactive').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });
  }, [search, registrars, departmentFilter, roleFilter, statusFilter, isSuperAdmin]);

  const totalPages = Math.ceil(filteredRegistrars.length / entriesPerPage);
  const paginatedRegistrars = filteredRegistrars.slice(
      (currentPage - 1) * entriesPerPage,
      currentPage * entriesPerPage
  );

  useEffect(() => {
      setCurrentPage(1);
  }, [search, entriesPerPage, departmentFilter, roleFilter, statusFilter]);

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
        <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
          
          {/* Header Section */}
          <div className="flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-center md:justify-between border-b border-slate-100 bg-slate-50/40">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-black text-slate-900 m-0">{pageTitle}</h1>
                {!isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Lock size={10} />
                    {scopedDeptLabel}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-slate-500 font-medium m-0 mt-0.5">{pageSubtitle}</p>
            </div>

            {/* Toolbar Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Department Filter (Visible for Super Admin) */}
              {isSuperAdmin && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white py-1.5 px-3 text-[11.5px] font-bold text-slate-700 outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Registrar">Registrar Department</option>
                  <option value="Accounting">Accounting Department</option>
                  <option value="IT Administration">IT Administration</option>
                </select>
              )}

              {/* Role Level Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-full border border-slate-200 bg-white py-1.5 px-3 text-[11.5px] font-bold text-slate-700 outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="All Roles">All Roles</option>
                <option value="Department Admins">Admins</option>
                <option value="Operational Staff">Staff Level</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-full border border-slate-200 bg-white py-1.5 px-3 text-[11.5px] font-bold text-slate-700 outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search staff..."
                  className="w-48 sm:w-56 rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3.5 text-[12px] font-medium outline-none focus:border-blue-500 shadow-2xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Add Staff Button */}
              {canAddStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(true);
                    setAddSuccessData(null);
                    setAddError('');
                    setAddForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      department: defaultDept
                    });
                    setEmailStatus({ checking: false, available: null, message: '' });
                    setCopied(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111827] hover:bg-[#213448] text-white text-[12px] font-bold shadow-2xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <UserPlus size={13} />
                  <span>Add Staff</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-5">Staff ID</th>
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-5">Department</th>
                  <th className="py-3 px-5 text-center">Role</th>
                  <th className="py-3 px-5">Email Address</th>
                  <th className="py-3 px-5">Last Login IP</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {loading ? (
                  <TableSkeleton columns={8} rows={entriesPerPage || 10} />
                ) : paginatedRegistrars.length > 0 ? (
                  paginatedRegistrars.map((item) => {
                    const targetInfo = getPromotionTarget(item.role);
                    const isAdminRole = (item.role || '').toLowerCase().includes('admin');
                    const roleStr = (item.role || '').toLowerCase();
                    const deptName = roleStr.includes('accounting')
                      ? 'Accounting'
                      : roleStr.includes('it')
                      ? 'IT Administration'
                      : roleStr.includes('registrar')
                      ? 'Registrar'
                      : (item.department || 'Administration');

                    return (
                    <tr
                      key={item._id || item.registrarId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-slate-600 font-bold">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11.5px]">
                          {item.registrarId}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Building2 size={11} className="text-slate-500" />
                          {deptName}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          isAdminRole
                            ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                            : 'bg-blue-50 text-blue-700 border-blue-200/60'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-slate-600">{item.email}</td>
                      <td className="py-3 px-5">
                        {item.lastLoginIp ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-[11px] font-bold">
                            {item.lastLoginIp}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            item.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {item.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex justify-end gap-1.5 items-center flex-wrap">
                          {isSuperAdmin && targetInfo && (
                            <button
                              onClick={() => handleRoleChange(item._id || item.registrarId, item.role, targetInfo.target, item.name)}
                              className={`min-w-[80px] rounded-full px-2.5 py-1 text-[11px] font-bold text-white text-center border-t border-white/20 border-b-2 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer ${
                                targetInfo.type === 'promote'
                                  ? 'bg-blue-600 hover:bg-blue-700 border-blue-900/40'
                                  : 'bg-purple-600 hover:bg-purple-700 border-purple-900/40'
                              }`}
                              title={targetInfo.label}
                            >
                              {targetInfo.type === 'promote' ? 'Promote' : 'Demote'}
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(item._id || item.registrarId, item.status || 'Inactive')}
                            className={`min-w-[80px] rounded-full px-2.5 py-1 text-[11px] font-bold text-white text-center border-t border-white/20 border-b-2 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer ${
                                (item.status || 'Inactive') === 'Active'
                                    ? 'bg-amber-600 hover:bg-amber-700 border-amber-900/40'
                                    : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-900/40'
                            }`}
                          >
                            {(item.status || 'Inactive') === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <Link
                            to={`/manage-registrar/details/${item._id || item.registrarId}`}
                            className="min-w-[70px] rounded-full bg-[#2c3543] hover:bg-[#1f2631] px-3 py-1 text-[11px] font-bold text-white text-center border-t border-white/20 border-b-2 border-black/50 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer"
                          >
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="8" className="py-12 text-center text-slate-400 italic">No staff accounts found in this department.</td></tr>
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
                <span className="text-xs text-slate-500 font-bold px-2">
                    Page {currentPage} of {totalPages || 1}
                </span>
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
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 relative border border-slate-100 overflow-hidden">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setAddSuccessData(null);
              }}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            {!addSuccessData ? (
              <>
                <div className="mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-[#111827] text-white flex items-center justify-center mb-3 shadow-2xs">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Add Staff Member</h3>
                  <p className="text-slate-500 text-[12px] mt-1 leading-relaxed">
                    Create an official staff account. A secure temporary password will be automatically generated and emailed to the staff member.
                  </p>
                </div>

                {addError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-red-500" />
                    <span>{addError}</span>
                  </div>
                )}

                <form onSubmit={handleAddStaffSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="First name"
                        value={addForm.firstName}
                        onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:bg-white focus:outline-none focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Last name"
                        value={addForm.lastName}
                        onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:bg-white focus:outline-none focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11.5px] font-bold text-slate-700">Official Email</label>
                      {emailStatus.checking && (
                        <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                          Checking...
                        </span>
                      )}
                      {!emailStatus.checking && emailStatus.available === true && (
                        <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check size={11} /> Available
                        </span>
                      )}
                      {!emailStatus.checking && emailStatus.available === false && (
                        <span className="text-[10.5px] text-red-500 font-bold flex items-center gap-1">
                          <X size={11} /> Already registered
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="e.g. staff.member@university.edu"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-[13px] text-slate-900 focus:bg-white focus:outline-none transition-all ${
                        emailStatus.available === false
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                          : emailStatus.available === true
                          ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                          : 'border-slate-200 focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-700 mb-1">Department</label>
                    {isSuperAdmin || isITAdmin ? (
                      <div className="relative">
                        <select
                          value={addForm.department}
                          onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:bg-white focus:outline-none focus:border-[#213448] focus:ring-2 focus:ring-[#213448]/10 transition-all appearance-none cursor-pointer"
                        >
                          <option value="Registrar">Registrar Department (Staff Level)</option>
                          <option value="Accounting">Accounting Department (Staff Level)</option>
                          <option value="IT Administration">IT Administration Department</option>
                        </select>
                        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                          <i className="fa-solid fa-chevron-down"></i>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 flex items-center justify-between">
                        <span>{addForm.department} Department</span>
                        <span className="text-[10px] uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold">Scoped</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                      <i className="fa-solid fa-circle-info text-blue-500 mr-1"></i>
                      New accounts are provisioned at <strong>Staff level</strong>. The temporary password and activation details will be emailed upon creation.
                    </p>
                  </div>

                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-[13px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading || emailStatus.available === false}
                      className="w-2/3 py-2.5 bg-[#111827] hover:bg-[#213448] text-white rounded-full font-bold text-[13px] shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {addLoading ? (
                        <>
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Creating & Sending Email...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Create & Send Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl shadow-2xs">
                  <Check size={28} className="stroke-[3]" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">Staff Successfully Added!</h3>
                <p className="text-slate-500 text-[12px] leading-relaxed max-w-sm mx-auto mb-4">
                  An automated email containing credentials and portal access has been dispatched to <strong>{addSuccessData.email}</strong>.
                </p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left mb-4 space-y-2">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-slate-500 font-medium">Full Name:</span>
                    <span className="font-bold text-slate-900">{addSuccessData.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-slate-500 font-medium">Department:</span>
                    <span className="font-bold text-slate-800">{addSuccessData.department}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-slate-500 font-medium">Role:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[11px]">{addSuccessData.role}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Temp Password:</span>
                    <code className="bg-white border border-slate-300 px-2.5 py-0.5 rounded font-mono font-bold text-slate-900 text-[13px] select-all">
                      {addSuccessData.tempPassword}
                    </code>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mb-4">
                  <p className="text-[11.5px] text-amber-900 leading-snug m-0">
                    <i className="fa-solid fa-shield-halved text-amber-600 mr-1.5"></i>
                    <strong>Important Security Notice:</strong> Upon logging in, it is recommended to change the temporary password in the profile settings.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Details</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setAddSuccessData(null);
                    }}
                    className="w-1/2 py-2.5 bg-[#111827] hover:bg-[#213448] text-white rounded-full font-bold text-[12.5px] shadow-sm transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageRegistrar;
