import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Admin', role: 'Management' };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage')); // Notify App.jsx
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Performance Dashboard', path: '/dashboard', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    )},
    { id: 'form', label: 'Register New Service', path: '/register', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    )},
    { id: 'table', label: 'Customer Database', path: '/database', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3zM3 9h18M9 3v18"></path>
      </svg>
    )},
    { id: 'daily-service', label: 'Daily Service Report', path: '/daily-service', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )},
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-100 flex flex-col min-h-screen sticky top-0 transition-all duration-300 font-['Plus_Jakarta_Sans'] relative z-20`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-8 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 flex items-center justify-center z-30 transition-transform duration-300 text-gray-600 hover:text-gray-900"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div className={`p-8 pb-4 h-auto flex items-center justify-center overflow-hidden transition-all duration-300 ${isCollapsed ? 'px-4' : ''}`}>
        <img 
          src="/energy-logo.png" 
          alt="Energy Enterprises Logo" 
          className={`transition-all duration-300 origin-left ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-full opacity-100 block'}`}
        />
        {isCollapsed && (
          <div className="h-10 w-10 min-w-[40px] bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
            E
          </div>
        )}
      </div>

      <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} py-4 space-y-2 transition-all duration-300`}>
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={isCollapsed ? item.label : ""}
            className={({ isActive }) => 
              `w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3.5'} rounded-lg transition-all duration-300 font-semibold text-sm whitespace-nowrap overflow-hidden ${
                isActive 
                  ? `bg-[#D15616]/10 text-[#D15616] ${isCollapsed ? '' : 'transform translate-x-2'}` 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex-shrink-0 ${isActive ? 'animate-pulse' : ''}`}>{item.icon}</span>
                {!isCollapsed && <span className="transition-opacity duration-300">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`p-6 border-t border-gray-50 space-y-4 transition-all duration-300 ${isCollapsed ? 'px-3' : ''}`}>
        {!isCollapsed ? (
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 min-w-[40px] bg-[#D15616] text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-[#D15616]/20">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[72px]" title={user.name}>
            <div className="h-10 w-10 min-w-[40px] bg-[#D15616] text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-[#D15616]/20">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Sign Out" : ""}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg text-red-500 hover:bg-red-50 transition-all duration-300 font-bold text-[11px] uppercase tracking-widest group whitespace-nowrap overflow-hidden`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" className={`flex-shrink-0 ${isCollapsed ? '' : 'group-hover:-translate-x-1'} transition-transform`}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {!isCollapsed && <span className="transition-opacity duration-300">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
