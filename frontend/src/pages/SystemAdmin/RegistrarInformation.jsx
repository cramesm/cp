import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { ChevronRight, User, Trash2, Edit3, X, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegistrarInformation() {
  const navigate = useNavigate();
  
  // State to handle editable fields
  const [formData, setFormData] = useState({
    firstName: "Matt",
    lastName: "Dickerson",
    email: "registrar.dickerson@university.edu",
    role: "Registrar Staff",
    employeeId: "EMP-2026-042"
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleUpdateInfo = () => {
    triggerToast("Information updated successfully!");
  };

  const handlePasswordUpdate = () => {
    triggerToast("Password updated successfully!");
  };

  const handleDeleteAccount = () => {
    triggerToast("Account deletion request processed.", "error");
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-[#e9e9e9] font-sans relative">
        
        {toast.show && (
          <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl text-white transition-all ${
            toast.type === 'success' ? 'bg-[#1D2D44]' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <p className="font-bold text-sm tracking-wide">{toast.message}</p>
          </div>
        )}

        <div className="max-w-6xl mx-auto w-full p-8 flex-grow">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] mb-6 text-gray-500 uppercase tracking-widest font-bold">
            <span className="cursor-pointer hover:text-[#1D2D44] transition-colors" onClick={() => navigate('/manage-registrar')}>Manage Registrar</span>
            <ChevronRight size={14} />
            <span className="text-[#1D2D44]">Registrar Details</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Section: Info Card */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-[#1D2D44]">
                    <User size={22} />
                    <h3 className="text-[18px] font-bold uppercase tracking-wider">Registrar Profile</h3>
                  </div>
                  <span className="bg-[#C6E7FF] text-[#2D6A8E] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                  <InfoInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                  <div className="md:col-span-2">
                    <InfoInput label="Email Address" name="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <InfoInput label="Account Role" name="role" value={formData.role} onChange={handleInputChange} />
                  <InfoInput label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleInputChange} />
                </div>

                <div className="flex gap-3 mt-10">
                  <button 
                    onClick={() => navigate('/manage-registrar')}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <X size={14} /> Back to List
                  </button>
                  <button 
                    onClick={handleUpdateInfo}
                    className="flex-1 bg-[#1D2D44] text-white py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#152030] transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} /> Save Changes
                  </button>
                </div>
              </section>
            </div>

            {/* Right Section: Security Cards */}
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-[#EBF5FF] border border-[#BFDBFE] p-8 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-[#1D2D44]">
                  <Lock size={20} />
                  <h3 className="text-[14px] font-bold uppercase tracking-wider">Update Security</h3>
                </div>
                <div className="space-y-4">
                  <PasswordInput label="New Password" />
                  <PasswordInput label="Confirm New Password" />
                  <button 
                    onClick={handlePasswordUpdate}
                    className="w-full bg-[#1D2D44] text-white font-bold py-3 rounded-full text-xs uppercase tracking-widest mt-2 shadow-md hover:bg-[#152030] transition-all"
                  >
                    Set New Password
                  </button>
                </div>
              </section>

              <section className="bg-[#FFF1F2] border border-[#FECDD3] p-8 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-[#9F1239]">
                  <Trash2 size={20} />
                  <h3 className="text-[14px] font-bold uppercase tracking-wider">Delete Account</h3>
                </div>
                <p className="text-[12px] text-rose-800 font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={14} /> Warning: Account deletion is permanent.
                </p>
                <div className="flex items-center gap-3 mb-6 bg-white/50 p-3 rounded-lg border border-rose-200">
                  <input type="checkbox" id="consent" className="w-4 h-4 accent-rose-600 cursor-pointer" />
                  <label htmlFor="consent" className="text-[11px] text-rose-900 italic font-bold leading-tight cursor-pointer">
                    I confirm that I want to permanently delete this registrar account.
                  </label>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full bg-rose-700 text-white font-bold py-3 rounded-full text-xs uppercase tracking-widest hover:bg-rose-800 transition-all shadow-md"
                >
                  Delete Account
                </button>
              </section>
            </div>
          </div>
        </div>

        <footer className="bg-white border-t border-gray-300 py-5 px-10 mt-12">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] flex items-center justify-center gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Last Activity Recorded: April 03, 2026 — 11:30 PM
          </p>
        </footer>
      </div>
    </Layout>
  );
}

// Updated component: Removed readOnly and added onChange
function InfoInput({ label, name, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <input 
        type="text" 
        name={name}
        value={value} 
        onChange={onChange}
        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-medium text-[#1D2D44] outline-none focus:border-[#1D2D44] transition-all"
      />
    </div>
  );
}

function PasswordInput({ label }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-[#1D2D44] uppercase tracking-wider">{label}</label>
      <input 
        type="password" 
        className="w-full bg-white border border-blue-200 rounded-lg p-3 text-sm outline-none focus:border-[#1D2D44] transition-all"
        placeholder="••••••••"
      />
    </div>
  );
}