import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import api from '../../api';

const ManageRegistrar = () => {
  const [registrars, setRegistrars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
      <div className="p-8 bg-[#f8fafc] min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Staff</h1>
          <p className="text-sm text-gray-500">View and manage staff accounts.</p>
        </div>
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
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center text-gray-400">Loading registrars...</td></tr>
                ) : paginatedRegistrars.length > 0 ? (
                  paginatedRegistrars.map((item, idx) => (
                    <tr
                      key={item._id || item.registrarId}
                      className={`transition-colors ${idx % 2 !== 0 ? 'bg-[#F9FAFF]' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <td className="px-8 py-4 font-mono text-gray-500">{item.registrarId}</td>
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
                            to={`/manage-registrar/details/${item._id}`}
                            className="min-w-[130px] rounded-full bg-[#1D2D44] px-4 py-2 text-[11px] font-bold text-white text-center hover:bg-[#152030] transition-colors shadow-sm"
                          >
                            Manage Registrar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-20 text-center text-gray-400 italic">No registrars found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Placeholder */}
          <div className="p-6 border-t border-gray-100 flex justify-center">
            <div className="flex items-center gap-2">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={`text-xs px-2 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black hover:underline cursor-pointer'}`}
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
                                className={`w-8 h-8 rounded text-xs transition-colors font-bold ${
                                    currentPage === pageNumber 
                                        ? 'bg-[#1D2D44] text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {pageNumber}
                            </button>
                        );
                    } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                        return <span key={pageNumber} className="text-gray-400 mt-2 text-xs">...</span>;
                    }
                    return null;
                })}

                <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={`text-xs px-2 ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black hover:underline cursor-pointer'}`}
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