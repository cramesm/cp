import { useState } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import API from "../../components/config/axiosConfig";
import { CheckCircle, AlertCircle } from 'lucide-react';

function CreateTransaction() {
    const [formData, setFormData] = useState({
        typeOfDocument: "",
        yearGraduated: "",
        nameOfStudent: "",
        studentSONumber: "",
        nameOfSchool: "",
    });

    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [loading, setLoading] = useState(false);

    const triggerToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
    };

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await API.post("/blockchain/transactions", {
                ...formData,
                yearGraduated: Number(formData.yearGraduated),
            });

            setResult(response.data.transaction);
            triggerToast("Transaction recorded successfully on blockchain.", 'success');
            setFormData({
                typeOfDocument: "",
                yearGraduated: "",
                nameOfStudent: "",
                studentSONumber: "",
                nameOfSchool: "",
            });
        } catch (error) {
            triggerToast(error.response?.data?.message || "Transaction failed", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-6 bg-[#F8F9FA] min-h-screen font-sans">
                {/* Toast Notification */}
                {toast.show && (
                    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl ${toast.type === 'success'
                        ? 'bg-[#28A745] text-white'
                        : 'bg-[#DC3545] text-white'
                        } animate-fade-in`}>
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <p className="font-bold text-sm">{toast.message}</p>
                    </div>
                )}
                <button
                    onClick={() => navigate('/blockchain')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition"
                >
                    <i className="fa-solid fa-arrow-left text-xs"></i>
                    Back to Blockchain
                </button>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Card */}


                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <h3 className="text-[18px] font-bold text-[#1D2D44] mb-6">Record New Transaction</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
                                    <input
                                        type="text"
                                        name="nameOfStudent"
                                        placeholder="Enter student full name"
                                        value={formData.nameOfStudent}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Student S.O. Number *</label>
                                    <input
                                        type="text"
                                        name="studentSONumber"
                                        placeholder="e.g., SO-2023-0001"
                                        value={formData.studentSONumber}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Document *</label>
                                <input
                                    type="text"
                                    name="typeOfDocument"
                                    placeholder="e.g., Diploma, Certificate, Transcript"
                                    value={formData.typeOfDocument}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">School/Institution Name *</label>
                                <input
                                    type="text"
                                    name="nameOfSchool"
                                    placeholder="Enter school name"
                                    value={formData.nameOfSchool}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year Graduated *</label>
                                <input
                                    type="number"
                                    name="yearGraduated"
                                    placeholder="e.g., 2023"
                                    value={formData.yearGraduated}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1D2D44] focus:ring-1 focus:ring-[#1D2D44]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 bg-[#1D2D44] text-white font-semibold py-2 rounded-lg hover:bg-[#2d3d54] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Record Transaction on Blockchain'}
                            </button>
                        </form>
                    </div>

                    {/* Result Card */}
                    {result && (
                        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6 h-fit sticky top-20">
                            <h3 className="text-[16px] font-bold text-[#28A745] mb-4">✓ Recorded Successfully</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-600 text-xs mb-1">Reference Number</p>
                                    <p className="font-mono bg-gray-50 p-2 rounded text-[11px] break-all">{result.referenceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-xs mb-1">Status</p>
                                    <p className={`font-semibold px-3 py-1 rounded text-[12px] w-fit ${result.blockchainStatus === 'Recorded'
                                        ? 'bg-[#E1FFEB] text-[#28A745]'
                                        : 'bg-[#FFFDE1] text-[#D2C300]'
                                        }`}>
                                        {result.blockchainStatus}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-xs mb-1">Transaction Hash</p>
                                    <p className="font-mono bg-gray-50 p-2 rounded text-[10px] break-all">{result.blockchainTxHash || 'Pending...'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-xs mb-1">Block Number</p>
                                    <p className="font-semibold">{result.blockchainBlockNumber || 'Pending...'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default CreateTransaction;