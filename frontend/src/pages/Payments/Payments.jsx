import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { X, ZoomIn, CheckCircle, Image as ImageIcon, Send, AlertCircle, RefreshCw } from 'lucide-react';

const Payments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Validation State
  const [filterError, setFilterError] = useState('');

  // DATA STATE
  const [payments, setPayments] = useState([
    { referenceNo: '89094', requestId: 'REQ1234-2026', name: 'Shanice', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Pending' },
    { referenceNo: '18933', requestId: 'REQ1234-2026', name: 'Wiktoria', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Completed' },
    { referenceNo: '89094', requestId: 'REQ1234-2026', name: 'Shanice', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Completed' },
    { referenceNo: '34304', requestId: 'REQ1234-2026', name: 'Brad Mason', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Completed' },
    { referenceNo: '20462', requestId: 'REQ1234-2026', name: 'Matt Dickerson', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Pending' },
    { referenceNo: '73003', requestId: 'REQ1234-2026', name: 'Jun Redfern', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Completed' },
    { referenceNo: '45169', requestId: 'REQ1234-2026', name: 'Trixie Byrd', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Pending' },
    { referenceNo: '44122', requestId: 'REQ1234-2026', name: 'Dominic', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Completed' },
    { referenceNo: '17188', requestId: 'REQ1234-2026', name: 'Sanderson', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Pending' },
    { referenceNo: '89094', requestId: 'REQ1234-2026', name: 'Shanice', amount: 'PHP 250', date: '2027-03-26', paymentMode: 'GCash', status: 'Completed' },
  ]);

  // Modal & Toast States
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const triggerToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const handleAction = (type) => {
    if (!adminNote.trim() && type === 'Request Update') {
      setError('Please enter remarks to send to the user.');
      return;
    }
    const newStatus = type === 'Approve' ? 'Completed' : 'Needs Update';
    setPayments(prev => prev.map(p => 
      p.referenceNo === selectedPayment.referenceNo ? { ...p, status: newStatus } : p
    ));
    triggerToast(type === 'Approve' ? `Approved.` : `Update requested.`, 'success');
    setSelectedPayment(null);
  };

  // FILTER LOGIC
  const filteredPayments = useMemo(() => {
    setFilterError('');

    // Validation: Start Date cannot be later than End Date
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setFilterError('Start date cannot be later than end date.');
      return [];
    }

    return payments.filter((payment) => {
      // Search logic (Ref No, Request ID, or Name)
      const matchesSearch = 
        payment.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        payment.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.requestId.toLowerCase().includes(searchTerm.toLowerCase());

      // Status logic
      const matchesStatus = filterStatus === 'All Status' || payment.status === filterStatus;

      // Date logic
      const paymentDate = new Date(payment.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || paymentDate >= start) && (!end || paymentDate <= end);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [payments, searchTerm, filterStatus, startDate, endDate]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-[#FCF7B0] text-[#857A00]';
      case 'Completed': return 'bg-[#C6E7FF] text-[#2D6A8E]';
      case 'Needs Update': return 'bg-[#FFC1C1] text-[#A32A2A]';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Layout>
      <div className="p-6 bg-[#F8F9FA] min-h-screen font-sans relative">
        
        {toast.show && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl bg-[#1D2D44] text-white">
                <CheckCircle size={18} />
                <p className="font-bold text-sm">{toast.message}</p>
            </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-3 flex-1 max-md">
                <div className="flex items-center gap-2 text-[14px] text-[#7E84A3]">
                  <span>Show</span>
                  <select 
                    className="appearance-none bg-white border border-[#DDE2EF] rounded-[6px] px-3 py-1 pr-8 outline-none text-[#4D5E80] cursor-pointer bg-no-repeat bg-[right_10px_center] transition-all hover:border-gray-400"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237E84A3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '12px' }}
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1D2D44]"
                  placeholder="Search here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded px-2 py-2 text-sm bg-white min-w-[120px] outline-none">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Needs Update</option>
                </select>
                <div className="flex flex-col relative">
                    <input type="date" className={`border ${filterError ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-2 text-sm text-gray-500 outline-none`} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col relative">
                    <input type="date" className={`border ${filterError ? 'border-red-500' : 'border-gray-300'} rounded px-2 py-2 text-sm text-gray-500 outline-none`} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            {filterError && <p className="text-red-500 text-[10px] font-bold mt-2 flex items-center gap-1"><AlertCircle size={12} /> {filterError}</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[13px] text-gray-800 border-b border-gray-200 uppercase font-bold">
                  <th className="px-6 py-4">Ref No.</th>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFF]'}>
                      <td className="px-6 py-4 text-gray-600 font-mono">#{item.referenceNo}</td>
                      <td className="px-6 py-4 text-gray-600">{item.requestId}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                      <td className="px-6 py-4 text-gray-600">{item.amount}</td>
                      <td className="px-6 py-4 text-gray-600">{item.date}</td>
                      <td className="px-6 py-4 text-gray-600">{item.paymentMode}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`min-w-[100px] text-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => item.status === 'Pending' ? setSelectedPayment(item) : navigate(`/payments/${item.referenceNo}`)}
                            className={`min-w-[135px] py-2 rounded-full text-[11px] font-bold transition-all text-center ${item.status === 'Pending' ? 'bg-[#1D2D44] text-white shadow-md' : 'bg-[#E5E7EB] text-gray-700'}`}
                          >
                            {item.status === 'Pending' ? 'Verify Receipt' : 'View Details'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-gray-400 italic">No matching payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VERIFICATION MODAL */}
        {selectedPayment && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-[#1D2D44] p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Verify Receipt - {selectedPayment.requestId}</h3>
                  <p className="text-xs opacity-70 mt-1 uppercase tracking-widest font-semibold">Transaction ID: #{selectedPayment.referenceNo} • {selectedPayment.name}</p>
                </div>
                <button onClick={() => setSelectedPayment(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                  <h4 className="text-[12px] font-bold text-gray-500 uppercase mb-3 flex justify-between">Uploaded Proof <span className="text-[#1D2D44] cursor-pointer flex items-center gap-1"><ZoomIn size={14}/> Zoom</span></h4>
                  <div className="bg-[#F8FAFC] border-2 border-dashed border-gray-200 rounded-xl p-4 flex justify-center items-center h-[320px]">
                    <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon size={48} className="mb-2" />
                        <span className="text-xs font-bold text-center">Receipt_Image_{selectedPayment.referenceNo}.png</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-[#F9FAFF] p-5 rounded-xl border border-[#DDE2EF]">
                    <h4 className="text-[11px] font-bold text-[#1D2D44] uppercase mb-4 tracking-wider">System Check</h4>
                    <div className="space-y-3 text-sm text-gray-600 font-medium">
                      <div className="flex justify-between">Payer Match? <CheckCircle size={16} className="text-green-500" /></div>
                      <div className="flex justify-between">Amount Match? <CheckCircle size={16} className="text-green-500" /></div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Remarks to User</label>
                    <textarea 
                      className={`w-full h-32 p-4 border rounded-xl text-sm outline-none transition-all resize-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#1D2D44]'}`}
                      placeholder="Enter remarks to send to the user..."
                      value={adminNote}
                      onChange={(e) => {setAdminNote(e.target.value); setError('');}}
                    />
                    {error && <p className="text-red-500 text-[10px] font-bold mt-2 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Pending Verification</span>
                <div className="flex gap-3">
                  <button onClick={() => handleAction('Request Update')} className="px-6 py-2.5 rounded-full border-2 border-red-500 text-red-500 font-bold text-xs uppercase hover:bg-red-50 transition-all tracking-widest flex items-center gap-2">
                    <RefreshCw size={14} /> Request Update
                  </button>
                  <button onClick={() => handleAction('Approve')} className="px-8 py-2.5 rounded-full bg-[#1D2D44] text-white font-bold text-xs uppercase hover:bg-[#152030] shadow-md flex items-center gap-2 tracking-widest">
                    <Send size={14} /> Approve Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Payments;