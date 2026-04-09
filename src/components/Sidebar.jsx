import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
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
  ];

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col min-h-screen sticky top-0 font-['Plus_Jakarta_Sans']">
      <div className="p-8 pb-4">
        <img 
          src="/energy-logo.png" 
          alt="Energy Enterprises Logo" 
          className="w-full mb-4" 
        />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => 
              `w-full flex items-center gap-3.5 px-4 py-3.5 rounded-lg transition-all duration-300 font-semibold text-sm ${
                isActive 
                  ? 'bg-[#D15616]/10 text-[#D15616] transform translate-x-2' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'animate-pulse' : ''}>{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-50 space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-[#D15616] text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-[#D15616]/20">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
            {/* <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{user.role.replace('_', ' ')}</p> */}
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-300 font-bold text-[11px] uppercase tracking-widest group"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" className="group-hover:-translate-x-1 transition-transform">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
