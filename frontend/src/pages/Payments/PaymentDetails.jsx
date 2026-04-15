import { useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import Layout from '../../components/Layout';
import { ArrowLeft, CheckCircle, Image as ImageIcon, Eye, CreditCard, AlertCircle } from 'lucide-react';

// 1. Move data to a shared array (In a real app, this would be an API call)
const ALL_TRANSACTIONS = [];

const TransactionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This 'id' comes from the URL /transactions/18933

  // 2. Find the specific transaction based on the URL ID
  const transaction = useMemo(() => {
    return ALL_TRANSACTIONS.find(item => item.referenceNo === id);
  }, [id]);

  // 3. Handle "Not Found" state
  if (!transaction) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
          <AlertCircle size={48} className="mb-4 text-red-400" />
          <h2 className="text-xl font-bold">Transaction Not Found</h2>
          <button onClick={() => navigate('/payments')} className="mt-4 text-[#1D2D44] underline font-bold">
            Back to Payments
          </button>
        </div>
      </Layout>
    );
  }

  // 4. Helper for Status Styling (Matches your main list)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'text-[#2D6A8E] bg-[#C6E7FF]';
      case 'Pending': return 'text-[#857A00] bg-[#FCF7B0]';
      case 'Failed': return 'text-[#A32A2A] bg-[#FFC1C1]';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Layout>
      <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
        
        {/* --- HEADER SECTION --- */}
        <div className="max-w-[1100px] mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold text-[#1D2D44] flex items-center gap-3">
              Transaction #{transaction.referenceNo} - 
              <span className={`px-4 py-1 rounded-full text-xs uppercase tracking-widest ${getStatusBadge(transaction.status)}`}>
                {transaction.status}
              </span>
            </h2>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-[#1D2D44] text-white px-6 py-2 rounded-full font-bold text-xs hover:bg-[#152030] transition-all uppercase tracking-widest shadow-md"
            >
              <ArrowLeft size={14} />
              Back to List
            </button>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: Transaction Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="text-[14px] font-bold text-[#1D2D44] mb-5 border-b border-gray-50 pb-3 uppercase tracking-wider">
                SECTION 1: Transaction Summary
              </h4>
              <div className="grid grid-cols-[140px_1fr] gap-y-4 text-[13px]">
                <span className="text-gray-400 font-bold">Status:</span>
                <span className={`font-bold uppercase ${transaction.status === 'Completed' ? 'text-[#2D6A8E]' : 'text-[#857A00]'}`}>
                  {transaction.status}
                </span>
                <span className="text-gray-400 font-bold">Reference No:</span>
                <span className="text-gray-700 font-mono">#{transaction.referenceNo}</span>
                <span className="text-gray-400 font-bold">Request ID:</span>
                <span className="text-gray-700 font-mono">{transaction.requestId}</span>
                <span className="text-gray-400 font-bold">Timestamp:</span>
                <span className="text-gray-700">{transaction.timestamp}</span>
                <span className="text-gray-400 font-bold">Payer:</span>
                <span className="text-[#1D2D44] font-bold">{transaction.payer}</span>
              </div>
            </div>

            {/* Section 2: Document Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="text-[14px] font-bold text-[#1D2D44] mb-5 border-b border-gray-50 pb-3 uppercase tracking-wider">
                SECTION 2: Document Details
              </h4>
              <div className="grid grid-cols-[140px_1fr] gap-y-4 text-[13px]">
                <span className="text-gray-400 font-bold">Request Type:</span>
                <span className="text-gray-800 font-medium">{transaction.documentDetails.type}</span>
                <span className="text-gray-400 font-bold">Quantity:</span>
                <span className="text-gray-700">{transaction.documentDetails.qty}</span>
                <span className="text-gray-400 font-bold">Processing Fee:</span>
                <span className="text-gray-700 font-bold">{transaction.documentDetails.processingFee}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Section 3: Financial Breakdown */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center gap-2">
                <CreditCard size={18} className="text-[#1D2D44]" />
                <h4 className="text-[14px] font-bold text-[#1D2D44] uppercase tracking-wider">
                  SECTION 3: Financial Breakdown
                </h4>
              </div>
              <div className="p-6">
                <table className="w-full text-[13px] border border-gray-50 rounded-lg overflow-hidden">
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="px-6 py-3 text-gray-500 font-bold">Subtotal:</td>
                      <td className="px-6 py-3 text-right text-gray-800 font-medium">{transaction.breakdown.subtotal}</td>
                    </tr>
                    <tr className="bg-[#F9FAFF]">
                      <td className="px-6 py-3 text-gray-500 font-bold">Express Fee:</td>
                      <td className="px-6 py-3 text-right text-gray-800 font-medium">{transaction.breakdown.expressFee}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3 text-gray-500 font-bold">Convenience Fee:</td>
                      <td className="px-6 py-3 text-right text-gray-800 font-medium">{transaction.breakdown.convenienceFee}</td>
                    </tr>
                    <tr className="bg-[#1D2D44] text-white">
                      <td className="px-6 py-4 font-bold uppercase tracking-widest">Total Paid:</td>
                      <td className="px-6 py-4 text-right font-bold text-[18px]">{transaction.breakdown.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Proof */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <h4 className="text-[14px] font-bold text-[#1D2D44] mb-5 border-b border-gray-50 pb-3 uppercase tracking-wider">
                Proof of Payment
              </h4>
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-[#F9FAFF] border border-dashed border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="bg-[#1D2D44] p-4 rounded-full text-white shadow-lg">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-[14px] font-bold text-[#1D2D44]">Payment_Receipt_{transaction.referenceNo}.png</p>
                    <button className="bg-[#1D2D44] text-white px-8 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-[#152030] transition-all">
                      <Eye size={16} /> Preview Receipt
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#E1FFEB] p-3 rounded-lg border border-[#C3E6CB]">
                   <CheckCircle size={16} className={`text-${transaction.status === 'Completed' ? '[#28A745]' : '[#857A00]'}`} />
                   <p className="text-[11px] text-gray-700 font-medium leading-tight">
                     <span className="font-bold uppercase block text-[9px] text-gray-400">Approval Status</span>
                     {transaction.verification.approval}
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionDetails;