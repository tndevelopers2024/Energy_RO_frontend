import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';
import DateRangePicker from './DateRangePicker';

const DailyComplaints = () => {
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'records'
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Autocomplete suggestions state
  const [showCustSuggestions, setShowCustSuggestions] = useState(false);
  
  // Edit, Delete, View states
  const [editModal, setEditModal] = useState({ isOpen: false, complaint: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, customerName: '' });
  const [viewModal, setViewModal] = useState({ isOpen: false, complaint: null });

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    mobileNumber: '',
    complaintDetails: '',
    status: 'Pending',
    remarks: ''
  });

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [complaintsRes, customersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/complaints`),
        axios.get(`${API_BASE_URL}/customers`)
      ]);
      
      if (complaintsRes.data.success) {
        setComplaints(complaintsRes.data.data);
      }
      if (customersRes.data.success) {
        setCustomers(customersRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectCustomer = (cust) => {
    setFormData(prev => ({
      ...prev,
      customerName: cust.userName || '',
      mobileNumber: cust.mobileNumber || ''
    }));
    setShowCustSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.mobileNumber || !formData.complaintDetails) {
      setMessage({ type: 'error', text: 'Please fill in Name, Mobile, and Complaint Details' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post(`${API_BASE_URL}/complaints`, formData);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Complaint registered successfully!' });
        setFormData({
          date: new Date().toISOString().split('T')[0],
          customerName: '',
          mobileNumber: '',
          complaintDetails: '',
          status: 'Pending',
          remarks: ''
        });
        
        // Refresh complaints
        const updatedComplaints = await axios.get(`${API_BASE_URL}/complaints`);
        if (updatedComplaints.data.success) {
          setComplaints(updatedComplaints.data.data);
        }

        setTimeout(() => {
          setActiveTab('records');
          setMessage({ type: '', text: '' });
        }, 1200);
      }
    } catch (error) {
      console.error('Error adding complaint:', error);
      setMessage({ type: 'error', text: 'Failed to register complaint. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/complaints/${id}`, { status: newStatus });
      if (res.data.success) {
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { _id, customerName, mobileNumber, complaintDetails, status, remarks } = editModal.complaint;
    try {
      const res = await axios.patch(`${API_BASE_URL}/complaints/${_id}`, {
        customerName,
        mobileNumber,
        complaintDetails,
        status,
        remarks
      });
      if (res.data.success) {
        setComplaints(prev => prev.map(c => c._id === _id ? res.data.data : c));
        setEditModal({ isOpen: false, complaint: null });
      }
    } catch (error) {
      console.error('Error editing complaint:', error);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ isOpen: true, id, customerName: name });
  };

  const executeDelete = async () => {
    const { id } = deleteConfirm;
    try {
      const res = await axios.delete(`${API_BASE_URL}/complaints/${id}`);
      if (res.data.success) {
        setComplaints(prev => prev.filter(c => c._id !== id));
        setDeleteConfirm({ isOpen: false, id: null, customerName: '' });
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
    }
  };

  // Filter complaints based on Search, Status & Date Range Tab
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (startDate) {
      result = result.filter(c => new Date(c.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(c => new Date(c.date) <= end);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      
      const matchingCustomerMobiles = customers
        .filter(cust => cust.cardNumber?.toLowerCase().includes(term))
        .map(cust => cust.mobileNumber);

      result = result.filter(c => 
        c.customerName?.toLowerCase().includes(term) ||
        c.mobileNumber?.includes(term) ||
        c.complaintDetails?.toLowerCase().includes(term) ||
        matchingCustomerMobiles.includes(c.mobileNumber)
      );
    }

    return result;
  }, [complaints, searchTerm, statusFilter, startDate, endDate, customers]);

  // Customer suggestions list matching database
  const customerSuggestions = useMemo(() => {
    const term = formData.customerName.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(c => 
      c.userName?.toLowerCase().includes(term) ||
      c.mobileNumber?.includes(term) ||
      c.cardNumber?.toLowerCase().includes(term)
    );
  }, [customers, formData.customerName]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-lg border border-gray-100 shadow-sm font-['Plus_Jakarta_Sans']">
        <div className="h-10 w-10 border-4 border-[#D15616]/10 border-t-[#D15616] rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Complaints Database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-['Plus_Jakarta_Sans']">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('form')}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === 'form'
              ? 'bg-white text-[#D15616] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Entry Form
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === 'records'
              ? 'bg-white text-[#D15616] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          View History
        </button>
      </div>

      {activeTab === 'form' ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="border-b border-gray-50 pb-4 mb-4">
            <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Log New Complaint</h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Enter details to record a new customer issue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Date of Complaint</label>
              <DateRangePicker
                isSingle={true}
                startDate={formData.date}
                onRangeSelect={(start) => {
                  setFormData(prev => ({ ...prev, date: start ? start.toISOString().split('T')[0] : '' }));
                }}
              />
            </div>

            {/* Status Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Initial Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-4 focus:ring-[#D15616]/5 font-bold text-gray-700 outline-none transition-all cursor-pointer"
              >
                <option value="Pending">Pending (Not Started)</option>
                <option value="Process">In Process</option>
                <option value="Fixed">Fixed (Resolved)</option>
              </select>
            </div>

            {/* Customer Name input with dropdown autocomplete */}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Customer Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                onFocus={() => setShowCustSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCustSuggestions(false), 250)}
                placeholder="Search & Select Customer"
                className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-4 focus:ring-[#D15616]/5 font-bold text-gray-700 outline-none transition-all"
                autoComplete="off"
              />
              {/* Autocomplete Suggestions */}
              {showCustSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute z-[100] left-0 right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="px-4 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Select Customer</p>
                  {customerSuggestions.map(cust => (
                    <button
                      key={cust._id}
                      type="button"
                      onMouseDown={() => handleSelectCustomer(cust)}
                      className="w-full px-4 py-3 text-left hover:bg-[#D15616]/5 text-xs font-bold text-gray-700 hover:text-[#D15616] flex items-center justify-between border-b border-gray-50/50 last:border-none transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-900 font-bold">{cust.userName}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">{cust.mobileNumber}</span>
                      </div>
                      <span className="text-[9px] font-black text-[#D15616] bg-[#D15616]/5 px-2 py-1 rounded-md uppercase">Card: {cust.cardNumber}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Mobile Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="Enter Mobile Number"
                className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-4 focus:ring-[#D15616]/5 font-bold text-gray-700 outline-none transition-all"
              />
            </div>
          </div>

          {/* Complaint Details */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Complaint Details <span className="text-red-500">*</span></label>
            <textarea
              name="complaintDetails"
              value={formData.complaintDetails}
              onChange={handleInputChange}
              rows="3"
              placeholder="Provide a detailed description of the customer complaint/issue..."
              className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-4 focus:ring-[#D15616]/5 font-semibold text-gray-700 outline-none transition-all resize-none"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Office Remarks (Optional)</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows="2"
              placeholder="Internal office notes, assignment details, etc..."
              className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-4 focus:ring-[#D15616]/5 font-semibold text-gray-700 outline-none transition-all resize-none"
            />
          </div>

          {/* Action Row */}
          <div className="pt-4 flex items-center justify-between border-t border-gray-100 bg-white">
            <div>
              {message.text && (
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                  {message.text}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2.5 px-8 py-3.5 bg-[#D15616] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all transform hover:-translate-y-0.5 shadow-xl shadow-orange-950/10 cursor-pointer disabled:opacity-50`}
            >
              {submitting ? 'Registering...' : 'Register Complaint'}
              {!submitting && (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="4">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Filtering and search toolbar */}
          <div className="p-8 border-b border-gray-50 bg-gray-50/10 flex flex-col xl:flex-row gap-6 justify-between">
            {/* Tabs for status */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100/50 rounded-lg w-fit overflow-x-auto whitespace-nowrap">
              {[
                { id: 'all', label: 'All Complaints' },
                { id: 'pending', label: 'Pending' },
                { id: 'process', label: 'In Process' },
                { id: 'fixed', label: 'Fixed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`cursor-pointer px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-[#D15616] shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
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
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#D15616] transition-colors" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search Name, Phone, Card..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-lg pl-11 pr-5 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none placeholder:text-gray-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-[9px]"
                />
              </div>

              {/* Date Range Picker */}
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeSelect={(start, end) => {
                  setStartDate(start ? start.toISOString().split('T')[0] : '');
                  setEndDate(end ? end.toISOString().split('T')[0] : '');
                }}
              />
              
              {(searchTerm || startDate || endDate || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStartDate('');
                    setEndDate('');
                    setStatusFilter('all');
                  }}
                  className="cursor-pointer text-[10px] font-black text-gray-400 hover:text-[#D15616] uppercase tracking-widest transition-colors flex items-center gap-1.5 px-3 py-2 hover:bg-[#D15616]/5 rounded-md shrink-0"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-gray-100">
                  <th className="px-8 py-5 min-w-[120px]">Date</th>
                  <th className="px-8 py-5 min-w-[150px]">Customer Name</th>
                  <th className="px-8 py-5 min-w-[120px]">Mobile Number</th>
                  <th className="px-8 py-5 min-w-[220px]">Complaint Details</th>
                  <th className="px-8 py-5 text-center min-w-[140px]">Status</th>
                  <th className="px-8 py-5 min-w-[180px]">Office Remarks</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-45">
                        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="9" y1="9" x2="15" y2="9"></line>
                          <line x1="9" y1="13" x2="15" y2="13"></line>
                          <line x1="9" y1="17" x2="13" y2="17"></line>
                        </svg>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500 pt-2">No complaints logged matching this filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5 text-xs font-bold text-gray-700 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-900">
                        {item.customerName}
                      </td>
                      <td className="px-8 py-5 text-xs font-semibold text-gray-600">
                        {item.mobileNumber}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-semibold text-gray-600 leading-relaxed max-w-sm whitespace-pre-line line-clamp-2">{item.complaintDetails}</p>
                      </td>
                      <td className="px-8 py-5 text-center whitespace-nowrap">
                        <StatusDropdown
                          status={item.status}
                          onChange={(newStatus) => handleStatusChange(item._id, newStatus)}
                        />
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-semibold text-gray-500 italic max-w-xs line-clamp-2">{item.remarks || '-'}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewModal({ isOpen: true, complaint: item })}
                            className="cursor-pointer h-8 w-8 rounded-md bg-[#D15616]/5 text-[#D15616] border border-[#D15616]/10 flex items-center justify-center hover:bg-[#D15616] hover:text-white transition-all duration-300 shadow-sm"
                            title="View Full Details"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          <button
                            onClick={() => setEditModal({ isOpen: true, complaint: { ...item } })}
                            className="cursor-pointer h-8 w-8 rounded-md bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm"
                            title="Edit Complaint"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item._id, item.customerName)}
                            className="cursor-pointer h-8 w-8 rounded-md bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-95"
                            title="Delete Complaint Record"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Complaint Modal */}
      {editModal.isOpen && editModal.complaint && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto font-['Plus_Jakarta_Sans']">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Edit Complaint Details</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Modify record for {editModal.complaint.customerName}</p>
              </div>
              <button 
                onClick={() => setEditModal({ isOpen: false, complaint: null })}
                className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-[#D15616] tracking-widest">Customer Name</label>
                <input
                  type="text"
                  value={editModal.complaint.customerName}
                  onChange={(e) => setEditModal({
                    ...editModal,
                    complaint: { ...editModal.complaint, customerName: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#D15616] outline-none font-bold text-sm text-gray-700 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-[#D15616] tracking-widest">Mobile Number</label>
                <input
                  type="text"
                  value={editModal.complaint.mobileNumber}
                  onChange={(e) => setEditModal({
                    ...editModal,
                    complaint: { ...editModal.complaint, mobileNumber: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#D15616] outline-none font-bold text-sm text-gray-700 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-[#D15616] tracking-widest">Status</label>
                <select
                  value={editModal.complaint.status}
                  onChange={(e) => setEditModal({
                    ...editModal,
                    complaint: { ...editModal.complaint, status: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#D15616] outline-none font-bold text-sm text-gray-700 transition-all cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Process">Process</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-[#D15616] tracking-widest">Complaint Details</label>
                <textarea
                  value={editModal.complaint.complaintDetails}
                  onChange={(e) => setEditModal({
                    ...editModal,
                    complaint: { ...editModal.complaint, complaintDetails: e.target.value }
                  })}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#D15616] outline-none font-semibold text-sm text-gray-700 transition-all resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-[#D15616] tracking-widest">Office Remarks</label>
                <textarea
                  value={editModal.complaint.remarks}
                  onChange={(e) => setEditModal({
                    ...editModal,
                    complaint: { ...editModal.complaint, remarks: e.target.value }
                  })}
                  rows="2"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#D15616] outline-none font-semibold text-sm text-gray-700 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, complaint: null })}
                  className="cursor-pointer flex-1 py-3 bg-white text-gray-700 text-xs font-black uppercase tracking-widest rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer flex-1 py-3 bg-[#D15616] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-950/10 hover:brightness-110 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans']">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Delete Complaint Record?</h3>
              <p className="text-sm font-semibold text-gray-500">
                Are you sure you want to permanently delete the complaint record for <span className="font-bold text-gray-800">{deleteConfirm.customerName}</span>?
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, id: null, customerName: '' })}
                className="cursor-pointer flex-1 py-3 bg-white text-gray-700 text-xs font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Go Back
              </button>
              <button
                onClick={executeDelete}
                className="cursor-pointer flex-1 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Complaint Modal */}
      {viewModal.isOpen && viewModal.complaint && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans']">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Complaint Details</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Record for {viewModal.complaint.customerName}</p>
              </div>
              <button 
                onClick={() => setViewModal({ isOpen: false, complaint: null })}
                className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#D15616]">Complaint Details</p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm font-semibold text-gray-700 whitespace-pre-line leading-relaxed">
                  {viewModal.complaint.complaintDetails}
                </div>
              </div>
              {viewModal.complaint.remarks && (
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#D15616]">Office Remarks</p>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm font-semibold text-gray-600 italic whitespace-pre-line leading-relaxed">
                    {viewModal.complaint.remarks}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-100">
              <button
                onClick={() => setViewModal({ isOpen: false, complaint: null })}
                className="cursor-pointer w-full py-3 bg-white text-gray-700 text-xs font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- Custom Stylish Dropdown for Status Selection ---
const StatusDropdown = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    // Catch scroll event on capture phase from the scrollable <main> container
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const options = [
    { 
      value: 'Pending', 
      label: 'Pending', 
      color: 'text-red-600 hover:bg-red-50/50', 
      icon: (
        <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" className="flex-shrink-0">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ) 
    },
    { 
      value: 'Process', 
      label: 'In Process', 
      color: 'text-blue-700 hover:bg-blue-50/50', 
      icon: (
        <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2.5" fill="none" className="flex-shrink-0">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ) 
    },
    { 
      value: 'Fixed', 
      label: 'Fixed', 
      color: 'text-green-700 hover:bg-green-50/50', 
      icon: (
        <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="3" fill="none" className="flex-shrink-0">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) 
    }
  ];

  const currentOption = options.find(o => o.value === status) || options[0];

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
        zIndex: 9999
      });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`cursor-pointer px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider outline-none border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap flex-nowrap w-max mx-auto ${
          status === 'Fixed'
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50'
            : status === 'Process'
              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100/50'
        }`}
      >
        <span>{currentOption.icon}</span>
        <span>{currentOption.label}</span>
        <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="w-32 bg-white border border-gray-100 rounded-xl shadow-2xl py-1.5 z-[10000] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${opt.color}`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default DailyComplaints;
