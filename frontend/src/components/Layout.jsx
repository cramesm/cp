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

                {/* Navigation Items in Original Dark Colors with 3D Floating Elevation */}
                <nav className="flex-1 px-3.5 py-5 overflow-y-auto space-y-2 custom-scrollbar" aria-label="Main navigation">
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
                                `group relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-[14px] transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[#374151] text-white shadow-md shadow-black/30 border-l-4 border-white translate-x-1'
                                        : 'text-[#9ba4b5] hover:text-white hover:bg-[#374151]/80 hover:shadow-xs'
                                } ${isCollapsed ? 'justify-center px-0' : ''}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                        isActive ? 'text-white' : 'text-[#9ba4b5] group-hover:text-white'
                                    }`}>
                                        <i className={`${item.icon} ${isCollapsed ? 'text-[18px]' : 'text-[16px]'}`}></i>
                                    </div>
                                    {!isCollapsed && (
                                        <span className="tracking-wide truncate">{item.label}</span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Dock Actions (Collapse & Logout) with Original Styling */}
                <div className="p-3.5 border-t border-slate-700/60 space-y-2">
                    <button 
                        onClick={toggleSidebar}
                        className="hidden md:flex w-full items-center justify-center p-2 rounded-xl text-[#9ba4b5] hover:text-white hover:bg-[#374151]/80 transition-all focus:outline-none"
                        title={isCollapsed ? "Expand Dock" : "Collapse Dock"}
                    >
                        <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-[13px]`}></i>
                    </button>

                    <button 
                        onClick={handleLogout}
                        className={`w-full bg-white text-[#2c3543] py-2.5 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-gray-100 shadow-md transition-all active:scale-[0.98] ${isCollapsed ? 'px-0' : 'px-4'}`}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket text-base"></i>
                        {!isCollapsed && <span className="text-[14px]">Logout</span>}
                    </button>
                </div>
            </aside>

            <div className={`flex flex-col w-full ${isCollapsed ? 'md:ml-[96px] md:w-[calc(100%-96px)]' : 'md:ml-[280px] md:w-[calc(100%-280px)]'} transition-all duration-300 main-content`}>
                <header className="flex items-center justify-between px-8 bg-[#547794] m-4 rounded-xl sticky top-4 z-[990] h-[72px] shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleToggle}
                            className="text-white hover:bg-white/20 p-2.5 rounded-xl transition-all cursor-pointer focus:outline-none flex items-center justify-center"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
                            aria-expanded={!isCollapsed}
                        >
                            <i className="fa-solid fa-angles-left text-2xl"></i>
                        </button>
                        <h2 className="text-white text-[24px] font-normal m-0 tracking-wide">
                            {getPageTitle()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6 relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="text-white hover:text-gray-200 text-[22px] transition-colors relative"
                            aria-label={`View notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                        >
                            <i className="fa-solid fa-bell"></i>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-[#547794]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <div className="flex items-center gap-3 cursor-pointer" onClick={toggleMenu}>
                            <button
                                type="button"
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#547794] text-[20px] transition-all shadow-sm overflow-hidden"
                                aria-label={`User menu for ${adminUser.name || 'Registrar Name'} (${getInitials(adminUser.name || 'Registrar Name')})`}
                                aria-expanded={menuOpen}
                                aria-haspopup="true"
                            >
                                {adminUser.profilePic ? (
                                    <img src={adminUser.profilePic.startsWith('http') ? adminUser.profilePic : `http://localhost:5000${adminUser.profilePic}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[16px] font-bold text-[#547794] tracking-wide">{getInitials(adminUser.name || 'Registrar Name')}</span>
                                )}
                            </button>
                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-white text-sm font-semibold m-0 leading-tight">{adminUser.name || 'Registrar Name'}</span>
                                <span className="text-white text-[11px] m-0 leading-tight lowercase">{adminUser.email || `${userRole.replace(' ', '')}name@sample.com`}</span>
                            </div>
                        </div>

                        <div
                            className={`absolute right-0 top-[56px] bg-white shadow-lg border border-slate-100 rounded-xl flex-col min-w-[200px] z-[10000] overflow-hidden transition-all duration-200 origin-top-right ${
                                menuOpen ? 'flex opacity-100 scale-100' : 'hidden opacity-0 scale-95'
                            }`}
                            role="menu"
                        >
                            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                                <p className="text-sm font-bold text-slate-800 capitalize">{adminUser.name || 'Registrar Name'}</p>
                                <p className="text-xs text-slate-500 capitalize">{userRole || 'Super Admin'}</p>
                            </div>
                            
                            <NavLink
                                to="/profile/info"
                                className="text-slate-700 px-5 py-3 no-underline text-sm font-medium transition-colors hover:bg-slate-50 hover:text-brand-600 flex items-center gap-3"
                                role="menuitem"
                            >
                                <i className="fa-regular fa-id-badge"></i> Profile Info
                            </NavLink>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-red-600 px-5 py-3 text-sm font-medium text-left bg-transparent border-t border-slate-100 w-full cursor-pointer transition-colors hover:bg-red-50 flex items-center gap-3"
                                role="menuitem"
                            >
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main id="main-content" className="flex-1 w-full bg-slate-50 text-slate-900 p-6 md:p-8">
                    <Breadcrumb />
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Layout;