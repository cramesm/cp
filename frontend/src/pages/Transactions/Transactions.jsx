import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api';
import { X, ZoomIn, CheckCircle, Image as ImageIcon, Send, AlertCircle, RefreshCw, Receipt, Eye } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5000';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All Modes');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Toast States
  const [selectedTx, setSelectedTx] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [zoomedImage, setZoomedImage] = useState(false);

  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const triggerToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const handleVerifyAction = async (type) => {
    if (!adminNote.trim() && type === 'Needs Update') {
      setError('Please enter remarks to send to the student/alumni.');
      return;
    }

    try {
      await api.put(`/transactions/${selectedTx.transactionId}/verify`, {
        status: type === 'Approve' ? 'Completed' : 'Needs Update',
        adminRemarks: adminNote
      });

      triggerToast(
        type === 'Approve' 
          ? `Payment approved for ${selectedTx.name}.` 
          : `Update requested for ${selectedTx.name}.`,
        'success'
      );

      setSelectedTx(null);
      setAdminNote('');
      setError('');
      fetchTransactions();
    } catch (err) {
      console.error('Verification error:', err);
      triggerToast('Failed to update transaction. Please try again.', 'error');
    }
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.payerName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'All Status' || tx.status === filterStatus;
      const matchesMode = filterPaymentMode === 'All Modes' || tx.paymentMode === filterPaymentMode;

      const txDate = new Date(tx.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || txDate >= start) && (!end || txDate <= end);

      return matchesSearch && matchesStatus && matchesMode && matchesDate;
    });
  }, [transactions, searchTerm, filterStatus, filterPaymentMode, startDate, endDate]);

  const totalPages = Math.ceil(filteredTransactions.length / entriesPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPaymentMode, startDate, endDate, entriesPerPage]);

  const paymentModes = ['All Modes', 'GCash', 'Maya', 'GoThyme', 'Other Online Payment'];
  const statuses = ['All Status', 'Pending Verification', 'Completed', 'Needs Update', 'Rejected'];

  return (
    <Layout>
      <div className="p-6 bg-[#F8F9FA] min-h-screen font-sans relative">

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl bg-[#1D2D44] text-white animate-fade-in">
            <CheckCircle size={18} />
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Top Controls Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-3 flex-1 max-md">
                <div className="flex items-center gap-2 text-[14px] text-[#7E84A3]">
                  <span>Show</span>
                  <select
                    className="appearance-none bg-white border border-[#DDE2EF] rounded-[6px] px-3 py-1 pr-8 outline-none text-[#4D5E80] cursor-pointer transition-all hover:border-gray-400"
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
                  placeholder="Search by ID, Name, or Payer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={filterPaymentMode}
                  onChange={(e) => setFilterPaymentMode(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-2 text-sm bg-white min-w-[120px] outline-none"
                >
                  {paymentModes.map(m => <option key={m}>{m}</option>)}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-2 text-sm bg-white min-w-[140px] outline-none"
                >
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
                <input
                  type="date"
                  className="border border-gray-300 rounded px-2 py-2 text-sm text-gray-500 outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="border border-gray-300 rounded px-2 py-2 text-sm text-gray-500 outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[13px] text-gray-800 border-b border-gray-200 uppercase font-bold">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Payer Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {loading ? (
                  <tr><td colSpan="9" className="px-6 py-20 text-center text-gray-400 italic">Loading transactions...</td></tr>
                ) : paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((tx, idx) => {
                    const txDate = new Date(tx.date);
                    const formattedDate = txDate.toLocaleDateString('en-US', {
                      year: 'numeric', month: '2-digit', day: '2-digit'
                    });
                    return (
                      <tr key={tx._id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFF]'}>
                        <td className="px-6 py-4 text-gray-600 font-mono">{tx.transactionId}</td>
                        <td className="px-6 py-4 text-gray-600">{tx.requestId}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{tx.payerName || tx.name}</td>
                        <td className="px-6 py-4 text-gray-600">{tx.documentType}</td>
                        <td className="px-6 py-4 text-gray-700 font-semibold">₱{tx.amount || '0.00'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getPaymentModeStyle(tx.paymentMode)}`}>
                            {tx.paymentMode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formattedDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`min-w-[120px] text-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(tx.status)}`}>
                              {tx.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {tx.status === 'Pending Verification' ? (
                              <button
                                onClick={() => { setSelectedTx(tx); setAdminNote(''); setError(''); }}
                                className="min-w-[120px] py-2 rounded-full text-[11px] font-bold bg-[#1D2D44] text-white shadow-md hover:bg-[#152030] transition-all flex items-center justify-center gap-1.5"
                              >
                                <Receipt size={13} /> Verify Receipt
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                                className="min-w-[120px] py-2 rounded-full text-[11px] font-bold bg-[#E5E7EB] text-gray-700 hover:bg-gray-300 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Eye size={13} /> View Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center text-[#99AAB5] italic text-[16px]">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white p-6 border-t border-gray-100 flex justify-center gap-2">
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
                    className={`w-8 h-8 rounded text-xs transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-[#2f3947] text-white font-bold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

        {/* ====== RECEIPT VERIFICATION MODAL ====== */}
        {selectedTx && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-[#1D2D44] p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Verify Payment Receipt</h3>
                  <p className="text-xs opacity-70 mt-1 uppercase tracking-widest font-semibold">
                    {selectedTx.transactionId} • {selectedTx.payerName || selectedTx.name} • via {selectedTx.paymentMode}
                  </p>
                </div>
                <button onClick={() => setSelectedTx(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Receipt Image */}
                <div className="lg:col-span-7">
                  <h4 className="text-[12px] font-bold text-gray-500 uppercase mb-3 flex justify-between">
                    Uploaded Receipt
                    {selectedTx.receiptImage && (
                      <span 
                        className="text-[#1D2D44] cursor-pointer flex items-center gap-1 hover:underline"
                        onClick={() => setZoomedImage(!zoomedImage)}
                      >
                        <ZoomIn size={14} /> {zoomedImage ? 'Fit' : 'Zoom'}
                      </span>
                    )}
                  </h4>
                  <div className="bg-[#F8FAFC] border-2 border-dashed border-gray-200 rounded-xl p-4 flex justify-center items-center min-h-[320px] overflow-auto">
                    {selectedTx.receiptImage ? (
                      <img
                        src={`${API_BASE}${selectedTx.receiptImage}`}
                        alt="Payment Receipt"
                        className={`rounded-lg shadow-sm transition-all duration-300 ${zoomedImage ? 'max-w-none w-auto' : 'max-h-[300px] object-contain'}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`flex-col items-center text-gray-400 ${selectedTx.receiptImage ? 'hidden' : 'flex'}`}>
                      <ImageIcon size={48} className="mb-2" />
                      <span className="text-xs font-bold text-center">No receipt image uploaded</span>
                    </div>
                  </div>
                </div>

                {/* Right: Details & Actions */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* Payment Info */}
                  <div className="bg-[#F9FAFF] p-5 rounded-xl border border-[#DDE2EF]">
                    <h4 className="text-[11px] font-bold text-[#1D2D44] uppercase mb-4 tracking-wider">Payment Details</h4>
                    <div className="space-y-3 text-sm text-gray-600 font-medium">
                      <div className="flex justify-between">
                        <span>Payer</span>
                        <span className="font-bold text-gray-800">{selectedTx.payerName || selectedTx.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type</span>
                        <span className="font-semibold text-gray-700">{selectedTx.payerType || 'Student'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount</span>
                        <span className="font-bold text-[#1D2D44]">₱{selectedTx.amount || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Mode</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPaymentModeStyle(selectedTx.paymentMode)}`}>
                          {selectedTx.paymentMode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Document</span>
                        <span className="text-gray-700">{selectedTx.documentType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Remarks */}
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2 tracking-wider">
                      Admin Remarks
                    </label>
                    <textarea
                      className={`w-full h-32 p-4 border rounded-xl text-sm outline-none transition-all resize-none ${
                        error ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#1D2D44]'
                      }`}
                      placeholder="Enter remarks (required for requesting updates)..."
                      value={adminNote}
                      onChange={(e) => { setAdminNote(e.target.value); setError(''); }}
                    />
                    {error && (
                      <p className="text-red-500 text-[10px] font-bold mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> {error}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Pending Verification
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerifyAction('Needs Update')}
                    className="px-6 py-2.5 rounded-full border-2 border-red-500 text-red-500 font-bold text-xs uppercase hover:bg-red-50 transition-all tracking-widest flex items-center gap-2"
                  >
                    <RefreshCw size={14} /> Request Update
                  </button>
                  <button
                    onClick={() => handleVerifyAction('Approve')}
                    className="px-8 py-2.5 rounded-full bg-[#1D2D44] text-white font-bold text-xs uppercase hover:bg-[#152030] shadow-md flex items-center gap-2 tracking-widest"
                  >
                    <Send size={14} /> Approve Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== ZOOMED IMAGE OVERLAY ====== */}
        {zoomedImage && selectedTx?.receiptImage && (
          <div 
            className="fixed inset-0 z-[1001] bg-black/80 flex items-center justify-center cursor-zoom-out"
            onClick={() => setZoomedImage(false)}
          >
            <img
              src={`${API_BASE}${selectedTx.receiptImage}`}
              alt="Receipt Zoomed"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

// Helper: Status Badge Styles
function getStatusStyle(status) {
  switch (status) {
    case 'Pending Verification': return 'bg-[#FCF7B0] text-[#857A00]';
    case 'Completed': return 'bg-[#C6E7FF] text-[#2D6A8E]';
    case 'Needs Update': return 'bg-[#FFC1C1] text-[#A32A2A]';
    case 'Rejected': return 'bg-[#FFD1D1] text-[#F04438]';
    default: return 'bg-gray-100 text-gray-600';
  }
}

// Helper: Payment Mode Badge Styles
function getPaymentModeStyle(mode) {
  switch (mode) {
    case 'GCash': return 'bg-[#E0F0FF] text-[#0070E0]';
    case 'Maya': return 'bg-[#E8F5E8] text-[#2E7D32]';
    case 'GoThyme': return 'bg-[#FFF3E0] text-[#E65100]';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default Transactions;
