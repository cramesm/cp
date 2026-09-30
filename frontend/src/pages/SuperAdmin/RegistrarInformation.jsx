import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import { ChevronRight, User, Trash2, Archive, Edit3, X, CheckCircle, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

export default function RegistrarInformation() {
  const navigate = useNavigate();
  const { id } = useParams();

  // State to handle editable fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "Registrar Staff",
    employeeId: "",
    status: "Inactive",
    lastLoginIp: "",
    lastLoginAt: null
  });

  const [registrarId, setRegistrarId] = useState(''); // MongoDB _id for API calls
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmConfig, setConfirmConfig] = useState(null);

  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const isSuperAdmin = userRole === 'super admin';

  const getPromotionTarget = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'registrar staff' || r === 'registrar') {
      return { target: 'Registrar Admin', type: 'promote' };
    }
    if (r === 'registrar admin') {
      return { target: 'Registrar Staff', type: 'demote' };
    }
    if (r === 'accounting staff' || r === 'accounting') {
      return { target: 'Accounting Admin', type: 'promote' };
    }
    if (r === 'accounting admin') {
      return { target: 'Accounting Staff', type: 'demote' };
    }
    return null;
  };

  const handlePromoteDemote = (targetRole) => {
    const isPromotion = targetRole.toLowerCase().includes('admin');
    const staffName = `${formData.firstName} ${formData.lastName}`.trim();
    showConfirm({
      title: isPromotion ? `Promote to ${targetRole}` : `Demote to ${targetRole}`,
      message: isPromotion
        ? `Are you sure you want to promote ${staffName} to ${targetRole}? They will receive administrative authority and an automated email notification.`
        : `Are you sure you want to demote ${staffName} to ${targetRole}? Their administrative authority will be revoked and set to staff processing level.`,
      type: isPromotion ? 'success' : 'warning',
      confirmText: isPromotion ? 'Promote Account' : 'Demote Account',
      onConfirm: async () => {
        try {
          const res = await api.put(`/registrars/${registrarId || id}/role`, { role: targetRole });
          if (res.data) {
            setFormData(prev => ({ ...prev, role: targetRole }));
            setToast({
              show: true,
              message: `${staffName} has been ${isPromotion ? 'promoted' : 'demoted'} to ${targetRole}!`,
              type: 'success'
            });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
          }
        } catch (err) {
          console.error('Error updating role:', err);
          const errorMsg = err.response?.data?.message || 'Failed to update role.';
          setToast({ show: true, message: errorMsg, type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3500);
        }
      }
    });
  };

  const showConfirm = ({ title, message, onConfirm, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    setConfirmConfig({
      title,
      message,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
          await onConfirm();
        } catch (err) {
          console.error(err);
        } finally {
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

  // Fetch registrar data
  useEffect(() => {
    const fetchRegistrar = async () => {
      try {
        const res = await api.get(`/registrars/${id}`);
        const registrar = res.data;
        if (registrar) {
          setRegistrarId(registrar._id); // Store MongoDB _id for API calls
          const fullName = registrar.name || '';
          const nameParts = fullName.split(' ');
          setFormData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: registrar.email,
            role: registrar.role,
            employeeId: registrar.registrarId || '',
            status: registrar.status || 'Inactive',
            lastLoginIp: registrar.lastLoginIp || '',
            lastLoginAt: registrar.lastLoginAt || null
          });
        } else {
          setToast({ show: true, message: 'Registrar not found', type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        }
      } catch (error) {
        console.error('Error fetching registrar:', error);
        setToast({ show: true, message: 'Failed to load registrar data', type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrar();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Disallow employeeId changes
    if (name === 'employeeId') return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Update profile information
  const handleUpdateInfo = () => {
    showConfirm({
      title: 'Update Registrar Profile',
      message: 'Are you sure you want to update this registrar\'s information?',
      type: 'info',
      confirmText: 'Save Changes',
      onConfirm: async () => {
        setUpdating(true);
        try {
          const payload = {
            name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            email: formData.email.trim().toLowerCase(),
            role: formData.role
          };
          
          await api.put(`/registrars/${registrarId || id}`, payload);
          setToast({ show: true, message: 'Registrar profile updated successfully!', type: 'success' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        } catch (error) {
          console.error('Error updating registrar:', error);
          const errorMsg = error.response?.data?.message || 'Failed to update registrar information.';
          setToast({ show: true, message: errorMsg, type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        } finally {
          setUpdating(false);
        }
      }
    });
  };



  // Archive registrar account
  const handleDeleteAccount = () => {
    const consent = document.getElementById('consent');
    if (!consent?.checked) {
      setToast({ show: true, message: 'Please check the confirmation box before archiving', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    showConfirm({
      title: 'Archive Account',
      message: `Are you sure you want to archive the registrar account for ${formData.firstName} ${formData.lastName}? This will deactivate the account and hide it from the active staff list.`,
      type: 'warning',
      confirmText: 'Archive Account',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await api.delete(`/registrars/${registrarId || id}`);
          setToast({ show: true, message: 'Registrar archived successfully!', type: 'success' });
          setTimeout(() => {
            navigate('/manage-registrar');
          }, 1500);
        } catch (error) {
          console.error('Error archiving registrar:', error);
          setToast({ show: true, message: 'Failed to archive registrar.', type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const targetPromotion = getPromotionTarget(formData.role);

  return (
    <Layout>
      <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">
        {toast.show && (
          <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl text-white transition-all ${
            toast.type === 'success' ? 'bg-[#2c3543]' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <p className="font-bold text-xs tracking-wide m-0">{toast.message}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-[22px] p-12 text-center text-slate-500 font-bold border border-slate-100">
            Loading registrar details...
          </div>
        ) : (
          <div className="max-w-6xl mx-auto w-full space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Section: Info Card */}
              <div className="lg:col-span-7 space-y-4">
                <section className="bg-white p-6 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-[#2c3543]">
                      <User size={20} />
                      <h3 className="text-[15px] font-black uppercase tracking-wider m-0">Registrar Profile</h3>
                    </div>
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      formData.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {formData.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                    <InfoInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                    <div className="md:col-span-2">
                      <InfoInput label="Email Address" name="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                    
                    {/* Account Role with Super Admin Privilege Indicator */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Account Role</label>
                        <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          (formData.role || '').toLowerCase().includes('admin')
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {(formData.role || '').toLowerCase().includes('admin') ? 'Admin Tier' : 'Staff Tier'}
                        </span>
                      </div>
                      {isSuperAdmin ? (
                        <div className="relative">
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                          >
                            <option value="Registrar Staff">Registrar Staff (Document Processing)</option>
                            <option value="Registrar Admin">Registrar Admin (Department Head)</option>
                            <option value="Accounting Staff">Accounting Staff (Payment Auditing Desk)</option>
                            <option value="Accounting Admin">Accounting Admin (Finance Head)</option>
                            <option value="IT Administrator">IT Administrator (System Security)</option>
                          </select>
                          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            <i className="fa-solid fa-chevron-down"></i>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>{formData.role}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">(Managed by Super Admin)</span>
                        </div>
                      )}
                    </div>

                    {/* Employee ID: Immutable official identifier */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Employee ID</label>
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Fixed (Cannot be changed)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100/90 border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-mono font-bold text-slate-700 cursor-not-allowed select-all flex items-center justify-between">
                        <span>{formData.employeeId || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 font-semibold font-sans">Official Staff ID</span>
                      </div>
                    </div>

                    {/* Quick 1-Click Promote / Demote Action Card for Super Admin */}
                    {isSuperAdmin && targetPromotion && (
                      <div className="md:col-span-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            targetPromotion.type === 'promote' ? 'bg-blue-600 text-white shadow-xs' : 'bg-purple-600 text-white shadow-xs'
                          }`}>
                            <i className={targetPromotion.type === 'promote' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'}></i>
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                              {targetPromotion.type === 'promote' ? 'Appoint to Department Administrator' : 'Demote to Staff Processing Level'}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {targetPromotion.type === 'promote' 
                                ? `Promote this account to ${targetPromotion.target} with administrative department powers.` 
                                : `Demote this account to ${targetPromotion.target} (operational staff level).`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePromoteDemote(targetPromotion.target)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all shadow-xs cursor-pointer shrink-0 border-t border-white/20 border-b-2 ${
                            targetPromotion.type === 'promote' 
                              ? 'bg-blue-600 hover:bg-blue-700 border-blue-950/40' 
                              : 'bg-purple-600 hover:bg-purple-700 border-purple-950/40'
                          }`}
                        >
                          {targetPromotion.type === 'promote' ? `Promote to ${targetPromotion.target}` : `Demote to ${targetPromotion.target}`}
                        </button>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Last Login IP Address</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-700">
                        {formData.lastLoginIp || 'No login recorded yet'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Last Login Timestamp</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700">
                        {formData.lastLoginAt ? new Date(formData.lastLoginAt).toLocaleString('en-US') : 'No login recorded yet'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-8 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => navigate('/manage-registrar')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X size={13} /> Back to List
                    </button>
                    <button
                      onClick={handleUpdateInfo}
                      disabled={updating}
                      className="flex-1 bg-[#2c3543] hover:bg-[#1f2631] text-white py-2 rounded-full font-bold text-xs border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {updating ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Edit3 size={13} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>

              {/* Right Section: Security Cards */}
              <div className="lg:col-span-5 space-y-4">
                {/* Account Security Policy Card (Replaces manual password reset form) */}
                <section className="bg-white p-6 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 text-[#2c3543]">
                    <Lock size={18} />
                    <h3 className="text-[14px] font-black uppercase tracking-wider m-0">Account Security Policy</h3>
                  </div>
                  <div className="space-y-3 text-xs text-slate-600">
                    <p className="leading-relaxed">
                      Staff accounts are provisioned with an automated temporary password dispatched via email upon account creation.
                    </p>
                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-[11.5px] text-slate-700 font-medium space-y-1">
                      <div className="font-bold text-slate-900">Self-Managed Passwords:</div>
                      <p className="m-0 text-slate-600">
                        For security and compliance, staff members independently manage and update their permanent password in <strong>Profile Settings</strong> after logging in.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="bg-amber-50/60 border border-amber-200/80 p-6 rounded-[22px] shadow-2xs">
                  <div className="flex items-center gap-2 mb-3 text-amber-900">
                    <Archive size={18} />
                    <h3 className="text-[14px] font-black uppercase tracking-wider m-0">Archive Account</h3>
                  </div>
                  <p className="text-[11.5px] text-amber-800 font-bold mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Archiving: This account will be deactivated and hidden from the active staff list. Historical data is preserved.
                  </p>
                  <div className="flex items-center gap-2.5 mb-4 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <input type="checkbox" id="consent" className="w-3.5 h-3.5 accent-amber-600 cursor-pointer" />
                    <label htmlFor="consent" className="text-[11px] text-amber-950 font-bold leading-tight cursor-pointer">
                      I confirm that I want to archive this account.
                    </label>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-full text-xs border-t border-white/20 border-b-2 border-amber-900 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin inline mr-1.5" /> Archiving...
                      </>
                    ) : (
                      'Archive Account'
                    )}
                  </button>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig !== null}
        onClose={closeConfirm}
        onConfirm={confirmConfig?.onConfirm}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        type={confirmConfig?.type}
        confirmText={confirmConfig?.confirmText}
        cancelText={confirmConfig?.cancelText}
        isLoading={confirmConfig?.isLoading}
      />
    </Layout>
  );
}

function InfoInput({ label, name, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{label}</label>
      <input 
        type="text" 
        name={name}
        value={value} 
        onChange={onChange}
        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 transition-all"
      />
    </div>
  );
}
