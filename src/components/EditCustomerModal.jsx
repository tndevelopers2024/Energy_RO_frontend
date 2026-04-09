import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProductDropdown from './ProductDropdown';
import DateRangePicker from './DateRangePicker';

const EditCustomerModal = ({ isOpen, customer, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    userName: '',
    mobileNumber: '',
    address: '',
    email: '',
    productNameAndModel: '',
    cardNumber: '',
    dateOfInstallationOrService: '',
    orderNo: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (customer) {
      setErrorMsg('');
      setFormData({
        userName: customer.userName || '',
        mobileNumber: customer.mobileNumber || '',
        address: customer.address || '',
        email: customer.email || '',
        productNameAndModel: customer.productNameAndModel || '',
        cardNumber: customer.cardNumber || '',
        dateOfInstallationOrService: customer.dateOfInstallationOrService ? new Date(customer.dateOfInstallationOrService).toISOString().split('T')[0] : '',
        orderNo: customer.orderNo || ''
      });
    }
  }, [customer]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await onUpdate(customer._id, formData);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while updating the form');
    }
    setLoading(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#FEFAF8] rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-100 my-auto">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-[#D15616]/10 text-[#D15616] flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </span>
              Update Customer Details
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Editing UID: {customer?._id?.slice(-6).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="3" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {errorMsg && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-md text-xs font-bold border border-red-100 flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-red-600 rounded-full"></span>
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                required
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-200 focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
              <input
                type="text"
                required
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-200 focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm"
              />
            </div>

            {/* Product & Model */}
            <ProductDropdown
              label="Product & Model"
              value={formData.productNameAndModel}
              onChange={(e) => setFormData({ ...formData, productNameAndModel: e.target.value })}
            />

            {/* Card Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Card/Serial Number</label>
              <input
                type="text"
                required
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-200 focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-200 focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm"
              />
            </div>

            {/* Transaction Date */}
            <DateRangePicker
              label="Transaction Date"
              isSingle={true}
              startDate={formData.dateOfInstallationOrService}
              onRangeSelect={(start) => {
                setFormData(prev => ({
                  ...prev,
                  dateOfInstallationOrService: start ? start.toISOString().split('T')[0] : ''
                }));
              }}
            />

            {/* Address - Full Width */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mailing Address</label>
              <textarea
                rows="3"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-gray-200 focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm resize-none"
              ></textarea>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-md border border-gray-200 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-md bg-[#D15616] text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#D15616]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditCustomerModal;
