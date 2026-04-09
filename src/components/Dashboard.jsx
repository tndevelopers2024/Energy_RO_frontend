import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const TrendChart = ({ data, maxCount }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  
  const width = 600;
  const height = 220;
  const padding = 20;
  
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const getPoints = (key) => data.map((d, i) => {
    const x = padding + (i * (chartWidth / (data.length - 1)));
    const y = height - padding - ((d[key] / maxCount) * chartHeight);
    return { x, y, ...d };
  });

  const installPoints = getPoints('count');
  const servicePoints = getPoints('serviceCount');

  const getPaths = (points) => {
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    return { line, area };
  };

  const installPaths = getPaths(installPoints);
  const servicePaths = getPaths(servicePoints);

  return (
    <div className="relative w-full h-full group/chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="installGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D15616" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#D15616" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="serviceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line 
            key={i}
            x1={padding}
            y1={height - padding - (p * chartHeight)}
            x2={width - padding}
            y2={height - padding - (p * chartHeight)}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}

        {/* Service Area & Line (Green) */}
        <path d={servicePaths.area} fill="url(#serviceGradient)" className="transition-all duration-1000" />
        <path d={servicePaths.line} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000 opacity-60" />

        {/* Installation Area & Line (Orange) */}
        <path d={installPaths.area} fill="url(#installGradient)" className="transition-all duration-1000" />
        <path d={installPaths.line} fill="none" stroke="#D15616" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000" />

        {/* Shared Invisible Interaction Layer */}
        {installPoints.map((p, i) => (
          <rect
            key={i}
            x={p.x - 20}
            y={0}
            width={40}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          />
        ))}

        {/* Data Points */}
        {hoveredIdx !== null && (
          <>
            <circle cx={installPoints[hoveredIdx].x} cy={installPoints[hoveredIdx].y} r="6" fill="white" stroke="#D15616" strokeWidth="3" className="animate-in fade-in zoom-in duration-200" />
            <circle cx={servicePoints[hoveredIdx].x} cy={servicePoints[hoveredIdx].y} r="6" fill="white" stroke="#10b981" strokeWidth="3" className="animate-in fade-in zoom-in duration-200" />
          </>
        )}

        {/* X-Axis Labels */}
        {installPoints.map((p, i) => (
          <text key={i} x={p.x} y={height} textAnchor="middle" className="text-[10px] font-black fill-gray-400 uppercase tracking-widest">{p.name}</text>
        ))}
      </svg>

      {/* Unified Tooltip */}
      {hoveredIdx !== null && (
        <div 
          style={{ 
            left: `${(installPoints[hoveredIdx].x / width) * 100}%`,
            top: `${(Math.min(installPoints[hoveredIdx].y, servicePoints[hoveredIdx].y) / height) * 100}%`
          }}
          className={`absolute -translate-y-[calc(100%+20px)] bg-white border border-gray-100 shadow-2xl rounded-md p-4 min-w-[160px] pointer-events-none z-20 animate-in fade-in zoom-in duration-200 ${
            hoveredIdx >= data.length - 2 ? '-translate-x-[90%]' : '-translate-x-1/2'
          }`}
        >
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 pb-2 border-b border-gray-50">{installPoints[hoveredIdx].name} 2026 Analysis</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[9px] font-black text-[#D15616] uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D15616]"></span>
                Installs
              </span>
              <span className="text-sm font-black text-gray-900">{installPoints[hoveredIdx].count}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[9px] font-black text-[#10b981] uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
                Services
              </span>
              <span className="text-sm font-black text-gray-900">{installPoints[hoveredIdx].serviceCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleCardClick = (tab) => {
    navigate('/database', { state: { activeTab: tab } });
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/customers');
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const calculateKPIs = () => {
    const now = new Date();
    
    // Date windows
    const getWindowDate = (days) => {
      const d = new Date();
      d.setDate(now.getDate() + days);
      return d;
    };

    const next7Days = getWindowDate(7);
    const next14Days = getWindowDate(14);
    const next30Days = getWindowDate(30);

    const totalInstallation = customers.filter(c => c.type === 'Installation').length;
    const acmcCount = customers.filter(c => c.isACMC).length;
    
    // In Warranty = Installation type and Date under 1 year old
    const warrantyCount = customers.filter(c => {
      if (c.type !== 'Installation' || !c.dateOfInstallationOrService) return false;
      const installDate = new Date(c.dateOfInstallationOrService);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return installDate > oneYearAgo;
    }).length;

    // Helper to count services due within a specific date window
    const countDueIn = (windowDate) => {
      return customers.filter(cust => {
        const isACMC = cust.isACMC;
        const services = isACMC ? cust.acmcServicesCompleted : cust.servicesCompleted;
        const nextIdx = services?.findIndex(status => !status);
        if (nextIdx === -1) return false;

        const baseDate = isACMC ? cust.acmcStartDate : cust.dateOfInstallationOrService;
        if (!baseDate) return false;

        const base = new Date(baseDate);
        const months = [4, 8, 12][nextIdx];
        base.setMonth(base.getMonth() + months);
        
        return base <= windowDate && base >= now; // must be in the future but before window
      }).length;
    };

    const due7 = countDueIn(next7Days);
    const due14 = countDueIn(next14Days);
    const due30 = countDueIn(next30Days);

    return { totalInstallation, warrantyCount, acmcCount, due7, due14, due30 };
  };

  const kpis = calculateKPIs();

  // Simple Chart Data: Installations & Services per month (last 6 months)
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // Fix: Prevent month-end overflow errors
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleDateString(undefined, { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 0,
        serviceCount: 0
      });
    }

    customers.forEach(c => {
      // Installations
      if (c.dateOfInstallationOrService) {
        const date = new Date(c.dateOfInstallationOrService);
        const mIdx = months.findIndex(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (mIdx > -1) months[mIdx].count++;
      }

      // Services (Scan both Warranty and ACMC reports)
      const allReports = [...(c.serviceReports || []), ...(c.acmcServiceReports || [])];
      allReports.forEach(report => {
        if (!report?.visitDate) return;
        const date = new Date(report.visitDate);
        const mIdx = months.findIndex(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (mIdx > -1) months[mIdx].serviceCount++;
      });
    });

    return months;
  };

  const chartData = getMonthlyData();
  const maxCount = Math.max(...chartData.map(d => Math.max(d.count, d.serviceCount)), 5);

  const StatCard = ({ title, value, sub, themeColor, icon, trendColor = "text-green-500", onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-md border shadow-sm transition-all group overflow-hidden relative ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 border-gray-100' : 'border-gray-100'}`}
    >
      {/* Decorative circle */}
      <div 
        style={{ backgroundColor: themeColor }}
        className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform"
      ></div>
      
      <div className="flex justify-between items-start mb-4">
        <div 
          style={{ backgroundColor: themeColor + '15' }} // 15 is ~8% hex opacity
          className="p-3 rounded-md flex items-center justify-center border border-gray-50"
        >
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</h4>
        <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
        <p className="text-[11px] text-gray-500 font-bold mt-2 flex items-center gap-1">
          <span className={`${trendColor} font-black`}>•</span>
          {sub}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-[#D15616]/10 border-t-[#D15616] rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-['Plus_Jakarta_Sans']">
      {/* Row 1: Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Installations" 
          value={kpis.totalInstallation} 
          sub="Cumulative fleet size"
          themeColor="#D15616"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" stroke="#D15616" strokeWidth="3" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
          onClick={() => handleCardClick('all')}
        />
        <StatCard 
          title="Total In Warranty" 
          value={kpis.warrantyCount} 
          sub="Active coverage"
          themeColor="#3b82f6"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" stroke="#3b82f6" strokeWidth="3" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>}
          onClick={() => handleCardClick('warranty')}
        />
        <StatCard 
          title="Total ACMC Contracts" 
          value={kpis.acmcCount} 
          sub="Subscribed users"
          themeColor="#10b981"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" stroke="#10b981" strokeWidth="3" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
          onClick={() => handleCardClick('acmc')}
        />
      </div>

      {/* Row 2: Service Forecaster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Due in 7 Days" 
          value={kpis.due7} 
          sub="Immediate action"
          themeColor="#ef4444"
          trendColor="text-red-500"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" stroke="#ef4444" strokeWidth="3" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
          onClick={() => handleCardClick('due7')}
        />
        <StatCard 
          title="Due in 14 Days" 
          value={kpis.due14} 
          sub="Short-term planning"
          themeColor="#f59e0b"
          trendColor="text-amber-500"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" stroke="#f59e0b" strokeWidth="3" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
          onClick={() => handleCardClick('due14')}
        />
        <StatCard 
          title="Due in 1 Month" 
          value={kpis.due30} 
          sub="Monthly forecast"
          themeColor="#6366f1"
          trendColor="text-indigo-500"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" stroke="#6366f1" strokeWidth="3" fill="none"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
          onClick={() => handleCardClick('due30')}
        />

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="xl:col-span-2 bg-white p-8 rounded-md border border-gray-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Performance Trends</h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#D15616]"></span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Installations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Services</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-64 w-full px-2">
            <TrendChart data={chartData} maxCount={maxCount} />
          </div>
        </div>

        {/* Priority Watchlist */}
        <div className="bg-white p-8 rounded-md border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Quick Actions</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Pending Management Task</p>
          </div>
          <div className="space-y-4">
            <NavLink to="/database" className="flex items-center gap-4 p-4 rounded-md bg-[var(--bg-main)] border border-gray-100 hover:border-[#D15616]/30 transition-all group">
              <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-gray-900 uppercase">Customer Records</p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Check database</p>
              </div>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#D15616" strokeWidth="3" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M9 18l6-6-6-6"></path></svg>
            </NavLink>

            <NavLink to="/register" className="flex items-center gap-4 p-4 rounded-md bg-[var(--bg-main)] border border-gray-100 hover:border-[#D15616]/30 transition-all group">
              <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center text-[#D15616] shadow-sm group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-gray-900 uppercase">New Installation</p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Add customer</p>
              </div>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#D15616" strokeWidth="3" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M9 18l6-6-6-6"></path></svg>
            </NavLink>
          </div>
          
          {/* <div className="mt-8 p-5 bg-gradient-to-br from-[#D15616] to-[#ff7b3a] rounded-md text-white relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Fleet Health</p>
            <p className="text-lg font-black tracking-tight mb-3">Service Quality is at {kpis.fleetHealth}%</p>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div 
                style={{ width: `${kpis.fleetHealth}%` }}
                className="bg-white h-full rounded-full transition-all duration-1000"
              ></div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
