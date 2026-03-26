import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/': return 'Dashboard';
            case '/requests': return 'Document Requests';
            case '/transactions': return 'Transactions';
            case '/notifications': return 'Notifications';
            case '/manage-admins': return 'Manage Admins';
            case '/activity-logs': return 'Activity Logs';
            case '/profile': return 'Profile';
            default: return 'Dashboard';
        }
    };

    const userRole = localStorage.getItem('userRole');

    const sidebarPaths = [''];
    sidebarPaths.push('requests', 'transactions', 'notifications');
    
    // Super Admin only features
    if (userRole === 'system admin') {
        sidebarPaths.push('manage-admins', 'activity-logs');
    }
    
    sidebarPaths.push('profile');

    const labels = {
        '': 'Dashboard',
        'requests': 'Document Requests',
        'transactions': 'Transactions',
        'notifications': 'Notifications',
        'manage-admins': 'Manage Admins',
        'activity-logs': 'Activity Logs',
        'profile': 'Profile'
    };

    return (
        <div className="flex min-h-screen bg-[#f2f2f2]">
            {/* Sidebar */}
            <aside className="hidden md:block w-[250px] h-screen bg-[#213448] fixed top-0 left-0 pt-5 z-[1000]">
                <img src="assets/verifitorlogo.png" className="h-[60px] ml-[35px] bg-white rounded-[10px] py-1 px-2.5 shadow-md mb-5" alt="Verifitor" />
                <ul className="list-none p-0">
                    {sidebarPaths.map((path) => {
                        return (
                            <li key={path} className="px-5 py-2.5">
                                <NavLink 
                                    to={`/${path}`} 
                                    end={path === ''}
                                    className={({ isActive }) => 
                                        `block no-underline font-semibold py-3.5 px-5 rounded-[10px] transition-colors ${
                                            isActive 
                                            ? 'bg-white !text-[#213448] shadow-sm' 
                                            : 'text-white hover:bg-white/10 hover:text-white'
                                        }`
                                    }
                                >
                                    {labels[path]}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            {/* Main Wrapper */}
            <div className="flex flex-col w-full md:ml-[250px] md:w-[calc(100%-250px)]">
                {/* Header */}
                <header className="flex justify-end items-center px-6 py-2.5 bg-[#94B4C1] border-b border-white/10 sticky top-0 z-[999] h-[60px] w-full">
                    <h2 className="absolute left-5 text-2xl font-bold text-[#2F3640] m-0">{getPageTitle()}</h2>
                    
                    <img 
                        src="assets/bell_1.png" 
                        className="w-[25px] h-[25px] mr-[25px] transition-transform hover:scale-110 hover:opacity-85 cursor-pointer" 
                        alt="Notifications" 
                        onClick={() => navigate('/notifications')} 
                    />
                    
                    <div className="relative inline-block">
                        <img 
                            src="assets/user_2.png" 
                            className="w-[25px] h-[25px] mr-[25px] transition-transform hover:scale-110 hover:opacity-85 cursor-pointer" 
                            alt="User Profile" 
                            onClick={toggleMenu} 
                        />
                        
                        {/* Profile Dropdown */}
                        <div className={`absolute right-0 top-[45px] bg-white shadow-lg rounded-xl flex-col min-w-[160px] z-[10000] overflow-hidden transition-all duration-200 ${menuOpen ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-2'}`} id="profileMenu">
                            <NavLink to="/profile" className="text-[#333] px-[18px] py-3.5 no-underline text-sm border-b border-[#eee] transition-all hover:bg-[#f1f3f5] hover:pl-6">Profile</NavLink>
                            <NavLink to="/settings" className="text-[#333] px-[18px] py-3.5 no-underline text-sm border-b border-[#eee] transition-all hover:bg-[#f1f3f5] hover:pl-6">Settings</NavLink>
                            <button onClick={handleLogout} className="text-[#333] px-[18px] py-3.5 text-sm text-left align-left bg-transparent border-none w-full cursor-pointer transition-all hover:bg-[#f1f3f5] hover:pl-6">Logout</button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
