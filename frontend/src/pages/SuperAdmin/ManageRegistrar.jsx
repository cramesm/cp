import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../api';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import TableSkeleton from '../../components/TableSkeleton';

const ManageRegistrar = () => {
  const [registrars, setRegistrars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  // User role
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const isSuperAdmin = userRole === 'super admin';

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
                ? { ...reg, role: targetRole } 
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
                    message: 'We were unable to update the registrar\'s account status. Please try again.',
                    type: 'error'
                });
            }
        }
    });
  };

  const filteredRegistrars = useMemo(() => {
    return registrars.filter((item) =>
      Object.values(item).some(val => val?.toString().toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, registrars]);

  const totalPages = Math.ceil(filteredRegistrars.length / entriesPerPage);
  const paginatedRegistrars = filteredRegistrars.slice(
      (currentPage - 1) * entriesPerPage,
      currentPage * entriesPerPage
  );

  useEffect(() => {
      setCurrentPage(1);
  }, [search, entriesPerPage]);

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
              <h1 className="text-[18px] font-black text-slate-900 m-0">Manage Staff</h1>
              <p className="text-[11.5px] text-slate-500 font-medium m-0">View and manage authorized registrar accounts</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search registrars..."
                  className="w-56 rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3.5 text-[12px] font-medium outline-none focus:border-blue-500 shadow-2xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-5">Registrar ID</th>
                  <th className="py-3 px-5">Registrar Name</th>
                  <th className="py-3 px-5 text-center">Role</th>
                  <th className="py-3 px-5">Email Address</th>
                  <th className="py-3 px-5">Last Login IP</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {loading ? (
                    <TableSkeleton columns={7} rows={entriesPerPage || 10} />
                  ) : paginatedRegistrars.length > 0 ? (
                  paginatedRegistrars.map((item) => {
                    const targetInfo = getPromotionTarget(item.role);
                    const isAdminRole = (item.role || '').toLowerCase().includes('admin');

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
                  <tr><td colSpan="7" className="py-12 text-center text-slate-400 italic">No registrars found.</td></tr>
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
      </div>
    </Layout>
  );
};

export default ManageRegistrar;