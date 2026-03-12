import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                if(res.data.length === 0) {
                     setNotifications([
                         { _id: '1', message: '3 new transcript requests pending approval', isRead: false, date: new Date().toISOString() },
                         { _id: '2', message: 'Failed blockchain submission for REQ1234', isRead: false, date: new Date(Date.now() - 3600000).toISOString() },
                         { _id: '3', message: 'System maintenance scheduled for tonight', isRead: true, date: new Date(Date.now() - 86400000).toISOString() }
                     ]);
                } else {
                     setNotifications(res.data);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark as read:", error);
            // Optimistic UI update for mock
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() === 'Invalid Date' ? dateString : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="bg-white rounded-lg overflow-hidden w-full shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                    <div className="bg-[#2c3e50] text-white py-[15px] px-5 flex justify-between items-center">
                        <h3 className="m-0 text-[16px] font-medium">Notifications</h3>
                        <button className="bg-transparent text-white border border-white py-1.5 px-3.5 rounded-md text-[12px] cursor-pointer transition-all duration-200 hover:bg-white hover:text-[#2c3e50]">Mark All Read</button>
                    </div>
                    
                    <div className="m-0 p-0 list-none">
                        {loading ? (
                            <div className="p-5 text-center text-sm text-[#333]">Loading...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div key={notif._id} className={`p-5 border-b border-[#eaeaea] flex justify-between items-center transition-colors duration-200 bg-white hover:bg-[#f9f9f9] last:border-none ${!notif.isRead ? 'bg-[#f0f7ff] border-l-4 border-l-[#73A9D4]' : ''}`}>
                                    <div>
                                        <p className={`m-0 mb-1.5 text-[#333] text-[15px] ${!notif.isRead ? 'font-semibold' : ''}`}>{notif.message}</p>
                                        <span className="text-[12px] text-[#888]">{formatDate(notif.date)}</span>
                                    </div>
                                    {!notif.isRead && (
                                        <button 
                                            className="bg-transparent text-[#2c3e50] border border-[#2c3e50] py-1.5 px-3.5 rounded-md text-[12px] cursor-pointer transition-all duration-200 hover:bg-[#2c3e50] hover:text-white" 
                                            onClick={() => markAsRead(notif._id)}
                                        >
                                            Mark Read
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-5 text-center text-sm text-[#333]">No notifications found.</div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Notifications;
