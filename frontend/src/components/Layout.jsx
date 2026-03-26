import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
// import api from '../../api'; // Ensure your api utility is imported

const Layout = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0); // State for the red badge
    const navigate = useNavigate();
    const location = useLocation();

    // --- NEW: Fetch Unread Notifications ---
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await api.get('/notifications');
                // Calculate unread count from the list
                const unread = res.data.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error("Error fetching notification count:", error);
            }
        };

        fetchUnreadCount();
        // Polling every 30 seconds to simulate "Real-time"
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const handleLogout = () => navigate('/login');

    const getPageTitle = () => {
        const titles = {
            '/': 'Dashboard',
            '/requests': 'Document Requests',
            '/manage-registrar': 'Manage Registrar',
            '/activity-logs': 'Activity Logs',
            '/transactions': 'Transactions',
            '/notifications': 'Notifications',
            '/profile': 'Profile',
            '/settings': 'Settings'
        };
        return titles[location.pathname] || 'Dashboard';
    };

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: 'fa-solid fa-table-cells-large' },
        { path: '/requests', label: 'Document Requests', icon: 'fa-solid fa-file-lines' },
        { path: '/manage-registrar', label: 'Manage Registrar', icon: 'fa-solid fa-user-gear' },
        { path: '/activity-logs', label: 'Activity Logs', icon: 'fa-solid fa-clipboard-list' },
        { path: '/transactions', label: 'Transactions', icon: 'fa-solid fa-arrow-right-arrow-left' },
        { path: '/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
        { path: '/profile', label: 'Profile', icon: 'fa-solid fa-circle-user' }
    ];

    return (
        <div className="flex min-h-screen bg-[#e9e9e9]">
            {/* Sidebar */}
            <aside className="hidden md:flex w-[230px] min-h-screen bg-[#2f3947] fixed top-0 left-0 flex-col z-[1000] shadow-lg">
                <div className="h-[60px] bg-[#f4f6f8] flex items-center px-4 border-b border-[#d9d9d9]">
                    <img src="/assets/verifitorlogo.png" alt="Verifitor" className="h-[42px] object-contain" />
                </div>

                <nav className="flex-1 px-3 py-5">
                    <ul className="list-none p-0 m-0 flex flex-col gap-2">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-md px-3 py-3 text-[14px] transition-all duration-200 ${
                                            isActive ? 'bg-[#f1f1f1] text-[#1f1f1f] font-medium' : 'text-white hover:bg-[#3a4555]'
                                        }`
                                    }
                                >
                                    <i className={`${item.icon} text-[13px]`}></i>
                                    <span>{item.label}</span>
                                    
                                    {/* --- SIDEBAR BADGE OPTION --- */}
                                    {item.path === '/notifications' && unreadCount > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                            {unreadCount}
                                        </span>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col w-full md:ml-[230px] md:w-[calc(100%-230px)]">
                <header className="flex items-center justify-between px-5 bg-[#7f9db7] sticky top-0 z-[999] h-[60px] shadow-sm">
                    <h2 className="text-white text-[20px] font-semibold m-0">{getPageTitle()}</h2>

                    <div className="flex items-center gap-5 relative">
                        {/* --- HEADER NOTIFICATION ICON WITH BADGE --- */}
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="text-white text-[18px] hover:opacity-80 transition relative"
                        >
                            <i className="fa-regular fa-bell"></i>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        <button type="button" onClick={toggleMenu} className="text-white text-[20px] hover:opacity-80 transition">
                            <i className="fa-solid fa-circle-user"></i>
                        </button>

                        {/* Dropdown Menu */}
                        <div className={`absolute right-0 top-[42px] bg-white shadow-lg rounded-xl flex-col min-w-[170px] z-[10000] overflow-hidden transition-all duration-200 ${
                                menuOpen ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-2'
                            }`}
                        >
                            <NavLink to="/profile" className="text-[#333] px-[18px] py-3 no-underline text-sm border-b border-[#eee] transition-all hover:bg-[#f1f3f5]">Profile</NavLink>
                            <NavLink to="/settings" className="text-[#333] px-[18px] py-3 no-underline text-sm border-b border-[#eee] transition-all hover:bg-[#f1f3f5]">Settings</NavLink>
                            <button onClick={handleLogout} className="text-[#333] px-[18px] py-3 text-sm text-left bg-transparent border-none w-full cursor-pointer transition-all hover:bg-[#f1f3f5]">Logout</button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;