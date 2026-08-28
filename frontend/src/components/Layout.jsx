import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Breadcrumb from './Breadcrumb';
import verifitorLogo from '../assets/verifitor_logo.png';
import verifitorIcon from '../assets/logo-verifitor.png';
import api from '../api';

const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const Layout = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const nextState = !prev;
            localStorage.setItem('sidebarCollapsed', String(nextState));
            return nextState;
        });
    };

    const handleToggle = () => {
        if (window.innerWidth < 768) {
            setIsMobileOpen(prev => !prev);
        } else {
            toggleSidebar();
        }
    };

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    const userRole = localStorage.getItem('userRole') || '';

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-table-cells-large' },
        { path: '/requests', label: 'Requests', icon: 'fa-solid fa-file-lines' },
        { path: '/transactions', label: 'Payments', icon: 'fa-solid fa-credit-card' },
        { path: '/blockchain', label: 'Blockchain', icon: 'fa-solid fa-cubes' },
        { path: '/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
    ];

    if (userRole === 'super admin') {
        menuItems.push(
            { path: '/manage-registrar', label: 'Registrars', icon: 'fa-solid fa-user-gear' },
            { path: '/manage-users', label: 'Users', icon: 'fa-solid fa-users' },
            { path: '/activity-logs', label: 'Audit Logs', icon: 'fa-solid fa-clipboard-list' }
        );
    }
    
    menuItems.push({ path: '/profile/info', label: 'Profile', icon: 'fa-solid fa-circle-user' });

    // Top Segmented Pill Bar Quick Tabs
    const topNavTabs = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-house' },
        { path: '/requests', label: 'Requests', icon: 'fa-solid fa-folder-open' },
        { path: '/blockchain', label: 'Blockchain', icon: 'fa-solid fa-link' },
        ...(userRole === 'super admin' ? [{ path: '/manage-registrar', label: 'Registrars', icon: 'fa-solid fa-user-tie' }] : []),
        ...(userRole === 'super admin' ? [{ path: '/activity-logs', label: 'Reports', icon: 'fa-solid fa-chart-pie' }] : [{ path: '/transactions', label: 'Payments', icon: 'fa-solid fa-receipt' }])
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const [adminUser, setAdminUser] = useState(() => {
        const adminUserStr = localStorage.getItem('adminUser');
        return adminUserStr ? JSON.parse(adminUserStr) : {};
    });

    useEffect(() => {
        const handleProfileUpdate = () => {
            const adminUserStr = localStorage.getItem('adminUser');
            setAdminUser(adminUserStr ? JSON.parse(adminUserStr) : {});
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, []);

    useEffect(() => {
        setIsMobileOpen(false);
        setMenuOpen(false);

        const fetchUnreadCount = async () => {
            try {
                const res = await api.get('/notifications');
                if (res.data) {
                    const unread = res.data.filter(n => !n.isRead).length;
                    setUnreadCount(unread);
                }
            } catch (err) {
                console.error("Error fetching notifications for topbar", err);
            }
        };
        fetchUnreadCount();
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen bg-[#F0F3F8] text-gray-900 font-sans selection:bg-blue-500 selection:text-white">
            
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998] md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}

            {/* Floating Sleek Dock Sidebar (Left) */}
            <aside className={`fixed top-4 left-4 bottom-4 bg-white/95 backdrop-blur-xl border border-white/80 rounded-[32px] shadow-[0_10px_35px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] flex flex-col z-[1000] transition-all duration-300 ${
                isMobileOpen ? 'translate-x-0 w-[240px]' : '-translate-x-[120%] md:translate-x-0'
            } ${isCollapsed ? 'md:w-[76px]' : 'md:w-[240px]'}`}>
                
                {/* Logo Tile */}
                <div className="p-4 flex items-center justify-center border-b border-gray-100/80">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-3 p-1 focus:outline-none"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#213448] to-[#3B82F6] flex items-center justify-center shadow-md shadow-blue-500/10 flex-shrink-0">
                            <i className="fa-solid fa-cube text-white text-lg"></i>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="font-extrabold text-[17px] tracking-tight text-gray-900 leading-tight">VeriFitor</span>
                                <span className="text-[10.5px] uppercase tracking-wider font-bold text-blue-600 leading-tight">
                                    {userRole === 'super admin' ? 'Super Admin' : 'Registrar'}
                                </span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Navigation Items (Pills & Squircles) */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 custom-scrollbar" aria-label="Main Navigation">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            title={isCollapsed ? item.label : ''}
                            onClick={() => {
                                if (window.innerWidth < 768) setIsMobileOpen(false);
                            }}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-medium transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[#111827] text-white shadow-md shadow-black/10'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                                } ${isCollapsed ? 'justify-center px-0' : ''}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'
                                    }`}>
                                        <i className={`${item.icon} ${isCollapsed ? 'text-[17px]' : 'text-[15px]'}`}></i>
                                    </div>
                                    {!isCollapsed && (
                                        <span className="text-[13.5px] font-semibold tracking-tight truncate">{item.label}</span>
                                    )}
                                    {isActive && (
                                        <span className="absolute left-1 w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse / Logout Bottom Dock */}
                <div className="p-3 border-t border-gray-100/80 space-y-2">
                    <button 
                        onClick={toggleSidebar}
                        className="hidden md:flex w-full items-center justify-center p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title={isCollapsed ? "Expand Dock" : "Collapse Dock"}
                    >
                        <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-[14px]`}></i>
                    </button>

                    <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-red-600 hover:bg-red-50 font-semibold text-[13px] transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}`}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket text-[15px]"></i>
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
                isCollapsed ? 'md:ml-[96px]' : 'md:ml-[264px]'
            }`}>
                
                {/* Modern Top Navigation Bar (Pill Bar) */}
                <header className="sticky top-4 z-[990] mx-4 sm:mx-6 my-2 bg-white/90 backdrop-blur-xl border border-white/80 rounded-full shadow-[0_6px_25px_rgba(0,0,0,0.03),0_1px_4px_rgba(0,0,0,0.02)] px-4 sm:px-6 h-[64px] flex items-center justify-between">
                    
                    {/* Left: Mobile Toggle & Segmented Pill Navigation */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleToggle}
                            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 focus:outline-none"
                            aria-label="Toggle navigation"
                        >
                            <i className="fa-solid fa-bars text-[16px]"></i>
                        </button>

                        {/* Segmented Pill Tabs (Inspired by Mockup) */}
                        <div className="hidden lg:flex items-center bg-gray-100/90 p-1 rounded-full border border-gray-200/50 shadow-inner">
                            {topNavTabs.map((tab) => {
                                const isActive = location.pathname === tab.path || (tab.path === '/requests' && location.pathname.startsWith('/requests'));
                                return (
                                    <NavLink
                                        key={tab.path}
                                        to={tab.path}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[12.5px] font-bold transition-all duration-200 ${
                                            isActive
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                    >
                                        <i className={`${tab.icon} text-[11px]`}></i>
                                        <span>{tab.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Quick Action Pill, Notifications, User Avatar */}
                    <div className="flex items-center gap-3 sm:gap-4" ref={dropdownRef}>
                        
                        {/* Quick Role Action Button */}
                        {userRole === 'super admin' ? (
                            <button
                                onClick={() => navigate('/manage-registrar/add')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#213448] text-white rounded-full text-[12.5px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                            >
                                <i className="fa-solid fa-plus text-[10px]"></i>
                                <span>Add Registrar</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/verify')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[12.5px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                            >
                                <i className="fa-solid fa-shield-halved text-[11px]"></i>
                                <span>Verify Document</span>
                            </button>
                        )}

                        {/* Notification Pill */}
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors relative"
                            aria-label={`View notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                        >
                            <i className="fa-solid fa-bell text-[14px]"></i>
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                            )}
                        </button>

                        {/* User Profile Pill Avatar */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={toggleMenu}
                                className="flex items-center gap-2 p-1 pl-2 sm:pr-3 bg-gray-100/70 hover:bg-gray-100 rounded-full border border-gray-200/60 transition-all focus:outline-none"
                                aria-expanded={menuOpen}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden flex-shrink-0">
                                    {adminUser.profilePic ? (
                                        <img src={adminUser.profilePic.startsWith('http') ? adminUser.profilePic : `http://localhost:5000${adminUser.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(adminUser.name || 'Admin')
                                    )}
                                </div>
                                <div className="hidden md:flex flex-col text-left">
                                    <span className="text-[12.5px] font-bold text-gray-900 leading-tight truncate max-w-[110px]">
                                        {adminUser.name || (userRole === 'super admin' ? 'Super Admin' : 'Registrar')}
                                    </span>
                                </div>
                                <i className="fa-solid fa-chevron-down text-[10px] text-gray-400 mr-1 hidden sm:block"></i>
                            </button>

                            {/* Dropdown Menu */}
                            {menuOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-[10000] animate-scaleIn origin-top-right">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-[13px] font-bold text-gray-900 truncate">{adminUser.name || 'Administrator'}</p>
                                        <p className="text-[11px] text-gray-500 capitalize">{userRole || 'Staff'}</p>
                                    </div>
                                    <div className="py-1">
                                        <NavLink
                                            to="/profile/info"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-colors"
                                        >
                                            <i className="fa-regular fa-id-badge text-gray-400"></i>
                                            <span>Profile Info</span>
                                        </NavLink>
                                        <NavLink
                                            to="/profile"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-colors"
                                        >
                                            <i className="fa-solid fa-sliders text-gray-400"></i>
                                            <span>Account Settings</span>
                                        </NavLink>
                                    </div>
                                    <div className="pt-1 border-t border-gray-100">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-2xl transition-colors text-left"
                                        >
                                            <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Body */}
                <main id="main-content" className="flex-1 px-4 sm:px-6 py-4">
                    <Breadcrumb />
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Layout;