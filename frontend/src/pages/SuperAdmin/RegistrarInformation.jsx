import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import { ChevronRight, User, Trash2, Edit3, X, CheckCircle, Lock, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
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
    status: "Inactive"
  });

  const [registrarId, setRegistrarId] = useState(''); // MongoDB _id for API calls
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [confirmConfig, setConfirmConfig] = useState(null);

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
            status: registrar.status || 'Inactive'
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
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

  // Update password
  const handlePasswordUpdate = () => {
    if (!passwordData.newPassword) {
      setToast({ show: true, message: 'Please enter a new password', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ show: true, message: 'Passwords do not match', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    showConfirm({
      title: 'Reset Password',
      message: 'Are you sure you want to set a new password for this registrar?',
      type: 'warning',
      confirmText: 'Reset Password',
      onConfirm: async () => {
        try {
          await api.put(`/registrars/${registrarId || id}/password`, {
            password: passwordData.newPassword
          });
          setToast({ show: true, message: 'Password successfully updated!', type: 'success' });
          setPasswordData({ newPassword: '', confirmPassword: '' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        } catch (error) {
          console.error('Error resetting password:', error);
          setToast({ show: true, message: 'Failed to reset password.', type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        }
      }
    });
  };

  // Delete registrar account
  const handleDeleteAccount = () => {
    const consent = document.getElementById('consent');
    if (!consent?.checked) {
      setToast({ show: true, message: 'Please check the confirmation box before deleting', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    showConfirm({
      title: 'Delete Account',
      message: `Are you absolutely sure you want to permanently delete the registrar account for ${formData.firstName} ${formData.lastName}? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await api.delete(`/registrars/${registrarId || id}`);
          setToast({ show: true, message: 'Registrar deleted successfully!', type: 'success' });
          setTimeout(() => {
            navigate('/manage-registrar');
          }, 1500);
        } catch (error) {
          console.error('Error deleting registrar:', error);
          setToast({ show: true, message: 'Failed to delete registrar.', type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        } finally {
          setDeleting(false);
        }
      }
    });
  };

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
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[11.5px] text-slate-400 font-extrabold uppercase tracking-wider">
              <span className="cursor-pointer hover:text-slate-900 transition-colors" onClick={() => navigate('/manage-registrar')}>Manage Staff</span>
              <ChevronRight size={13} />
              <span className="text-slate-900">Registrar Details</span>
            </div>

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
                    <InfoInput label="Account Role" name="role" value={formData.role} onChange={handleInputChange} />
                    <InfoInput label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleInputChange} />
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
                      className="flex-1 bg-[#2c3543] hover:bg-[#1f2631] text-white py-2 rounded-full font-bold text-xs border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
                <section className="bg-white p-6 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-[#2c3543]">
                    <Lock size={18} />
                    <h3 className="text-[14px] font-black uppercase tracking-wider m-0">Update Security</h3>
                  </div>
                  <div className="space-y-3.5">
                    <PasswordInput
                      label="New Password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                    <PasswordInput
                      label="Confirm New Password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                    <button
                      onClick={handlePasswordUpdate}
                      className="w-full bg-[#2c3543] hover:bg-[#1f2631] text-white font-bold py-2 rounded-full text-xs border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all mt-2 cursor-pointer"
                    >
                      Set New Password
                    </button>
                  </div>
                </section>

                <section className="bg-rose-50/60 border border-rose-100 p-6 rounded-[22px] shadow-2xs">
                  <div className="flex items-center gap-2 mb-3 text-rose-900">
                    <Trash2 size={18} />
                    <h3 className="text-[14px] font-black uppercase tracking-wider m-0">Delete Account</h3>
                  </div>
                  <p className="text-[11.5px] text-rose-700 font-bold mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Permanent: Account deletion cannot be undone.
                  </p>
                  <div className="flex items-center gap-2.5 mb-4 bg-white/70 p-2.5 rounded-xl border border-rose-200/60">
                    <input type="checkbox" id="consent" className="w-3.5 h-3.5 accent-rose-600 cursor-pointer" />
                    <label htmlFor="consent" className="text-[11px] text-rose-900 font-bold leading-tight cursor-pointer">
                      I confirm that I want to permanently delete this account.
                    </label>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-full text-xs border-t border-white/20 border-b-2 border-rose-900 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin inline mr-1.5" /> Deleting...
                      </>
                    ) : (
                      'Delete Account'
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

function PasswordInput({ label, name, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-9 text-[13px] outline-none focus:border-blue-500 transition-all"
          placeholder="••••••••"
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
  );
}