import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ServiceModal from './ServiceModal';
import CustomerDetailsModal from './CustomerDetailsModal';
import EditCustomerModal from './EditCustomerModal';
import DateRangePicker from './DateRangePicker';
import DeleteConfirmModal from './DeleteConfirmModal';
import API_BASE_URL from '../apiConfig';

const CustomerTable = () => {
  const location = useLocation();
  const initialTab = location.state?.activeTab || 'all';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [modalData, setModalData] = useState({
    isOpen: false,
    customerId: null,
    customerName: '',
    serviceIndex: null,
    isACMC: false
  });
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    customer: null
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    customer: null
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    customerId: null,
    customerName: ''
  });

  const calculateServiceDates = (installationDate) => {
    if (!installationDate) return [];
    const baseDate = new Date(installationDate);
    return [4, 8, 12].map(months => {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + months);
      return d;
    });
  };

  const calculateAcmcDates = (acmcStartDate) => {
    if (!acmcStartDate) return [];
    const baseDate = new Date(acmcStartDate);
    return [4, 8, 12].map(months => {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + months);
      return d;
    });
  };

  const getFilteredCustomers = () => {
    let filtered = [...customers];

    // 1. Tab Filtering (Category & Service Schedule)
    if (activeTab !== 'all') {
      const now = new Date();
      if (activeTab === 'acmc') {
        filtered = filtered.filter(c => c.isACMC);
      }
      else if (activeTab === 'warranty') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        filtered = filtered.filter(c =>
          !c.isACMC &&
          c.type === 'Installation' &&
          c.dateOfInstallationOrService &&
          new Date(c.dateOfInstallationOrService) > oneYearAgo
        );
      }
      else if (activeTab === 'expired') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        filtered = filtered.filter(c =>
          !c.isACMC &&
          c.dateOfInstallationOrService &&
          new Date(c.dateOfInstallationOrService) <= oneYearAgo
        );
      }
      else {
        // Service Window Filters (due7, due14, due30)
        let days = 30;
        if (activeTab === 'due7') days = 7;
        else if (activeTab === 'due14') days = 14;

        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + days);

        filtered = filtered.filter(cust => {
          const isACMC = cust.isACMC;
          const services = isACMC ? cust.acmcServicesCompleted : cust.servicesCompleted;
          const nextIdx = services?.findIndex(status => !status);
          if (nextIdx === -1) return false;

          const baseDate = isACMC ? cust.acmcStartDate : cust.dateOfInstallationOrService;
          const serviceDates = isACMC ? calculateAcmcDates(baseDate) : calculateServiceDates(baseDate);
          const serviceDate = serviceDates[nextIdx];
          return serviceDate && serviceDate <= futureLimit && serviceDate >= now;
        });
      }
    }

    // 2. Search Term Filtering
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cust =>
        cust.userName?.toLowerCase().includes(term) ||
        cust.mobileNumber?.includes(term) ||
        cust.orderNo?.toLowerCase().includes(term)
      );
    }

    // 3. Date Range Filtering (Installation/Transaction Date)
    if (startDate) {
      filtered = filtered.filter(cust =>
        cust.dateOfInstallationOrService && new Date(cust.dateOfInstallationOrService) >= new Date(startDate)
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(cust =>
        cust.dateOfInstallationOrService && new Date(cust.dateOfInstallationOrService) <= end
      );
    }

    return filtered;
  };

  const filteredCustomers = getFilteredCustomers();

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDeleteClick = (customerId, customerName) => {
    setDeleteConfirm({
      isOpen: true,
      customerId,
      customerName
    });
  };

  const handleConfirmDelete = async () => {
    const { customerId } = deleteConfirm;
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm({ isOpen: false, customerId: null, customerName: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error("Failed to delete customer", error);
    }
  };

  const openServiceModal = (customerId, customerName, serviceIndex, isACMC) => {
    setModalData({
      isOpen: true,
      customerId,
      customerName,
      serviceIndex,
      isACMC,
      initialData: null
    });
  };

  const handleEditService = (customerId, serviceIndex, isACMC, report) => {
    setModalData({
      isOpen: true,
      customerId,
      customerName: detailsModal.customer?.userName || '',
      serviceIndex,
      isACMC,
      initialData: report
    });
  };

  const handleServiceSubmit = async (reportData) => {
    try {
      const { customerId, serviceIndex, isACMC } = modalData;
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}/services/${serviceIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reportData, isACMC }),
      });

      const data = await res.json();
      if (data.success) {
        setModalData(prev => ({ ...prev, isOpen: false }));
        // If details modal is open, refresh the selected customer data
        if (detailsModal.isOpen && detailsModal.customer?._id === customerId) {
          const updatedCustomer = data.data; // Server returns updated customer
          setDetailsModal(prev => ({ ...prev, customer: updatedCustomer }));
        }
        fetchCustomers();
      }
    } catch (error) {
      console.error("Failed to update service status", error);
    }
  };

  const handleEditUpdate = async (customerId, updatedData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      if (data.success) {
        setEditModal({ isOpen: false, customer: null });
        fetchCustomers();
      }
    } catch (error) {
      console.error("Failed to update customer", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-[#D15616]/10 border-t-[#D15616] rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Records...</p>
      </div>
    );
  }

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setActiveTab('all');
  };

  return (
    <div className="bg-white rounded-md shadow-2xl shadow-gray-200/50 border border-gray-50 font-['Plus_Jakarta_Sans']">
      <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recent Records</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-70">Management Console</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="text-xl font-black text-[#D15616] bg-[#D15616]/10 px-4 py-2 rounded-md border border-[#D15616]/5 uppercase tracking-tighter">
            {filteredCustomers.length} <span className='!text-[16px] font-bold'>Users</span>
          </div>
          {(searchTerm || startDate || endDate || activeTab !== 'all') && (
            <button
              onClick={clearFilters}
              className="cursor-pointer text-[10px] font-black text-gray-400 hover:text-[#D15616] uppercase tracking-widest transition-colors flex items-center gap-1.5 px-3 py-2 hover:bg-[#D15616]/5 rounded-md"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filtering Toolbar */}
      <div className="px-4 py-5 bg-[var(--bg-main)]/30 border-b border-gray-100 flex flex-col xl:flex-row gap-6 justify-between">
        {/* Left: Service Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-main)]/50 rounded-lg w-fit overflow-x-auto custom-scrollbar-hide whitespace-nowrap">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'warranty', label: 'In Warranty' },
            { id: 'acmc', label: 'ACMC' },
            { id: 'expired', label: 'Warranty Expired' },
            { id: 'due7', label: 'Next 7 Days' },
            { id: 'due14', label: 'Next 14 Days' },
            { id: 'due30', label: 'Next 30 Days' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer px-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === tab.id
                ? 'bg-white text-[#D15616] shadow-md shadow-gray-200/50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Search & Stylish Date Range */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search Box */}
          <div className="relative group w-full md:w-64">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#D15616] transition-colors" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search Name, Mobile, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-lg pl-11 pr-5 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none placeholder:text-gray-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-[9px]"
            />
          </div>

          {/* Unified Date Range Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeSelect={(start, end) => {
              setStartDate(start ? start.toISOString().split('T')[0] : '');
              setEndDate(end ? end.toISOString().split('T')[0] : '');
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black">
            <tr>
              <th className="px-8 py-5 min-w-[200px]">Customer Details</th>
              <th className="px-8 py-5 min-w-[200px]">Product & Model</th>
              <th className="px-8 py-5 min-w-[150px]">Date</th>
              <th className="px-8 py-5 text-center min-w-[200px]">Next Service Due</th>
              <th className="px-8 py-5 text-center">Reference</th>
              <th className="px-8 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bg-main)]">
            {filteredCustomers.map((cust) => {
              const isACMC = cust.isACMC;
              const services = isACMC ? cust.acmcServicesCompleted : cust.servicesCompleted;
              const nextIdx = services?.findIndex(status => !status);
              const isAllDone = nextIdx === -1;

              const baseDate = isACMC ? cust.acmcStartDate : cust.dateOfInstallationOrService;
              const serviceDate = !isAllDone ? (isACMC ? calculateAcmcDates(baseDate) : calculateServiceDates(baseDate))[nextIdx] : null;
              const isPast = serviceDate && serviceDate < new Date();

              return (
                <tr key={cust._id} className="hover:bg-[#D15616]/5 transition-all duration-300 group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      {cust.userName}
                      {isACMC && (
                        <span className="bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-sm">ACMC</span>
                      )}
                      <span className="h-1 w-1 rounded-full bg-[#D15616] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-bold mt-0.5 tracking-tight">{cust.mobileNumber}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-800 text-[13px] break-words whitespace-normal">{cust.productNameAndModel || 'Generic RO System'}</div>
                    {/* <div className={`inline-flex mt-1.5 items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                      cust.type === 'Installation' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-[#D15616]/10 text-[#D15616] border-[#D15616]/10'
                    }`}>
                      {cust.type}
                    </div> */}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[13px] font-bold text-gray-700 tracking-tight">
                          {cust.dateOfInstallationOrService ? new Date(cust.dateOfInstallationOrService).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                        </p>
                        {/* <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Transaction</p> */}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      {!isAllDone ? (
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => openServiceModal(cust._id, cust.userName, nextIdx, isACMC)}
                            className={`h-7 w-auto px-3 mb-1 rounded-md border flex items-center justify-center text-[9px] font-black tracking-widest transition-all hover:scale-105 active:scale-95 ${isPast
                              ? 'bg-red-50 border-red-100 text-red-500 shadow-sm shadow-red-50'
                              : isACMC
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'
                                : 'bg-[#D15616]/5 border-[#D15616]/20 text-[#D15616] shadow-sm'
                              }`}
                          >
                            {isACMC ? `ACMC Service ${nextIdx + 1}` : `Service ${nextIdx + 1}`} • {isPast ? 'PENDING' : 'DUE'}
                          </button>
                          <span className={`text-[10px] font-black uppercase ${isPast ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                            {serviceDate?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                          <span className="h-1 w-1 rounded-full bg-red-500"></span>
                          <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Warranty expired</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col gap-0.5 items-center">
                      {cust.orderNo && (
                        <div className="font-black text-gray-600 text-[10px] flex items-center gap-1">
                          <span className="text-gray-300">ORD</span> #{cust.orderNo}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDetailsModal({ isOpen: true, customer: cust })}
                        className="cursor-pointer h-8 w-8 rounded-md bg-[#D15616]/5 text-[#D15616] border border-[#D15616]/10 flex items-center justify-center hover:bg-[#D15616] hover:text-white transition-all duration-300 shadow-sm"
                        title="View Full Profile"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      <button
                        onClick={() => setEditModal({ isOpen: true, customer: cust })}
                        className="cursor-pointer h-8 w-8 rounded-md bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm"
                        title="Edit Customer Details"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cust._id, cust.userName)}
                        className="cursor-pointer h-8 w-8 rounded-md bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-95"
                        title="Delete Record"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="6" className="px-10 py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest pt-4">No upcoming services for this period.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ServiceModal
        isOpen={modalData.isOpen}
        customerName={modalData.customerName}
        serviceIndex={modalData.serviceIndex}
        isACMC={modalData.isACMC}
        initialData={modalData.initialData}
        onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleServiceSubmit}
      />

      <CustomerDetailsModal
        isOpen={detailsModal.isOpen}
        customer={detailsModal.customer}
        onClose={() => setDetailsModal({ isOpen: false, customer: null })}
        onEditService={handleEditService}
      />

      <EditCustomerModal
        isOpen={editModal.isOpen}
        customer={editModal.customer}
        onClose={() => setEditModal({ isOpen: false, customer: null })}
        onUpdate={handleEditUpdate}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        customerName={deleteConfirm.customerName}
        onClose={() => setDeleteConfirm({ isOpen: false, customerId: null, customerName: '' })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CustomerTable;
