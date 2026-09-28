import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import { Search, Building2, Lock, ShieldCheck } from 'lucide-react';
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
  useEffect(() => {
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
    fetchRegistrars();
  }, []);

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
    </Layout>
  );
};

export default ManageRegistrar;
