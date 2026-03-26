import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddRegistrar() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="p-10 max-w-6xl bg-white min-h-screen">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6 text-gray-800">
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/manage-registrar')}>Manage Registrar</span>
          <ChevronRight size={14} />
          <span className="font-bold">Add New Registrar</span>
        </div>

        <div className="grid grid-cols-2 gap-x-20">
          {/* Left Column */}
          <div className="space-y-10">
            <section>
              <h3 className="text-xl font-bold mb-6">Registrar Information</h3>
              <div className="space-y-4">
                <FormInput label="First Name:" />
                <FormInput label="Last Name:" />
                <FormInput label="Email Address:" />
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-6">Verification & Security</h3>
              <div className="space-y-4">
                <FormInput label="Verify Identity Via:" />
                <FormInput label="Password (Auto Generated):" placeholder="••••••••" readOnly />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            <section>
              <h3 className="text-xl font-bold mb-6">Access & Roles</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Account Role:</label>
                  <select className="w-full bg-[#e9e9e9] border-none rounded-md p-3 text-sm outline-none cursor-pointer">
                    <option value="">Select Role</option>
                    <option value="staff">Registrar Staff</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Specific Responsibility (Optional):</label>
                  <textarea className="w-full bg-[#e9e9e9] border-none rounded-md p-3 text-sm h-32 outline-none resize-none" />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-20">
          <button 
            onClick={() => navigate('/manage-registrar')}
            className="bg-[#a5a5a5] text-gray-800 px-10 py-2 rounded-md font-bold shadow-sm hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button className="bg-[#20354d] text-white px-10 py-2 rounded-md font-bold shadow-sm hover:bg-slate-800 transition-colors">
            Add Registrar
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

function FormInput({ label, readOnly = false, placeholder = "" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full bg-[#e9e9e9] border-none rounded-md p-3 text-sm outline-none"
      />
    </div>
  );
}