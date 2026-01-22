import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export const Layout: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-gray-950 text-white font-sans">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-all duration-300">
                {/* Logo / Brand */}
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-inner flex-shrink-0" />
                    <span className="ml-3 font-bold text-xl tracking-tight hidden lg:block bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        CTF Admin
                    </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6 space-y-2 px-3">
                    <NavItem to="/admin" icon={<DashboardIcon />} label="Command Center" />
                    <NavItem to="/flag" icon={<FlagIcon />} label="Flag Interface" />
                    <NavItem to="/simulator" icon={<PhoneIcon />} label="Simulator" />
                </nav>

                {/* Footer / User Info */}
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center justify-center lg:justify-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-mono text-gray-400">
                            ID
                        </div>
                        <div className="hidden lg:block">
                            <div className="text-sm font-medium text-gray-300">Admin User</div>
                            <div className="text-xs text-gray-500">Online</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-20 lg:ml-64 w-full relative">
                <Outlet />
            </main>
        </div>
    );
};

// Helper Components

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
             ${isActive
                ? 'bg-gray-800 text-white shadow-lg shadow-indigo-500/10 border border-gray-700/50'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }`
        }
    >
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            {icon}
        </span>
        <span className="ml-3 font-medium hidden lg:block origin-left duration-200">
            {label}
        </span>
    </NavLink>
);

// Icons
const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const FlagIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 22v-7" />
    </svg>
);

const PhoneIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);
