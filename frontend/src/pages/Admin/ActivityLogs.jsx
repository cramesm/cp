import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await api.get('/activity-logs');
            setLogs(resp.data);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <Layout>
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-[#213448] text-white p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">System Activity Logs</h3>
                            <p className="text-xs text-gray-300">Showing last 100 system events</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="bg-white/20 px-3 py-1 rounded text-sm font-medium">
                                Total: {logs.length}
                            </span>
                            <button 
                                onClick={fetchLogs} 
                                disabled={loading}
                                className="bg-white text-[#213448] px-4 py-1.5 rounded font-bold text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Refreshing...' : 'Refresh Logs'}
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b sticky top-0">
                                    <th className="p-4">User</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Details</th>
                                    <th className="p-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? logs.map(log => (
                                    <tr key={log._id} className="border-b hover:bg-gray-50 text-sm">
                                        <td className="p-4 font-medium">{log.userEmail}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[11px] font-bold uppercase ${
                                                log.action.includes('Delete') ? 'bg-red-100 text-red-600' : 
                                                log.action.includes('Create') ? 'bg-green-100 text-green-600' : 
                                                log.action.includes('Login') ? 'bg-blue-100 text-blue-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">{log.details}</td>
                                        <td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="p-10 text-center text-gray-500 italic">
                                            {loading ? 'Loading logs...' : 'No activity logs found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ActivityLogs;
