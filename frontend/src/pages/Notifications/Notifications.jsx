import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import api from '../../api';
import { AlertCircle, Info, X } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Toast States
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      // res.data should be an array of notification objects from your DB
      setNotifications(res.data || []);
    } catch (error) {
      console.error("API Fetch Error:", error);
      triggerToast("Failed to load notifications from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    if (endDate && val > endDate) {
      triggerToast("Start Date cannot be later than End Date.", "warning");
      return;
    }
    setStartDate(val);
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    if (startDate && val < startDate) {
      triggerToast("End Date cannot be earlier than Start Date.", "warning");
      return;
    }
    setEndDate(val);
  };

  // Logic to update DB and local state
  const handleMarkAllRead = async () => {
    try {
      // Step 1: Tell the backend to update all unread notifications for this user
      await api.put('/notifications/mark-all-read'); 
      
      // Step 2: Update local state to reflect changes immediately
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      triggerToast("All notifications caught up!", "info");
    } catch (error) {
      console.error("Update Error:", error);
      triggerToast("Could not update notifications on server.", "error");
    }
  };

  const filteredNotifications = useMemo(() => {
    const sanitizedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return notifications.filter((n) => {
      const matchesSearch = n.message?.toLowerCase().includes(sanitizedSearch.toLowerCase());
      const matchesStatus = filterStatus === 'All Status' ? true : (filterStatus === 'Unread' ? !n.isRead : n.isRead);
      
      const notifDate = new Date(n.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const matchesDate = (!start || notifDate >= start) && (!end || notifDate <= end);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [notifications, searchTerm, filterStatus, startDate, endDate]);

  return (
    <Layout>
      <div className="p-8 bg-white min-h-screen font-sans text-[#333] relative">
        
        {/* --- DYNAMIC TOAST COMPONENT --- */}
        {toast.show && (
            <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl transition-all duration-300 transform translate-y-0 ${
                toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
            }`}>
                <div className="flex-shrink-0">
                    {toast.type === 'error' ? <AlertCircle size={20} strokeWidth={2.5} /> : <Info size={20} strokeWidth={2.5} />}
                </div>
                <p className="font-bold text-sm tracking-wide">{toast.message}</p>
                <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X size={16} />
                </button>
            </div>
        )}

        <div className="max-w-[1200px] mx-auto border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">Showing {filteredNotifications.length} notifications</div>
                <div className="flex w-full max-w-[400px]">
                    <input 
                        type="text" 
                        placeholder="Search notifications..." 
                        className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 text-[14px] outline-none focus:border-[#1D2D44]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="bg-[#1D2D44] text-white px-8 py-2 rounded-r-md font-bold text-[14px]">Search</button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-gray-700">Status:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-[14px] text-gray-400 outline-none bg-white">
                  <option>All Status</option><option>Unread</option><option>Read</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-gray-700">Start Date:</label>
                <input type="date" className="border border-gray-300 rounded px-3 py-2 text-[14px] text-gray-400 outline-none" value={startDate} onChange={handleStartDateChange} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-gray-700">End Date:</label>
                <input type="date" className="border border-gray-300 rounded px-3 py-2 text-[14px] text-gray-400 outline-none" value={endDate} onChange={handleEndDateChange} />
              </div>
              <div className="flex gap-2">
                <button onClick={fetchNotifications} className="flex-1 bg-[#D1D1D1] text-gray-700 px-4 py-2 rounded font-bold text-[14px] hover:bg-gray-200 transition-colors">Retry</button>
                <button onClick={handleMarkAllRead} className="flex-1 bg-[#1D2D44] text-white px-4 py-2 rounded font-bold text-[14px] hover:bg-[#152030] transition-colors shadow-md">Mark all read</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 bg-white border-y border-gray-200 py-4 px-8 font-bold text-[15px]">
            <span className="col-span-3">Status</span>
            <span className="col-span-6 text-center">Notification</span>
            <span className="col-span-3 text-right">Date & Time</span>
          </div>

          <div className="min-h-[400px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 italic">Connecting to server...</div>
            ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((n, idx) => (
                    <div key={n._id || idx} className={`grid grid-cols-12 px-8 py-5 border-b border-gray-100 items-center transition-colors ${idx % 2 !== 0 ? 'bg-[#F9FAFF]' : 'bg-white'}`}>
                         <div className="col-span-3 flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${n.isRead ? 'bg-[#BDBDBD]' : 'bg-[#73A9D4]'}`}></span>
                            <span className={`text-[14px] ${n.isRead ? 'text-gray-400' : 'font-bold text-[#1D2D44]'}`}>{n.isRead ? 'Read' : 'Unread'}</span>
                        </div>
                        <span className={`col-span-6 text-center text-[14px] ${n.isRead ? 'text-gray-400' : 'text-gray-800'}`}>{n.message}</span>
                        <span className="col-span-3 text-right text-[14px] text-gray-400 font-mono">{n.date}</span>
                    </div>
                ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#99AAB5] italic text-[18px]">
                No notifications found.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
