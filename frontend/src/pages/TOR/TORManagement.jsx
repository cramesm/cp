import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Search, Filter, Trash2, Eye, GraduationCap, AlertCircle, CheckCircle2, X, FileUp } from 'lucide-react';
import Layout from '../../components/Layout';
import api from '../../api';

const TORManagement = () => {
    const navigate = useNavigate();
    const [tors, setTors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState(null);
    const userRole = localStorage.getItem('userRole');

    const fetchTORs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/tor');
            setTors(res.data);
        } catch (error) {
            console.error('Error fetching TOR records:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTORs();
    }, [fetchTORs]);

    // Parse CSV client-side for preview
    const parseCSVPreview = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) {
                setCsvPreview(null);
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const row = {};
                headers.forEach((h, i) => { row[h] = values[i] || ''; });
                return row;
            });
            setCsvPreview({ headers, rows });
        };
        reader.readAsText(file);
    };

    const handleFileSelect = (file) => {
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            setSelectedFile(file);
            parseCSVPreview(file);
            setUploadResult(null);
        } else {
            setUploadResult({ type: 'error', message: 'Please select a valid CSV file.' });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setUploadResult(null);
        try {
            const formData = new FormData();
            formData.append('csvFile', selectedFile);
            const res = await api.post('/tor/upload-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult({ type: 'success', message: `Grades imported for ${res.data.tor.studentName}` });
            setSelectedFile(null);
            setCsvPreview(null);
            fetchTORs();
            setTimeout(() => setShowUploadModal(false), 1500);
        } catch (error) {
            setUploadResult({ type: 'error', message: error.response?.data?.message || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (torId, studentName) => {
        if (!window.confirm(`Delete TOR for "${studentName}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/tor/${torId}`);
            fetchTORs();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting TOR');
        }
    };

    const filteredTors = tors.filter(tor => {
        const matchesSearch =
            tor.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tor.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tor.torId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || tor.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            Draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            Finalized: 'bg-blue-50 text-blue-700 border-blue-200',
            Released: 'bg-green-50 text-green-700 border-green-200'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {status}
            </span>
        );
    };

    return (
        <Layout>
            <div className="p-6 lg:p-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2f3947] rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">TOR Management</h1>
                            <p className="text-sm text-gray-500">Import grades and generate Transcript of Records</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShowUploadModal(true); setSelectedFile(null); setCsvPreview(null); setUploadResult(null); }}
                        className="flex items-center gap-2 bg-[#2f3947] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#3a4858] transition-colors shadow-sm"
                    >
                        <Upload className="w-4 h-4" />
                        Import CSV
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, student ID, or TOR ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6f8faa] focus:border-transparent bg-white"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6f8faa] bg-white appearance-none cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Finalized">Finalized</option>
                            <option value="Released">Released</option>
                        </select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Records', count: tors.length, color: 'bg-[#2f3947]' },
                        { label: 'Drafts', count: tors.filter(t => t.status === 'Draft').length, color: 'bg-yellow-500' },
                        { label: 'Finalized', count: tors.filter(t => t.status === 'Finalized').length, color: 'bg-blue-500' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TOR Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-[#2f3947] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredTors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <GraduationCap className="w-12 h-12 mb-3 opacity-40" />
                            <p className="font-medium">No TOR records found</p>
                            <p className="text-sm mt-1">Import a CSV to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">TOR ID</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">GWA</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTors.map(tor => (
                                        <tr key={tor.torId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-sm font-mono text-gray-600">{tor.torId}</td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-medium text-gray-800">{tor.studentName}</p>
                                                <p className="text-xs text-gray-400">{tor.studentId}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600">{tor.course}</td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600 text-center">{tor.grades.length}</td>
                                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-800 text-center">{tor.gwa.toFixed(4)}</td>
                                            <td className="px-5 py-3.5 text-center">{getStatusBadge(tor.status)}</td>
                                            <td className="px-5 py-3.5 text-sm text-gray-500 text-center">
                                                {new Date(tor.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/tor/${tor.torId}`)}
                                                        className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {userRole === 'system admin' && (
                                                        <button
                                                            onClick={() => handleDelete(tor.torId, tor.studentName)}
                                                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete TOR"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-[#2f3947] rounded-lg flex items-center justify-center">
                                        <FileUp className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">Import Grades (CSV)</h2>
                                        <p className="text-xs text-gray-400">One CSV file per student</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Drop Zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('csv-input').click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                        dragOver
                                            ? 'border-[#6f8faa] bg-blue-50'
                                            : selectedFile
                                                ? 'border-green-300 bg-green-50'
                                                : 'border-gray-200 hover:border-[#6f8faa] hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        id="csv-input"
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={(e) => handleFileSelect(e.target.files[0])}
                                    />
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                                            <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-10 h-10 text-gray-300" />
                                            <p className="text-sm font-medium text-gray-500">Drop CSV file here or click to browse</p>
                                            <p className="text-xs text-gray-400">Max file size: 5MB</p>
                                        </div>
                                    )}
                                </div>

                                {/* CSV Preview */}
                                {csvPreview && (
                                    <div className="mt-5">
                                        <h3 className="text-sm font-semibold text-gray-600 mb-2">
                                            Preview ({csvPreview.rows.length} records)
                                        </h3>
                                        <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[250px] overflow-y-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-gray-50 sticky top-0">
                                                        {csvPreview.headers.map(h => (
                                                            <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {csvPreview.rows.map((row, i) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            {csvPreview.headers.map(h => (
                                                                <td key={h} className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{row[h]}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Expected Format Hint */}
                                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Expected CSV Columns:</p>
                                    <p className="text-xs text-gray-400 font-mono">
                                        Student ID, Student Name, Course, Year Level, Academic Year, Semester, Subject Code, Subject Name, Units, Grade
                                    </p>
                                </div>

                                {/* Upload Result */}
                                {uploadResult && (
                                    <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${
                                        uploadResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                        {uploadResult.type === 'success'
                                            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        }
                                        {uploadResult.message}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors shadow-sm ${
                                        !selectedFile || uploading
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-[#2f3947] hover:bg-[#3a4858]'
                                    }`}
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Import Grades
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TORManagement;
