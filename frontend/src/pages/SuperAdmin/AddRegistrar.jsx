import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import { ChevronRight, UserPlus, ShieldCheck, Briefcase, Save, X, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function AddRegistrar() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Registrar Staff'
  });

  // Validation errors
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Function to generate a secure 8-character password
  const generatePassword = () => {
    const charset = {
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lower: "abcdefghijklmnopqrstuvwxyz",
      number: "0123456789",
      special: "!@#$%^&*"
    };

    let password = "";
    password += charset.upper.charAt(Math.floor(Math.random() * charset.upper.length));
    password += charset.lower.charAt(Math.floor(Math.random() * charset.lower.length));
    password += charset.number.charAt(Math.floor(Math.random() * charset.number.length));
    password += charset.special.charAt(Math.floor(Math.random() * charset.special.length));

    const allChars = Object.values(charset).join("");
    for (let i = 0; i < 4; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    setGeneratedPassword(password.split('').sort(() => 0.5 - Math.random()).join(''));
  };

  useEffect(() => {
    generatePassword();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddRegistrar = () => {
    // Validate form before showing confirmation
    if (!validateForm()) {
      setToast({ show: true, message: 'Please fill in all required fields correctly', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return;
    }

    showConfirm({
      title: 'Add New Registrar',
      message: `Are you sure you want to add ${formData.firstName} ${formData.lastName} as a new registrar? An account will be created with the generated password.`,
      type: 'info',
      confirmText: 'Add Registrar',
      onConfirm: async () => {
        setLoading(true);
        try {
          // Prepare payload matching the API requirements
          const payload = {
            name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            email: formData.email.trim().toLowerCase(),
            password: generatedPassword,
            role: 'registrar',
            status: 'Active'
          };

          const response = await api.post('/registrars', payload);

          if (response.status === 201 || response.status === 200) {
            setToast({ show: true, message: 'Registrar successfully added!', type: 'success' });

            // Reset form
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              role: 'Registrar Staff'
            });
            generatePassword();

            // Navigate back to the list after short delay
            setTimeout(() => {
              navigate('/manage-registrar');
            }, 1500);
          }
        } catch (error) {
          console.error('Error adding registrar:', error);

          let errorMessage = 'Failed to add registrar. Please try again.';

          if (error.response) {
            if (error.response.data && error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (error.response.status === 400) {
              errorMessage = 'A registrar with this email already exists.';
            } else if (error.response.status === 403) {
              errorMessage = 'Access denied. You must be logged in as a Super Admin.';
            } else if (error.response.status === 401) {
              errorMessage = 'Unauthorized. Please log in again.';
            }
          } else if (error.request) {
            errorMessage = 'Server is not responding. Please check if the backend is running.';
          } else {
            errorMessage = error.message;
          }

          setToast({ show: true, message: errorMessage, type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <Layout>
      <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">

        {toast.show && (
          <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl text-white ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-[#2c3543]'
          }`}>
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <p className="font-bold text-xs m-0">{toast.message}</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-[11.5px] text-slate-400 font-extrabold uppercase tracking-wider">
            <span className="cursor-pointer hover:text-slate-900 transition-colors" onClick={() => navigate('/manage-registrar')}>Manage Registrar</span>
            <ChevronRight size={13} />
            <span className="text-slate-900">Add New Registrar</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <section className="bg-white p-6 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90">
                <div className="flex items-center gap-2 mb-5 text-[#2c3543]">
                  <UserPlus size={18} />
                  <h3 className="text-[14px] font-black uppercase tracking-wider m-0">Basic Information</h3>
                </div>
                <div className="space-y-4">
                  <FormInput
                    label="First Name"
                    placeholder="e.g. Maria"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                  />
                  <FormInput
                    label="Last Name"
                    placeholder="e.g. Santos"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                  />
                  <FormInput
                    label="Email Address"
                    placeholder="registrar.maria@university.edu"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                  />
                </div>
              </section>

              <section className="bg-white p-6 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90">
                <div className="flex items-center gap-2 mb-5 text-[#2c3543]">
                  <ShieldCheck size={18} />
                  <h3 className="text-[14px] font-black uppercase tracking-wider m-0">Security</h3>
                </div>
                <div className="space-y-4">
                  <FormInput label="Employee ID" placeholder="e.g. 2024-REG-001" name="employeeId" />

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="generatedPassword" className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Auto-Generated Password</label>
                      <button
                        onClick={generatePassword}
                        className="text-[#2c3543] text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <RefreshCw size={11} /> Regenerate
                      </button>
                    </div>
                    <input
                      type="text"
                      id="generatedPassword"
                      value={generatedPassword}
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-[#2c3543] font-bold text-center tracking-widest"
                    />
                    <p className="text-[10.5px] text-slate-400 italic m-0">Complexity: Uppercase, Lowercase, Number, & Special Char.</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section className="bg-white p-6 rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-5 text-[#2c3543]">
                  <Briefcase size={18} />
                  <h3 className="text-[14px] font-black uppercase tracking-wider m-0">Access & Roles</h3>
                </div>
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label htmlFor="responsibility" className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Specific Responsibility (Optional)</label>
                    <textarea
                      id="responsibility"
                      placeholder="e.g. Handles Transcript of Records..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs flex-1 outline-none focus:border-blue-500 resize-none transition-all"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              onClick={() => navigate('/manage-registrar')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={handleAddRegistrar}
              disabled={loading}
              className="bg-[#2c3543] hover:bg-[#1f2631] text-white px-7 py-2 rounded-full font-bold text-xs border-t border-white/20 border-b-2 border-black/50 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Save size={13} /> Add Registrar
                </>
              )}
            </button>
          </div>
        </div>
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

function FormInput({ label, placeholder = "", name, value, onChange, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white border rounded-xl px-3.5 py-2 text-[13px] outline-none transition-all ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-slate-200 focus:border-blue-500'
        }`}
      />
      {error && (
        <p className="text-[10.5px] text-red-600 font-bold flex items-center gap-1 m-0">
          <span className="text-red-500">•</span> {error}
        </p>
      )}
    </div>
  );
}