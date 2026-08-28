import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Breadcrumb from './Breadcrumb';
import verifitorLogo from '../assets/verifitor_logo.png';
import verifitorIcon from '../assets/logo-verifitor.png';
import api from '../api';

const getInitials = (name) => {
    if (!name) return 'U';
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
        navigate('/login');
    };

    const getPageTitle = () => {
        const path = location.pathname;

        switch (path) {
            case '/dashboard':
                return 'Dashboard';
            case '/requests':
                return 'Document Requests';
            case '/transactions':
                return 'Payments';
            case '/notifications':
                return 'Notifications';
            case '/blockchain':
                return 'Blockchain Management';
            case '/manage-registrar':
                return 'Manage Registrars';
            case '/manage-users':
                return 'User Management';
            case '/manage-registrar/add':
                return 'Add Registrar';
            case '/activity-logs':
                return 'Audit Trail / System Logs';
            case '/tor':
                return 'Document Management';
            case '/profile/info':
                return 'Profile Information';
            case '/profile':
                return 'Edit Profile';
            default:
                // Check for dynamic routes
                if (path.startsWith('/requests/')) {
                    return 'Request Details';
                }
                if (path.startsWith('/transactions/')) {
                    return 'Transaction Details';
                }
                if (path.startsWith('/manage-registrar/details/')) {
                    return 'Registrar Information';
                }
                if (path.startsWith('/tor/')) {
                    return 'TOR Details';
                }
                if (path === '/blockchain/create') {
                    return 'Create Blockchain Record';
                }
                if (path === '/blockchain/my-transactions') {
                    return 'My Blockchain Records';
                }
                if (path === '/blockchain/verify') {
                    return 'Verify Blockchain Record';
                }
                return 'Dashboard';
        }
    };

    const userRole = localStorage.getItem('userRole') || '';

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-table-cells-large' },
        { path: '/requests', label: 'Document Requests', icon: 'fa-solid fa-file-lines' },
        { path: '/transactions', label: 'Payments', icon: 'fa-solid fa-money-check-dollar' },
        { path: '/blockchain', label: 'Blockchain', icon: 'fa-solid fa-cubes' },
        { path: '/notifications', label: 'Notifications', icon: 'fa-solid fa-bell' }
    ];

    if (userRole === 'super admin') {
        menuItems.push(
            { path: '/manage-registrar', label: 'Manage Registrar', icon: 'fa-solid fa-user-gear' },
            { path: '/manage-users', label: 'Manage Users', icon: 'fa-solid fa-users' },
            { path: '/activity-logs', label: 'System Logs', icon: 'fa-solid fa-clipboard-list' }
        );
    }
    
    menuItems.push({ path: '/profile/info', label: 'Profile', icon: 'fa-solid fa-circle-user' });

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

        // Fetch unread notifications
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
        <div className="flex min-h-screen bg-[#e9e9e9]">
            {/* Skip to content link for accessibility */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:text-[#2f3947] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-bold">
                Skip to main content
            </a>

            {/* Mobile Backdrop overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[998] md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}

            {/* 3D Floating Dock Sidebar with Original Colors & Logos */}
            <aside className={`fixed top-4 left-4 bottom-4 bg-[#2c3543] rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_6px_20px_rgba(0,0,0,0.2)] border border-slate-700/50 flex flex-col z-[1000] sidebar transition-all duration-300 overflow-hidden ${
                isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-[120%] md:translate-x-0'
            } ${isCollapsed ? 'md:w-[80px]' : 'md:w-[260px]'}`}>
                
                {/* White Logo Container with 3D inset/border */}
                <div className={`h-[110px] bg-white flex items-center justify-center overflow-hidden transition-all duration-300 rounded-t-[28px] shadow-sm border-b border-gray-100 ${isCollapsed ? 'px-2' : 'px-6'}`}>
                    {isCollapsed ? (
                        <div className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-105">
                            <img src={verifitorIcon} alt="Verifitor Icon" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <img
                            src={verifitorLogo}
                            alt="Verifitor"
                            className="w-full max-w-[170px] object-contain transition-all duration-300 hover:scale-105"
                        />
                    )}
                </div>

                {/* Navigation Items in Original Dark Colors with Tactile 3D Shaped Buttons */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-2.5 custom-scrollbar" aria-label="Main navigation">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            title={isCollapsed ? item.label : ''}
                            onClick={() => {
                                if (window.innerWidth < 768) {
                                    setIsMobileOpen(false);
                                }
                            }}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-[13.5px] transition-all duration-200 select-none ${
                                    isActive
                                        ? 'bg-gradient-to-b from-[#3e4c5e] to-[#2d3846] text-white border-t border-white/20 border-b-2 border-black/40 shadow-[0_6px_15px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] scale-[1.02]'
                                        : 'bg-[#252d3a]/60 text-[#9ba4b5] border-t border-white/5 border-b border-black/20 hover:bg-gradient-to-b hover:from-[#354253] hover:to-[#293442] hover:text-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-inner'
                                } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* 3D Inner Icon Tile */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                        isActive 
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_3px_8px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]' 
                                            : 'bg-[#1e2531] text-[#9ba4b5] group-hover:text-white group-hover:bg-[#283342] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
                                    }`}>
                                        <i className={`${item.icon} ${isCollapsed ? 'text-[16px]' : 'text-[14px]'}`}></i>
                                    </div>

                                    {!isCollapsed && (
                                        <span className="tracking-wide truncate">{item.label}</span>
                                    )}

                                    {/* 3D Active Indicator Pill */}
                                    {isActive && (
                                        <span className="absolute right-2.5 w-1.5 h-4 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.9)]"></span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Dock Actions with 3D Shaped Buttons */}
                <div className="p-3 border-t border-slate-700/60 space-y-2">
                    <button 
                        onClick={toggleSidebar}
                        className="hidden md:flex w-full items-center justify-center p-2 rounded-xl bg-[#222a36] text-[#9ba4b5] border-t border-white/10 border-b border-black/40 shadow-sm hover:bg-[#323d4d] hover:text-white hover:-translate-y-0.5 active:translate-y-0.5 transition-all focus:outline-none"
                        title={isCollapsed ? "Expand Dock" : "Collapse Dock"}
                    >
                        <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-[12px]`}></i>
                    </button>

                    <button 
                        onClick={handleLogout}
                        className={`w-full bg-white text-[#2c3543] py-2.5 rounded-2xl font-bold flex justify-center items-center gap-2 border-t border-white border-b-4 border-slate-300 shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 transition-all ${isCollapsed ? 'px-0' : 'px-4'}`}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket text-base"></i>
                        {!isCollapsed && <span className="text-[14px]">Logout</span>}
                    </button>
                </div>
            </aside>

            <div className={`flex flex-col w-full ${isCollapsed ? 'md:ml-[96px] md:w-[calc(100%-96px)]' : 'md:ml-[280px] md:w-[calc(100%-280px)]'} transition-all duration-300 main-content min-w-0`}>
                
                {/* 3D Elevated Floating Top Navigation Header */}
                <header className="flex items-center justify-between px-6 sm:px-8 bg-gradient-to-r from-[#44627d] via-[#4d6f8c] to-[#547794] m-4 rounded-[28px] sticky top-4 z-[990] h-[72px] shadow-[0_12px_32px_rgba(44,53,67,0.14),0_2px_6px_rgba(0,0,0,0.04)] border border-white/20 backdrop-blur-md">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={handleToggle}
                            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer focus:outline-none flex items-center justify-center border border-white/15 shadow-inner"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
                            aria-expanded={!isCollapsed}
                        >
                            <i className="fa-solid fa-angles-left text-lg"></i>
                        </button>
                        <h2 className="text-white text-[20px] sm:text-[22px] font-extrabold m-0 tracking-tight drop-shadow-xs truncate max-w-[280px] sm:max-w-none">
                            {getPageTitle()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 relative" ref={dropdownRef}>
                        {/* Notification Pill Button */}
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/15 shadow-inner relative"
                            aria-label={`View notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                        >
                            <i className="fa-solid fa-bell text-[15px]"></i>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-extrabold rounded-full ring-2 ring-[#4d6f8c] shadow-sm animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* User Profile Pill */}
                        <div 
                            className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 bg-white/15 hover:bg-white/25 rounded-full border border-white/20 transition-all cursor-pointer shadow-sm select-none" 
                            onClick={toggleMenu}
                        >
                            <div className="w-8 h-8 rounded-full bg-white text-[#547794] flex items-center justify-center font-extrabold text-xs shadow-sm overflow-hidden flex-shrink-0">
                                {adminUser.profilePic ? (
                                    <img src={adminUser.profilePic.startsWith('http') ? adminUser.profilePic : `http://localhost:5000${adminUser.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="tracking-tight">{getInitials(adminUser.name || 'Registrar Name')}</span>
                                )}
                            </div>
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-white text-[13px] font-bold m-0 leading-tight truncate max-w-[120px]">{adminUser.name || 'Registrar Name'}</span>
                                <span className="text-white/80 text-[10.5px] font-medium m-0 leading-tight lowercase truncate max-w-[120px]">{adminUser.email || `${userRole.replace(' ', '')}name@sample.com`}</span>
                            </div>
                            <i className="fa-solid fa-chevron-down text-white/70 text-[10px] ml-0.5 hidden sm:block"></i>
                        </div>

                        {/* Dropdown Menu */}
                        <div
                            className={`absolute right-0 top-[58px] bg-white shadow-2xl border border-slate-100 rounded-3xl flex-col min-w-[210px] z-[10000] overflow-hidden p-1.5 transition-all duration-200 origin-top-right ${
                                menuOpen ? 'flex opacity-100 scale-100' : 'hidden opacity-0 scale-95'
                            }`}
                            role="menu"
                        >
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
                                <p className="text-sm font-extrabold text-slate-800 capitalize leading-tight truncate">{adminUser.name || 'Registrar Name'}</p>
                                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider capitalize mt-0.5">{userRole || 'Super Admin'}</p>
                            </div>
                            
                            <div className="py-1">
                                <NavLink
                                    to="/profile/info"
                                    onClick={() => setMenuOpen(false)}
                                    className="text-slate-700 px-3.5 py-2.5 no-underline text-[13px] font-semibold transition-colors hover:bg-slate-100 hover:text-blue-600 rounded-xl flex items-center gap-3"
                                    role="menuitem"
                                >
                                    <i className="fa-regular fa-id-badge text-slate-400"></i> Profile Info
                                </NavLink>
                                <NavLink
                                    to="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className="text-slate-700 px-3.5 py-2.5 no-underline text-[13px] font-semibold transition-colors hover:bg-slate-100 hover:text-blue-600 rounded-xl flex items-center gap-3"
                                    role="menuitem"
                                >
                                    <i className="fa-solid fa-sliders text-slate-400"></i> Settings
                                </NavLink>
                            </div>

                            <div className="pt-1 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="text-red-600 px-3.5 py-2.5 text-[13px] font-bold text-left bg-transparent w-full cursor-pointer transition-colors hover:bg-red-50 rounded-xl flex items-center gap-3"
                                    role="menuitem"
                                >
                                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main id="main-content" className="flex-1 w-full px-4 sm:px-6 py-2">
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