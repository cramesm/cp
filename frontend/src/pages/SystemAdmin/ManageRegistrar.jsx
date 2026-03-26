import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
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
    <AdminLayout>
      <div className="p-8 bg-[#f8fafc] min-h-screen">
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <span>Show</span>
                <select 
                  className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 outline-none"
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span>entries</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search registrars..."
                  className="w-64 rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-xs outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Link 
              to="/manage-registrar/add" 
              className="flex items-center gap-2 rounded-lg bg-[#6c4df6] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#5a3ed9] transition-all"
            >
              <Plus size={16} />
              Add New Registrar
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-8 py-4">Registrar ID</th>
                  <th className="px-8 py-4">Registrar Name</th>
                  <th className="px-8 py-4">Role</th>
                  <th className="px-8 py-4">Email Address</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredRegistrars.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-8 py-4 font-mono">{item.id}</td>
                    <td className="px-8 py-4 font-semibold">{item.name}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                        {item.role}
                      </span>
                    </td>
                    <td className="px-8 py-4">{item.email}</td>
                    <td className="px-8 py-4 text-right">
                      {/* UPDATED: Wrapped button in a Link to the details page */}
                      <Link to={`/manage-registrar/details/${item.id}`}>
                        <button className="rounded-md bg-[#2f3947] px-4 py-1.5 text-[10px] font-bold text-white hover:bg-black transition-colors">
                          Manage Registrar
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageRegistrar;