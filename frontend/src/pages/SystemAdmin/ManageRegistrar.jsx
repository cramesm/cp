import { useState, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';

const registrarData = [
  { id: 'REG-012345', name: 'Matt Dickerson', role: 'Registrar Staff', email: 'matt@gmail.com' },
  { id: 'REG-012346', name: 'Wiktoria', role: 'Registrar Staff', email: 'wiktoria@gmail.com' },
  { id: 'REG-012347', name: 'Trixie Byrd', role: 'Registrar Staff', email: 'trixie@gmail.com' },
  { id: 'REG-012348', name: 'Brad Mason', role: 'Registrar Staff', email: 'brad@gmail.com' },
  { id: 'REG-012349', name: 'Sanderson', role: 'Registrar Staff', email: 'sanderson@gmail.com' },
];

const ManageRegistrar = () => {
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const filteredRegistrars = useMemo(() => {
    return registrarData.filter((item) =>
      Object.values(item).some(val => val.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  return (
    <Layout>
      <div className="p-8 bg-[#f8fafc] min-h-screen">
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Header Section */}
          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between border-b border-gray-100">
            <div className="flex items-center gap-6">

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search registrars..."
                  className="w-64 rounded-md border border-gray-300 py-2 pl-9 pr-4 text-xs outline-none focus:border-[#1D2D44]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Add Button */}
            <Link 
              to="/manage-registrar/add" 
              className="flex items-center justify-center gap-2 rounded-md bg-[#6c4df6] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#5a3ed9] transition-all shadow-sm"
            >
              <Plus size={16} />
              Add New Registrar
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200">
                  <th className="px-8 py-5">Registrar ID</th>
                  <th className="px-8 py-5">Registrar Name</th>
                  <th className="px-8 py-5 text-center">Role</th>
                  <th className="px-8 py-5">Email Address</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {filteredRegistrars.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className={`transition-colors ${idx % 2 !== 0 ? 'bg-[#F9FAFF]' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <td className="px-8 py-4 font-mono text-gray-500">{item.id}</td>
                    <td className="px-8 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-8 py-4">
                      {/* Centered Role Badge */}
                      <div className="flex justify-center">
                        <span className="min-w-[100px] text-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
                          {item.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-gray-600">{item.email}</td>
                    <td className="px-8 py-4 text-right">
                      {/* Action Button - Uniform width and centered text */}
                      <div className="flex justify-end">
                        <Link 
                          to={`/manage-registrar/details/${item.id}`}
                          className="min-w-[130px] rounded-full bg-[#1D2D44] px-4 py-2 text-[11px] font-bold text-white text-center hover:bg-[#152030] transition-colors shadow-sm"
                        >
                          Manage Registrar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Placeholder */}
          <div className="p-6 border-t border-gray-100 flex justify-center">
            <div className="flex items-center gap-2">
              <button className="text-gray-400 text-xs px-2 hover:text-gray-600">Previous</button>
              <button className="w-8 h-8 bg-[#1D2D44] text-white text-xs rounded font-bold">1</button>
              <button className="w-8 h-8 bg-gray-200 text-gray-700 text-xs rounded font-bold hover:bg-gray-300">2</button>
              <button className="text-gray-400 text-xs px-2 hover:text-gray-600">Next</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManageRegistrar;