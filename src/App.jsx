import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CustomerForm from './components/CustomerForm';
import CustomerTable from './components/CustomerTable';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Login from './components/Login';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const location = useLocation();
  const isDatabase = location.pathname === '/database';
  const isDashboard = location.pathname === '/dashboard';
  const isLogin = location.pathname === '/login';

  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('user')));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className={`flex min-h-screen font-['Plus_Jakarta_Sans'] text-gray-900 overflow-hidden ${isLogin ? 'bg-white' : ''}`}>
      {/* Sidebar Navigation */}
      {!isLogin && <Sidebar />}
      
      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto h-screen ${isLogin ? 'p-0' : ''}`}>
        {!isLogin && (
          <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10 transition-all duration-300">
            <div>
              <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
                {isDashboard ? 'Performance Analytics' : isDatabase ? 'Database Records' : 'Customer Registration'}
              </h2>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-0.5 opacity-60">
                {isDashboard ? 'Business intelligence overview' : isDatabase ? 'Complete service history log' : 'Step-by-step onboarding'}
              </p>
            </div>
            {/* <div className="flex items-center gap-4">
              <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-100"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Live</span>
            </div> */}
          </header>
        )}

        <section className={`${isLogin ? 'p-0 h-full' : 'p-8 max-w-8xl mx-auto'}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <div className="transition-all duration-500 transform opacity-100 translate-y-0">
                    <Dashboard />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <ProtectedRoute>
                  <div className="transition-all duration-500 transform opacity-100 translate-y-0">
                    <CustomerForm />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/database" 
              element={
                <ProtectedRoute>
                  <div className="transition-all duration-500 transform opacity-100 translate-y-0">
                    <CustomerTable />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default App;
