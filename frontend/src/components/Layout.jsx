import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Breadcrumb from './Breadcrumb';

const Layout = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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
                return 'Super Administrators';
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

    const userRole = localStorage.getItem('userRole');

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

    useEffect(() => {
        setIsMobileOpen(false);
        setMenuOpen(false);
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

            <aside className={`fixed top-0 left-0 min-h-screen bg-[#2f3947] border-r border-[#1a232f] flex flex-col z-[1000] shadow-2xl sidebar transition-all duration-300 
                ${isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:translate-x-0'} 
                ${isCollapsed ? 'md:w-[80px]' : 'md:w-[260px]'}
            `}>
                <div className={`h-[72px] bg-[#f4f6f8] flex items-center justify-center border-b border-[#d9d9d9] overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
                    {isCollapsed ? (
                        <div className="w-[48px] h-[48px] rounded-xl bg-[#2f3947] flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-300">
                            <span className="text-white font-bold text-xl tracking-tight">V</span>
                        </div>
                    ) : (
                        <img
                            src="/assets/verifitorlogo.png"
                            alt="Verifitor"
                            className="h-[46px] object-contain transition-all duration-300"
                        />
                    )}
                </div>

                <nav className="flex-1 px-4 py-6 overflow-y-auto" aria-label="Main navigation">
                    <ul className="list-none p-0 m-0 flex flex-col gap-3">
                        {menuItems.map((item) => (
                            <li key={item.path} className="relative">
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/dashboard'}
                                    title={isCollapsed ? item.label : ''}
                                    onClick={() => {
                                        if (window.innerWidth < 768) {
                                            setIsMobileOpen(false);
                                        }
                                    }}
                                    className={({ isActive }) =>
                                        `relative flex items-center z-10 ${isCollapsed ? 'justify-center mx-1 px-0 py-3.5' : 'gap-4 px-4 py-3.5'} rounded-xl transition-colors duration-200 ${
                                            isActive
                                                ? 'text-[#1f1f1f] font-semibold'
                                                : 'text-[#9ba4b5] hover:text-white hover:bg-[#3a4555]'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-[#f1f1f1] rounded-xl -z-10 shadow-sm"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                            <i className={`${item.icon} ${isCollapsed ? 'text-[18px]' : 'text-[16px]'} transition-all duration-300 ${isActive ? 'text-[#1f1f1f]' : ''}`}></i>
                                            {!isCollapsed && <span className="text-[15px] tracking-wide transition-opacity duration-300">{item.label}</span>}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            <div className={`flex flex-col w-full ${isCollapsed ? 'md:ml-[80px] md:w-[calc(100%-80px)]' : 'md:ml-[260px] md:w-[calc(100%-260px)]'} transition-all duration-300 main-content`}>
                <header className="flex items-center justify-between px-8 bg-[#6f8faa]/95 backdrop-blur-md sticky top-0 z-[990] h-[72px] border-b border-[#5a7c98] top-nav shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleToggle}
                            className="text-white hover:bg-[#5a7c98] p-2.5 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center justify-center"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
                            aria-expanded={!isCollapsed}
                        >
                            <i className={`fa-solid ${isCollapsed ? 'fa-bars-staggered' : 'fa-outdent'} text-lg`}></i>
                        </button>
                        <h2 className="text-white text-[22px] font-bold m-0 tracking-tight">
                            {getPageTitle()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6 relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="text-white hover:opacity-80 text-[20px] transition-opacity relative"
                            aria-label="View notifications"
                        >
                            <i className="fa-regular fa-bell"></i>
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#6f8faa]"></span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleMenu}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f4f6f8] text-[#2f3947] text-[20px] hover:bg-white transition-all shadow-sm"
                            aria-label="User menu"
                            aria-expanded={menuOpen}
                            aria-haspopup="true"
                        >
                            <i className="fa-solid fa-circle-user"></i>
                        </button>

                        <div
                            className={`absolute right-0 top-[56px] bg-white shadow-soft border border-slate-100 rounded-2xl flex-col min-w-[200px] z-[10000] overflow-hidden transition-all duration-200 origin-top-right ${
                                menuOpen ? 'flex opacity-100 scale-100' : 'hidden opacity-0 scale-95'
                            }`}
                            role="menu"
                        >
                            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                                <p className="text-sm font-bold text-slate-800 capitalize">{userRole}</p>
                                <p className="text-xs text-slate-500">verifitor.com</p>
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

                <main id="main-content" className="flex-1 w-full bg-slate-50 p-6 md:p-8">
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