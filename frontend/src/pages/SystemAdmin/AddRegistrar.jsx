import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ChevronRight, UserPlus, ShieldCheck, Briefcase, Save, X, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddRegistrar() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '' });
  const [generatedPassword, setGeneratedPassword] = useState('');

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

  const handleAddRegistrar = () => {
    setToast({ show: true, message: 'New Registrar added successfully!' });
    setTimeout(() => {
      setToast({ show: false, message: '' });
      navigate('/manage-registrar');
    }, 2000);
  };

  return (
    <Layout>
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans relative">
        
        {toast.show && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl bg-[#1D2D44] text-white">
            <CheckCircle size={18} />
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-[12px] mb-6 text-gray-400 uppercase tracking-widest font-bold">
            <span className="cursor-pointer hover:text-[#1D2D44]" onClick={() => navigate('/manage-registrar')}>Manage Registrar</span>
            <ChevronRight size={14} />
            <span className="text-[#1D2D44]">Add New Registrar</span>
          </div>

          <h2 className="text-[24px] font-bold text-[#1D2D44] mb-8">Registrar Registration</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 text-[#1D2D44]">
                  <UserPlus size={20} />
                  <h3 className="text-[16px] font-bold uppercase tracking-wider">Basic Information</h3>
                </div>
                <div className="space-y-5">
                  <FormInput label="First Name" placeholder="e.g. Maria" />
                  <FormInput label="Last Name" placeholder="e.g. Santos" />
                  <FormInput label="Email Address" placeholder="registrar.maria@university.edu" />
                </div>
              </section>

              <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 text-[#1D2D44]">
                  <ShieldCheck size={20} />
                  <h3 className="text-[16px] font-bold uppercase tracking-wider">Security</h3>
                </div>
                <div className="space-y-5">
                  <FormInput label="Employee ID" placeholder="e.g. 2024-REG-001" />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">Auto-Generated Password</label>
                        <button 
                            onClick={generatePassword}
                            className="text-[#1D2D44] text-[10px] font-bold flex items-center gap-1 hover:underline uppercase"
                        >
                            <RefreshCw size={12} /> Regenerate
                        </button>
                    </div>
                    <input 
                      type="text" 
                      value={generatedPassword} 
                      readOnly 
                      className="w-full bg-[#F1F5F9] border border-gray-200 rounded-lg p-3 text-sm font-mono text-[#1D2D44] font-bold text-center tracking-widest"
                    />
                    <p className="text-[10px] text-gray-400 italic">Complexity: Uppercase, Lowercase, Number, & Special Char.</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 h-full">
                <div className="flex items-center gap-2 mb-6 text-[#1D2D44]">
                  <Briefcase size={20} />
                  <h3 className="text-[16px] font-bold uppercase tracking-wider">Access & Roles</h3>
                </div>
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">Account Role</label>
                    <select className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-[#1D2D44] transition-all">
                      <option value="">Select Role</option>
                      <option value="staff">Registrar Staff</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">Specific Responsibility (Optional)</label>
                    <textarea 
                      placeholder="e.g. Handles Transcript of Records..."
                      className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm h-48 outline-none focus:border-[#1D2D44] resize-none transition-all" 
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-10">
            {/* Styled according to the requested "Cancel" image */}
            <button 
                onClick={() => navigate('/manage-registrar')} 
                className="bg-white border border-gray-300 text-gray-600 px-8 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <X size={14} /> Cancel
            </button>
            <button 
                onClick={handleAddRegistrar} 
                className="bg-[#1D2D44] text-white px-10 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#152030] shadow-lg active:scale-95 flex items-center gap-2 transition-all"
            >
              <Save size={14} /> Add Registrar
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FormInput({ label, placeholder = "" }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-[#1D2D44] transition-all"
      />
    </div>
  );
}