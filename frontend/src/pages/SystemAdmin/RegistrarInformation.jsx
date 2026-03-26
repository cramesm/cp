import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegistrarInformation() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-screen bg-white font-sans">
        
        {/* Main Content Area */}
        <div className="p-10 max-w-7xl w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6 text-gray-800">
            <span className="cursor-pointer hover:underline" onClick={() => navigate('/manage-registrar')}>Manage Registrar</span>
            <ChevronRight size={14} />
            <span className="font-bold">Registrar Information</span>
          </div>

          <div className="grid grid-cols-12 gap-10">
            
            {/* Left Section: Registrar Information */}
            <div className="col-span-7">
              <h3 className="text-2xl font-bold mb-8">Registrar Information</h3>
              <div className="space-y-6 max-w-md">
                <InfoInput label="First Name:" value="Matt" readOnly />
                <InfoInput label="Last Name:" value="Dickerson" readOnly />
                <InfoInput label="Email Address:" value="registrar@gmail.com" readOnly />
                <InfoInput label="Account Status:" value="Active" readOnly />
                <InfoInput label="Current Account Role:" value="Registrar Staff" readOnly />
                
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => navigate('/manage-registrar')}
                    className="flex-1 bg-[#a5a5a5] text-black font-bold py-2.5 rounded-md shadow-sm hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 bg-[#20354d] text-white font-bold py-2.5 rounded-md shadow-sm hover:bg-[#1a2b3e] transition-all">
                    Edit Information
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section: Security Settings */}
            <div className="col-span-5 space-y-8">
              <h3 className="text-2xl font-bold mb-4">Security Settings</h3>
              
              {/* Update Password Box */}
              <div className="bg-[#d2e7f7] border border-[#a6c8e3] rounded-lg p-6 shadow-sm">
                <h4 className="text-sm font-bold text-[#20354d] mb-4 uppercase tracking-wide">Update Password</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold block mb-1">New Password:</label>
                    <input type="password" className="w-full bg-[#f0f0f0] border-none rounded p-2.5 outline-none shadow-inner" />
                  </div>
                  <div>
                    <label className="text-sm font-bold block mb-1">Confirm New Password:</label>
                    <input type="password" className="w-full bg-[#f0f0f0] border-none rounded p-2.5 outline-none shadow-inner" />
                  </div>
                  <button className="w-full bg-[#20354d] text-white font-bold py-2 rounded shadow-md mt-2 hover:bg-[#1a2b3e]">
                    Set New Password
                  </button>
                </div>
              </div>

              {/* Delete Account Box */}
              <div className="bg-[#f9dada] border border-[#f5c6cb] rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-black inline">Delete Account:</h4>
                </div>
                <p className="text-sm font-bold mb-6">
                  Warning: <span className="font-medium">Account Deletion is Permanent.</span>
                </p>
                
                <div className="flex items-center gap-2 mb-6">
                  <input type="checkbox" id="consent" className="w-3 h-3 cursor-pointer" />
                  <label htmlFor="consent" className="text-[10px] text-gray-700 italic font-medium">
                    I hereby consent to delete this account.
                  </label>
                </div>

                <button className="w-full bg-[#7a2323] text-white font-bold py-2.5 rounded shadow-md hover:bg-[#5e1a1a] transition-all">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <footer className="mt-auto bg-[#d9d9d9] py-3 px-10 text-center">
          <p className="text-sm font-bold text-gray-700 uppercase tracking-widest">
            Last Login: 2026 - 02 - 23 11:30PM
          </p>
        </footer>
      </div>
    </AdminLayout>
  );
}

function InfoInput({ label, value, readOnly }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold text-gray-800">{label}</label>
      <input 
        type="text" 
        value={value} 
        readOnly={readOnly}
        className="w-full bg-[#e9e9e9] border-none rounded-md p-3 text-sm outline-none font-medium text-gray-600 shadow-inner"
      />
    </div>
  );
}