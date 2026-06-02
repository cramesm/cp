import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

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
            {/* Mobile Backdrop overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-[998] md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}

            <aside className={`fixed top-0 left-0 min-h-screen bg-[#2f3947] flex flex-col z-[1000] shadow-lg sidebar transition-all duration-300 
                ${isMobileOpen ? 'translate-x-0 w-[230px]' : '-translate-x-full md:translate-x-0'} 
                ${isCollapsed ? 'md:w-[70px]' : 'md:w-[230px]'}
            `}>
                <div className={`h-[60px] bg-[#f4f6f8] flex items-center justify-center border-b border-[#d9d9d9] overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {isCollapsed ? (
                        <div className="w-[40px] h-[40px] rounded-lg bg-[#2f3947] flex items-center justify-center flex-shrink-0 transition-all duration-300">
                            <span className="text-white font-bold text-lg" style={{ fontFamily: "'League Spartan', sans-serif" }}>V</span>
                        </div>
                    ) : (
                        <img
                            src="/assets/verifitorlogo.png"
                            alt="Verifitor"
                            className="h-[42px] object-contain transition-all duration-300"
                        />
                    )}
                </div>

                <nav className="flex-1 px-3 py-5 overflow-y-auto">
                    <ul className="list-none p-0 m-0 flex flex-col gap-2">
                        {menuItems.map((item) => (
                            <li key={item.path}>
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
                                        `flex items-center ${isCollapsed ? 'justify-center mx-0.5 px-0 py-3' : 'gap-3 px-3 py-3'} rounded-md transition-all duration-300 ${
                                            isActive
                                                ? 'bg-[#f1f1f1] text-[#1f1f1f] font-medium'
                                                : 'text-white hover:bg-[#3a4555]'
                                        }`
                                    }
                                >
                                    <i className={`${item.icon} ${isCollapsed ? 'text-[16px]' : 'text-[13px]'} transition-all duration-300`}></i>
                                    {!isCollapsed && <span className="text-[14px] transition-opacity duration-300">{item.label}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            <div className={`flex flex-col w-full ${isCollapsed ? 'md:ml-[70px] md:w-[calc(100%-70px)]' : 'md:ml-[230px] md:w-[calc(100%-230px)]'} transition-all duration-300 main-content`}>
                <header className="flex items-center justify-between px-5 bg-[#6f8faa] sticky top-0 z-[999] h-[60px] shadow-sm top-nav">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggle}
                            className="text-white hover:bg-[#5a7c98] p-2 rounded-lg transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <i className={`fa-solid ${isCollapsed ? 'fa-bars' : 'fa-outdent'} text-lg`}></i>
                        </button>
                        <h2 className="text-white text-[20px] font-semibold m-0 uppercase tracking-tight">
                            {getPageTitle()}
                        </h2>
                    </div>

                    <div className="flex items-center gap-5 relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="text-white text-[18px] hover:opacity-80 transition"
                        >
                            <i className="fa-regular fa-bell"></i>
                        </button>

                        <button
                            type="button"
                            onClick={toggleMenu}
                            className="text-white text-[20px] hover:opacity-80 transition"
                        >
                            <i className="fa-solid fa-circle-user"></i>
                        </button>

                        <div
                            className={`absolute right-0 top-[42px] bg-white shadow-lg rounded-xl flex-col min-w-[180px] z-[10000] overflow-hidden transition-all duration-200 ${
                                menuOpen ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-2'
                            }`}
                        >
                            <NavLink
                                to="/profile/info"
                                className="text-[#333] px-[18px] py-3 no-underline text-sm border-b border-[#eee] transition-all hover:bg-[#f1f3f5]"
                            >
                                Profile Information
                            </NavLink>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-[#333] px-[18px] py-3 text-sm text-left bg-transparent border-none w-full cursor-pointer transition-all hover:bg-[#f1f3f5]"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 w-full bg-[#f8fafc]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;