import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import ConfirmModal from '../../components/ConfirmModal';
import FeedbackModal from '../../components/FeedbackModal';
import FilterDrawer from '../../components/FilterDrawer';
import ActiveFilterChips from '../../components/ActiveFilterChips';
import api from '../../api';
import TableSkeleton from '../../components/TableSkeleton';
import { useModals } from '../../hooks/useModals';
import { 
  X, ZoomIn, CheckCircle, Image as ImageIcon, Send, AlertCircle, RefreshCw, 
  Receipt, Eye, XCircle, Undo2, SlidersHorizontal, ArrowDownAZ, ArrowUpZA, 
  Download, Copy, Check, FileSpreadsheet, TrendingUp, Clock, RotateCcw, 
  XOctagon 
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '') || 'http://127.0.0.1:5000';

const Transactions = () => {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'payments'); // 'payments' | 'refunds'

  // Role Checks
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const isSuperAdmin = userRole === 'super admin';
  const isStaffOrAdmin = ['super admin', 'registrar', 'registrar staff', 'admin', 'staff'].includes(userRole);
  const canVerify = isStaffOrAdmin;
  const { confirmConfig, feedbackConfig, showConfirm, showFeedback, closeConfirm, closeFeedback } = useModals();

  // Refund states
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundRemarks, setRefundRemarks] = useState('');
  const [refundActionLoading, setRefundActionLoading] = useState(false);
  const [refundConfirmModal, setRefundConfirmModal] = useState({ isOpen: false, refundId: null, status: null });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All Modes');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'All Status');
  const [filterDocType, setFilterDocType] = useState('All Types');
  const [filterUserRole, setFilterUserRole] = useState('All');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterUserStatus, setFilterUserStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [copiedId, setCopiedId] = useState(null);


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
      if (res.data && res.data.length > 0) {
        setStartDate(prev => {
          if (!prev) {
            const oldest = new Date(Math.min(...res.data.map(t => new Date(t.date))));
            return oldest.toLocaleDateString('en-CA');
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      setRefundsLoading(true);
      const res = await api.get('/refunds');
      setRefunds(res.data?.refunds || []);
    } catch (err) {
      console.error('Error fetching refunds:', err);
    } finally {
      setRefundsLoading(false);
    }
  };

  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      const role = localStorage.getItem('userRole') || '';
      if (role.toLowerCase() !== 'super admin') return;

      try {
        const [stuRes, alumRes] = await Promise.all([
          api.get('/v1/students').catch(() => ({ data: { data: [] } })),
          api.get('/v1/alumni').catch(() => ({ data: { data: [] } }))
        ]);
        const users = [...(stuRes.data?.data || []), ...(alumRes.data?.data || [])];
        const map = {};
        users.forEach(u => { if (u.email) map[u.email] = u; });
        setUserMap(map);
      } catch (err) { console.error('Error fetching users:', err); }
    };
    fetchUsers();
    fetchTransactions();
    fetchRefunds();
  }, []);

  // Update active tab and filter status if URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
    const status = searchParams.get('status');
    if (status) setFilterStatus(status);
  }, [searchParams]);

  const triggerToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  const handleVerify = async (status) => {
    if (!selectedTx) return;
    try {
      const response = await api.put(`/transactions/${selectedTx.transactionId}/verify`, {
        status,
        adminRemarks: adminNote
      });

      if (response.data.success) {
        setTransactions(prev => prev.map(tx =>
          tx.transactionId === selectedTx.transactionId
            ? { ...tx, status, adminRemarks: adminNote }
            : tx
        ));
        setSelectedTx(null);
        setAdminNote('');
        triggerToast(`Payment marked as ${status}`, 'success');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Failed to update transaction status.');
    }
  };

  // Open confirmation modal for refund processing
  const handleProcessRefund = (refundId, status) => {
    setRefundConfirmModal({ isOpen: true, refundId, status });
  };

  // Execute refund action after confirmation
  const executeProcessRefund = async () => {
    const { refundId, status } = refundConfirmModal;
    if (!refundId || !status) return;

    try {
      setRefundActionLoading(true);
      const res = await api.put(`/transactions/refunds/${refundId}/process`, {
        status,
        adminRemarks: refundRemarks
      });

      if (res.data.success) {
        setRefunds(prev => prev.map(r =>
          (r.refundId === refundId || r._id === refundId)
            ? { ...r, status, processedBy: 'admin', processedAt: new Date() }
            : r
        ));

        // Update corresponding transaction status
        if (status === 'Approved') {
          const targetRefund = refunds.find(r => r.refundId === refundId || r._id === refundId);
          if (targetRefund) {
            setTransactions(prev => prev.map(t =>
              t.transactionId === targetRefund.transactionId
                ? { ...t, status: 'Refunded' }
                : t
            ));
          }
        }

        setSelectedRefund(null);
        setRefundRemarks('');
        setRefundConfirmModal({ isOpen: false, refundId: null, status: null });
        triggerToast(`Refund request ${status.toLowerCase()} successfully!`, 'success');
      }
    } catch (err) {
      console.error('Process refund error:', err);
      triggerToast(err.response?.data?.message || 'Failed to process refund', 'error');
    } finally {
      setRefundActionLoading(false);
    }
  };

  const paymentModes = ['All Modes', 'Pay with QR', 'Cash'];
  const statuses = ['All Status', 'Pending Verification', 'Completed', 'Needs Update', 'Rejected', 'Refunded'];
  const docTypes = [
    'All Types',
    'Transcript of Records (TOR)',
    'Diploma (2nd Copy)',
    'Certificate of Enrollment (COE)',
    'Good Moral Certificate',
    'Certified True Copy (CTC)',
    'Form 137 (F-137)'
  ];

  // Financial KPI Metrics Computation
  const statsSummary = useMemo(() => {
    let collectedAmount = 0;
    let collectedCount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let refundedAmount = 0;
    let refundedCount = 0;
    let rejectedCount = 0;

    transactions.forEach(tx => {
      const amt = parseFloat(String(tx.amount || '0').replace(/[^0-9.-]+/g, '')) || 0;
      if (tx.status === 'Completed' || tx.status === 'Released') {
        collectedAmount += amt;
        collectedCount++;
      } else if (tx.status === 'Pending Verification' || tx.status === 'Pending') {
        pendingAmount += amt;
        pendingCount++;
      } else if (tx.status === 'Refunded') {
        refundedAmount += amt;
        refundedCount++;
      } else if (tx.status === 'Rejected') {
        rejectedCount++;
      }
    });

    refunds.forEach(rf => {
      if (rf.status === 'Approved') {
        const rAmt = parseFloat(String(rf.amount || '0').replace(/[^0-9.-]+/g, '')) || 0;
        // Avoid double-counting if transaction is already marked Refunded
        const linkedTx = transactions.find(t => t.transactionId === rf.transactionId);
        if (!linkedTx || linkedTx.status !== 'Refunded') {
          refundedAmount += rAmt;
          refundedCount++;
        }
      }
    });

    return {
      collectedAmount,
      collectedCount,
      pendingAmount,
      pendingCount,
      refundedAmount,
      refundedCount,
      rejectedCount
    };
  }, [transactions, refunds]);

  // Export to CSV Handler
  const handleExportCSV = () => {
    if (activeTab === 'payments') {
      const headers = ['Payment Date', 'Transaction ID', 'Request ID', 'Payer Name', 'Payer Email', 'Document Type', 'Payment Mode', 'Amount (PHP)', 'Status', 'Admin Remarks'];
      const rows = filteredTransactions.map(tx => [
        `"${new Date(tx.date || tx.createdAt || Date.now()).toLocaleString()}"`,
        `"${tx.transactionId || ''}"`,
        `"${tx.requestId || ''}"`,
        `"${(tx.payerName || tx.name || '').replace(/"/g, '""')}"`,
        `"${tx.payerEmail || ''}"`,
        `"${(tx.documentType || '').replace(/"/g, '""')}"`,
        `"${tx.paymentMode || 'Pay with QR'}"`,
        `"${tx.amount || '0.00'}"`,
        `"${tx.status || ''}"`,
        `"${(tx.adminRemarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `payments_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('Payments records exported to CSV successfully!', 'success');
    } else {
      const headers = ['Request Date', 'Refund ID', 'Transaction ID', 'Student Name', 'Student Email', 'Reason', 'Payment Method', 'Account Name', 'Account Number', 'Amount (PHP)', 'Status', 'Admin Remarks'];
      const rows = refunds.map(rf => [
        `"${new Date(rf.createdAt || Date.now()).toLocaleString()}"`,
        `"${rf.refundId || rf._id}"`,
        `"${rf.transactionId || ''}"`,
        `"${(rf.studentName || '').replace(/"/g, '""')}"`,
        `"${rf.studentEmail || ''}"`,
        `"${(rf.reason === 'Other' ? (rf.otherReason || 'Other') : rf.reason || '').replace(/"/g, '""')}"`,
        `"${rf.paymentMethod || rf.paymentMode || 'Original Method'}"`,
        `"${(rf.accountName || '').replace(/"/g, '""')}"`,
        `"${rf.accountNumber || ''}"`,
        `"${rf.amount || '0.00'}"`,
        `"${rf.status || ''}"`,
        `"${(rf.adminRemarks || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `refunds_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('Refund records exported to CSV successfully!', 'success');
    }
  };

  const formatShortId = (id, prefix = 'TXN') => {
    if (!id) return `#${prefix}-001`;
    const str = String(id);
    if (str.length <= 10) return str.startsWith('#') ? str : `#${str}`;
    const lastPart = str.split('-').pop() || str.slice(-4);
    return `#${prefix}-${lastPart.length > 6 ? lastPart.slice(-4) : lastPart}`;
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast(`Copied ${text} to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const name = (tx.payerName || tx.name || '').toLowerCase();
      const id = (tx.transactionId || '').toLowerCase();
      const ref = (tx.referenceNumber || '').toLowerCase();
      const payer = (tx.payerEmail || '').toLowerCase();
      const docType = (tx.documentType || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = name.includes(search) || id.includes(search) || ref.includes(search) || payer.includes(search) || docType.includes(search);
      
      let matchesMode = true;
      if (filterPaymentMode === 'Cash') {
        matchesMode = tx.paymentMode === 'Cash';
      } else if (filterPaymentMode === 'Pay with QR') {
        matchesMode = tx.paymentMode === 'Pay with QR' || tx.paymentMode === 'GCash' || tx.paymentMode === 'Maya' || tx.paymentMode === 'GoThyme';
      }

      const matchesStatus = filterStatus === 'All Status' || tx.status === filterStatus;
      const matchesDocType = filterDocType === 'All Types' || (tx.documentType || '').toLowerCase().includes(filterDocType.toLowerCase().split(' ')[0]);

      const user = userMap[tx.payerEmail] || {};
      const matchesRole = filterUserRole === 'All' || (user.role || 'student').toLowerCase() === filterUserRole.toLowerCase();
      const matchesProgram = filterProgram === 'All' || (user.programLevel || 'Bachelors').toLowerCase() === filterProgram.toLowerCase();
      const matchesUserStatus = filterUserStatus === 'All' || (user.status || 'Active').toLowerCase() === filterUserStatus.toLowerCase();

      let matchesDate = true;
      if (tx.date) {
        const txDate = new Date(tx.date).toLocaleDateString('en-CA');
        if (startDate && txDate < startDate) matchesDate = false;
        if (endDate && txDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesMode && matchesStatus && matchesDocType && matchesRole && matchesProgram && matchesUserStatus && matchesDate;
    }).sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        valA = new Date(valA || Date.now()).getTime();
        valB = new Date(valB || Date.now()).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, searchTerm, filterPaymentMode, filterStatus, filterDocType, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, userMap, sortConfig]);

  const totalPages = Math.ceil(filteredTransactions.length / entriesPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPaymentMode, filterStatus, filterDocType, filterUserRole, filterProgram, filterUserStatus, startDate, endDate, entriesPerPage]);

  return (
    <Layout>
      {confirmConfig && (
        <ConfirmModal 
          {...confirmConfig} 
          isOpen={!!confirmConfig} 
          onClose={closeConfirm} 
        />
      )}
      {feedbackConfig && (
        <FeedbackModal 
          {...feedbackConfig} 
          isOpen={!!feedbackConfig} 
          onClose={closeFeedback} 
        />
      )}

      <div className="py-2 px-2 sm:px-4 font-sans space-y-4 relative">

        {/* Global Toast Notification */}
        {toast.show && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl bg-[#2c3543] text-white animate-fade-in border border-slate-700/50">
            <CheckCircle size={18} className="text-emerald-400" />
            <p className="font-bold text-xs tracking-wide">{toast.message}</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FINANCIAL SUMMARY KPI CARDS                                               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Total Revenue Collected */}
          <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90 hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center text-xs shadow-2xs">
                <TrendingUp size={15} />
              </div>
              <span className="text-[10.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {statsSummary.collectedCount} Paid
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-tight block">
                ₱{statsSummary.collectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11.5px] font-bold text-slate-500 block truncate">
                Total Revenue Collected
              </span>
            </div>
          </div>

          {/* Card 2: Pending Verification */}
          <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90 hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center text-xs shadow-2xs">
                <Clock size={15} />
              </div>
              <span className="text-[10.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {statsSummary.pendingCount} Pending
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-tight block">
                ₱{statsSummary.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11.5px] font-bold text-slate-500 block truncate">
                Awaiting Verification
              </span>
            </div>
          </div>

          {/* Card 3: Total Refunded */}
          <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90 hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center text-xs shadow-2xs">
                <RotateCcw size={15} />
              </div>
              <span className="text-[10.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {statsSummary.refundedCount} Refunded
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-tight block">
                ₱{statsSummary.refundedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11.5px] font-bold text-slate-500 block truncate">
                Total Refunds Processed
              </span>
            </div>
          </div>

          {/* Card 4: Rejected Receipts */}
          <div className="bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-100/90 hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center text-xs shadow-2xs">
                <XOctagon size={15} />
              </div>
              <span className="text-[10.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Attention
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-tight block">
                {statsSummary.rejectedCount}
              </span>
              <span className="text-[11.5px] font-bold text-slate-500 block truncate">
                Rejected Payment Receipts
              </span>
            </div>
          </div>

        </div>

        {/* 3D Segmented Tab Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex bg-slate-200/70 p-1 rounded-full border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-[#2c3543] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] border-t border-white/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'refunds'
                  ? 'bg-[#2c3543] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] border-t border-white/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Refund Requests
            </button>
          </div>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-full font-bold text-xs border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export to CSV</span>
          </button>
        </div>


        {/* ====== PAYMENTS TAB ====== */}
        {activeTab === 'payments' && (
          <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
            
            {/* Top Toolbar Section */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <span>Show</span>
                  <select
                    aria-label="Entries per page"
                    className="border border-slate-200 rounded-lg px-2 py-1 bg-white font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-56 sm:w-64 rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-3.5 text-[12px] font-medium outline-none focus:border-blue-500 shadow-2xs"
                      placeholder="Search by ID, Name, or Payer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-full font-bold text-[11.5px] border border-slate-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal size={13} />
                    <span>Filters & Sort</span>
                  </button>
                </div>
              </div>

              <ActiveFilterChips 
                  filters={[
                      { label: 'Role', value: filterUserRole, key: 'filterUserRole' },
                      { label: 'Program', value: filterProgram, key: 'filterProgram' },
                      { label: 'User Status', value: filterUserStatus, key: 'filterUserStatus' },
                      { label: 'Payment Mode', value: filterPaymentMode, key: 'filterPaymentMode' },
                      { label: 'Type', value: filterDocType, key: 'filterDocType' },
                      { label: 'Status', value: filterStatus, key: 'filterStatus' },
                      { label: 'From', value: startDate, key: 'startDate' },
                      { label: 'To', value: endDate, key: 'endDate' },
                  ]}
                  onRemove={(key) => {
                      if (key === 'filterUserRole') setFilterUserRole('All');
                      if (key === 'filterProgram') setFilterProgram('All');
                      if (key === 'filterUserStatus') setFilterUserStatus('All');
                      if (key === 'filterPaymentMode') setFilterPaymentMode('All Modes');
                      if (key === 'filterDocType') setFilterDocType('All Types');
                      if (key === 'filterStatus') setFilterStatus('All Status');
                      if (key === 'startDate') setStartDate('');
                      if (key === 'endDate') setEndDate('');
                  }}
              />
            </div>

            {/* Filter Drawer */}
            <FilterDrawer 
                isOpen={isFilterDrawerOpen} 
                onClose={() => setIsFilterDrawerOpen(false)}
                onClearAll={() => {
                  setFilterPaymentMode('All Modes');
                  setFilterStatus('All Status');
                  setFilterDocType('All Types');
                  setFilterUserRole('All');
                  setFilterProgram('All');
                  setFilterUserStatus('All');
                  setStartDate('');
                  setEndDate(new Date().toLocaleDateString('en-CA'));
                  setSortConfig({ key: 'date', direction: 'desc' });
                }}
            >
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sorting</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">Sort By:</label>
                            <select 
                                aria-label="Sort by"
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                value={sortConfig.key}
                                onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                            >
                                <option value="date">Payment Date</option>
                                <option value="transactionId">Transaction ID</option>
                                <option value="payerName">Payer Name</option>
                                <option value="amount">Amount</option>
                                <option value="status">Status</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">Order:</label>
                            <button 
                                type="button"
                                onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                                <span>{sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}</span>
                                {sortConfig.direction === 'asc' ? <ArrowUpZA size={14} className="text-slate-500"/> : <ArrowDownAZ size={14} className="text-slate-500"/>}
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-1"></div>

                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtering</h3>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Payment Mode:</label>
                      <select
                        aria-label="Filter by payment mode"
                        value={filterPaymentMode}
                        onChange={(e) => setFilterPaymentMode(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Document Type:</label>
                      <select
                        aria-label="Filter by document type"
                        value={filterDocType}
                        onChange={(e) => setFilterDocType(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        {docTypes.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Status:</label>
                      <select
                        aria-label="Filter by status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">User Role:</label>
                      <select
                        aria-label="Filter by user role"
                        value={filterUserRole}
                        onChange={(e) => setFilterUserRole(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        <option value="All">All Users</option>
                        <option value="Student">Student</option>
                        <option value="Alumni">Alumni</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Program Level:</label>
                      <select
                        aria-label="Filter by program level"
                        value={filterProgram}
                        onChange={(e) => setFilterProgram(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        <option value="All">All Programs</option>
                        <option value="Bachelors">Bachelors</option>
                        <option value="Masters">Masters</option>
                        <option value="Doctorate">Doctorate</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">User Status:</label>
                      <select
                        aria-label="Filter by user status"
                        value={filterUserStatus}
                        onChange={(e) => setFilterUserStatus(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-500 text-slate-800"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">Start Date:</label>
                            <input 
                                aria-label="Start date"
                                type="date" 
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">End Date:</label>
                            <input 
                                aria-label="End date"
                                type="date" 
                                className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </FilterDrawer>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-3.5 px-5">Payment ID</th>
                    <th className="py-3.5 px-5">Request ID</th>
                    <th className="py-3.5 px-5">Payer Name</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Mode</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {loading ? (
                    <TableSkeleton columns={9} rows={entriesPerPage || 10} />
                  ) : paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx, idx) => {
                      const txId = tx.transactionId || tx._id;
                      const txDate = new Date(tx.date);
                      const formattedDate = txDate.toLocaleDateString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      });
                      return (
                        <tr key={tx._id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800 font-mono text-[11.5px] font-bold" title={tx.transactionId}>
                                {formatShortId(tx.transactionId, 'TXN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(tx.transactionId, `tx-${txId}`)}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-200/60 cursor-pointer"
                                title="Copy Full Transaction ID"
                              >
                                {copiedId === `tx-${txId}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px]" title={tx.requestId}>
                                {formatShortId(tx.requestId, 'REQ')}
                              </span>
                              {tx.requestId && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(tx.requestId, `req-${txId}`)}
                                  className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-200/60 cursor-pointer"
                                  title="Copy Full Request ID"
                                >
                                  {copiedId === `req-${txId}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[13px] font-bold text-slate-900">
                            {tx.payerName || tx.name}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[12.5px] text-slate-700 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <i className="fa-solid fa-file-lines text-blue-500 text-xs"></i>
                              <span>{tx.documentType}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-slate-900 font-bold">
                            ₱{tx.amount || '0.00'}
                          </td>
                          <td className="py-3.5 px-5 align-middle">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPaymentModeStyle(tx.paymentMode)}`}>
                              {tx.paymentMode}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[12px] text-slate-500 font-medium">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-center">
                            {tx.status === 'Completed' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Completed</span>
                              </span>
                            ) : tx.status === 'Pending Verification' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>Pending Verification</span>
                              </span>
                            ) : tx.status === 'Needs Update' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                <span>Needs Update</span>
                              </span>
                            ) : tx.status === 'Refunded' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                <span>Refunded</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>{tx.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {tx.status === 'Pending Verification' && canVerify ? (
                                <button
                                  onClick={() => { setSelectedTx(tx); setAdminNote(''); setError(''); }}
                                  className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Receipt size={12} />
                                  <span>Verify Receipt</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                                  className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>View Details</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400 italic">
                        No payments found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={`text-xs px-2.5 py-1 rounded-md ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 cursor-pointer font-bold'}`}
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
                        className={`w-7 h-7 rounded-lg text-xs transition-colors font-bold ${currentPage === pageNumber
                          ? 'bg-[#2c3543] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={pageNumber} className="text-slate-400 text-xs px-1">...</span>;
                  }
                  return null;
                })}

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={`text-xs px-2.5 py-1 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200 cursor-pointer font-bold'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== REFUND REQUESTS TAB ====== */}
        {activeTab === 'refunds' && (
          <div className="rounded-[22px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/70 text-[11.5px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-3.5 px-5">Refund ID</th>
                    <th className="py-3.5 px-5">Transaction ID</th>
                    <th className="py-3.5 px-5">Name</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Reason</th>
                    <th className="py-3.5 px-5">Date Submitted</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {refundsLoading ? (
                    <TableSkeleton columns={8} rows={10} />
                  ) : refunds.length > 0 ? (
                    refunds.map((refund, idx) => {
                      const refundId = refund.refundId || refund._id;
                      const refundDate = new Date(refund.createdAt);
                      const formattedDate = refundDate.toLocaleDateString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      });
                      
                      const relatedTx = transactions.find(t => t.transactionId === refund.transactionId || t._id === refund.transactionId);
                      const displayName = refund.accountName || refund.studentName || relatedTx?.payerName || relatedTx?.name || 'Unknown';

                      return (
                        <tr key={refund._id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800 font-mono text-[11.5px] font-bold" title={refund.refundId || refund._id}>
                                {formatShortId(refund.refundId || refund._id, 'REF')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(refund.refundId || refund._id, `rf-${refundId}`)}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-200/60 cursor-pointer"
                                title="Copy Full Refund ID"
                              >
                                {copiedId === `rf-${refundId}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[11.5px]" title={refund.transactionId}>
                                {formatShortId(refund.transactionId, 'TXN')}
                              </span>
                              {refund.transactionId && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(refund.transactionId, `rftx-${refundId}`)}
                                  className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded hover:bg-slate-200/60 cursor-pointer"
                                  title="Copy Full Transaction ID"
                                >
                                  {copiedId === `rftx-${refundId}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 align-middle text-[13px] font-bold text-slate-900">{displayName}</td>
                          <td className="py-3.5 px-5 align-middle text-slate-900 font-bold">₱{refund.amount || '0.00'}</td>
                          <td className="py-3.5 px-5 align-middle text-slate-600">{refund.reason === 'Other' ? refund.otherReason : refund.reason}</td>
                          <td className="py-3.5 px-5 align-middle text-[12px] text-slate-500 font-medium">{formattedDate}</td>
                          <td className="py-3.5 px-5 align-middle text-center">
                            {refund.status?.toLowerCase() === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Approved</span>
                              </span>
                            ) : refund.status?.toLowerCase() === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>Pending</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full font-extrabold text-[10.5px] uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <span>{refund.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 align-middle text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {refund.status?.toLowerCase() === 'pending' ? (
                                <button
                                  onClick={() => { setSelectedRefund(refund); setRefundRemarks(''); }}
                                  className="bg-[#2c3543] hover:bg-[#1f2631] text-white py-1 px-3.5 rounded-full text-[11.5px] font-bold border-t border-t-white/20 border-b-2 border-b-black/50 shadow-[0_2px_5px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)] active:translate-y-0.5 active:border-b-0 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>Review</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 italic">
                                    {refund.status === 'Approved' ? 'Approved' : 'Rejected'}
                                    {refund.processedBy && ` by ${refund.processedBy.split('@')[0]}`}
                                  </span>
                                  <button
                                    onClick={() => { setSelectedRefund(refund); setRefundRemarks(refund.adminRemarks || ''); }}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400 italic">
                        No refund requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">

                {/* Left Column: Receipt Preview */}
                <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-4 min-h-[300px]">
                  {(selectedTx.imageUrl || selectedTx.receiptImage) ? (
                    <div className="relative group cursor-pointer" onClick={() => setZoomedImage(true)}>
                      <img
                        src={(selectedTx.imageUrl || selectedTx.receiptImage).startsWith('http') ? (selectedTx.imageUrl || selectedTx.receiptImage) : `${API_BASE}${selectedTx.receiptImage}`}
                        alt="Payment Receipt"
                        className="max-h-[350px] object-contain rounded-lg shadow-md transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1.5 transition-opacity">
                        <ZoomIn size={16} /> Click to Enlarge
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold">No receipt image attached</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Transaction Details & Decision */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">AMOUNT DUE</span>
                        <span className="text-base font-black text-[#1D2D44]">₱{selectedTx.amount || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">REFERENCE NUMBER</span>
                        <span className="font-mono text-gray-700 break-all font-semibold">{selectedTx.referenceNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">DOCUMENT TYPE</span>
                        <span className="font-semibold text-gray-700">{selectedTx.documentType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block mb-1">PAYMENT MODE</span>
                        <span className="font-semibold text-gray-700">{selectedTx.paymentMode}</span>
                      </div>
                    </div>

                    {canVerify && (
                      <div className="flex flex-col flex-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                          Admin Remarks / Note
                        </label>
                        <textarea
                          className="w-full min-h-[120px] p-3.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44] resize-y"
                          placeholder="Add remarks (optional for approval, required for rejection or update request)..."
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                        />
                      </div>
                    )}

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canVerify ? (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleVerify('Rejected')}
                        className="flex-1 py-2.5 rounded-xl border border-red-500 text-red-500 font-bold text-xs uppercase hover:bg-red-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleVerify('Needs Update')}
                        className="flex-1 py-2.5 rounded-xl border border-orange-500 text-orange-500 font-bold text-xs uppercase hover:bg-orange-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={14} /> Request Update
                      </button>
                      <button
                        onClick={() => handleVerify('Completed')}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs uppercase hover:bg-green-700 shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold text-center border border-amber-200 mt-4">
                      View Only: Only authorized staff or administrators can verify, reject, or request updates for payments.
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ====== REFUND REVIEW MODAL ====== */}
        {selectedRefund && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
              
              {/* Header */}
              <div className="bg-[#1D2D44] p-5 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Review Refund Request</h3>
                  <p className="text-xs opacity-70 mt-0.5 uppercase tracking-widest font-semibold">
                    {selectedRefund.refundId || selectedRefund._id} • {selectedRefund.accountName || selectedRefund.studentName || 'Student'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">REFUND AMOUNT</span>
                    <span className="text-base font-black text-[#1D2D44]">₱{selectedRefund.amount || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">PAYMENT METHOD</span>
                    <span className="font-semibold text-gray-700">{selectedRefund.paymentMethod || selectedRefund.paymentMode || 'Original Method'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">ACCOUNT NAME</span>
                    <span className="font-semibold text-gray-700">{selectedRefund.accountName || selectedRefund.studentName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block mb-0.5">ACCOUNT NUMBER</span>
                    <span className="font-mono text-gray-700 font-semibold">{selectedRefund.accountNumber || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-bold block mb-1">REASON FOR REFUND</span>
                  <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-amber-900 font-medium leading-relaxed">
                    {selectedRefund.reason === 'Other' ? (selectedRefund.otherReason || 'Other reason') : selectedRefund.reason}
                  </div>
                </div>

                <div>
                  {canVerify ? (
                    <>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Admin Remarks
                      </label>
                      <textarea
                        className="w-full min-h-[120px] p-3.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44] resize-y mb-4"
                        placeholder="Add remarks (optional for approval, recommended for rejection)..."
                        value={refundRemarks}
                        onChange={(e) => setRefundRemarks(e.target.value)}
                      />

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleProcessRefund(selectedRefund.refundId || selectedRefund._id, 'Rejected')}
                          disabled={refundActionLoading || selectedRefund.status?.toLowerCase() === 'rejected'}
                          className={`flex-1 py-3 rounded-xl border-2 border-red-500 font-bold text-sm uppercase transition-all flex items-center justify-center gap-2 ${
                            selectedRefund.status?.toLowerCase() === 'rejected'
                              ? 'opacity-40 cursor-not-allowed bg-red-50/50 text-red-400'
                              : 'text-red-500 hover:bg-red-50 cursor-pointer'
                          }`}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProcessRefund(selectedRefund.refundId || selectedRefund._id, 'Approved')}
                          disabled={refundActionLoading || selectedRefund.status?.toLowerCase() === 'approved'}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase shadow-md flex items-center justify-center gap-2 ${
                            selectedRefund.status?.toLowerCase() === 'approved'
                              ? 'opacity-40 cursor-not-allowed bg-green-700 text-white/80'
                              : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                          }`}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold text-center border border-amber-200 mt-2">
                      View Only: Only authorized staff or administrators can approve or reject refund requests.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== ZOOMED IMAGE OVERLAY ====== */}
        {zoomedImage && (selectedTx?.imageUrl || selectedTx?.receiptImage) && (
          <div className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setZoomedImage(false)}>
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
              <X size={32} />
            </button>
            <img 
              src={(selectedTx.imageUrl || selectedTx.receiptImage).startsWith('http') ? (selectedTx.imageUrl || selectedTx.receiptImage) : `${API_BASE}${selectedTx.receiptImage}`} 
              alt="Receipt Zoomed" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded animate-scale-up shadow-2xl" 
            />
          </div>
        )}

        <ConfirmModal
          isOpen={refundConfirmModal.isOpen}
          onClose={() => !refundActionLoading && setRefundConfirmModal({ isOpen: false, refundId: null, status: null })}
          onConfirm={executeProcessRefund}
          title={refundConfirmModal.status === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection'}
          message={`Are you sure you want to ${refundConfirmModal.status === 'Approved' ? 'approve' : 'reject'} this refund request?`}
          confirmText={refundConfirmModal.status === 'Approved' ? 'Approve' : 'Reject'}
          cancelText="Cancel"
          type={refundConfirmModal.status === 'Rejected' ? 'danger' : 'success'}
          isLoading={refundActionLoading}
        />

      </div>
    </Layout>
  );
};

// Helper: Payment Mode Badge Styles
function getPaymentModeStyle(mode) {
  switch (mode) {
    case 'Pay with QR':
    case 'GCash':
    case 'Maya':
    case 'GoThyme':
      return 'bg-blue-50 text-blue-700 border border-blue-200/80';
    case 'Cash':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export default Transactions;
