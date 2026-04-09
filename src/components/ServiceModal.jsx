import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import DateRangePicker from './DateRangePicker';

const ServiceModal = ({ isOpen, onClose, onSubmit, customerName, serviceIndex, isACMC, initialData }) => {
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    visitType: '',
    tdsRaw: '',
    tdsTreated: '',
    workDetails: '',
    partsReplaced: '',
    invoiceNo: '',
    amount: '',
    remarks: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          visitDate: initialData.visitDate ? new Date(initialData.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          visitType: initialData.visitType || (isACMC ? 'ACMC Service' : 'Regular Service'),
          tdsRaw: initialData.tdsRaw || '',
          tdsTreated: initialData.tdsTreated || '',
          workDetails: initialData.workDetails || '',
          partsReplaced: initialData.partsReplaced || '',
          invoiceNo: initialData.invoiceNo || '',
          amount: initialData.amount || '',
          remarks: initialData.remarks || ''
        });
      } else {
        setFormData({
          visitDate: new Date().toISOString().split('T')[0],
          visitType: isACMC ? 'ACMC Service' : 'Regular Service',
          tdsRaw: '',
          tdsTreated: '',
          workDetails: '',
          partsReplaced: '',
          invoiceNo: '',
          amount: '',
          remarks: ''
        });
      }
    }
  }, [isOpen, initialData, isACMC]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto font-['Plus_Jakarta_Sans']">
      <div className="bg-white w-full max-w-2xl my-auto rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="sticky top-0 z-10 px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/95 backdrop-blur-md">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Visit Service Report</h3>
            <p className="text-[10px] text-[#D15616] font-bold uppercase tracking-widest mt-1">
              {initialData ? 'Update Record' : 'New Record'} | Customer: {customerName} | Service: {isACMC ? 'A-S' : 'S'}{serviceIndex + 1}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DateRangePicker 
              label="Visit Date"
              isSingle={true}
              startDate={formData.visitDate}
              onRangeSelect={(start) => {
                setFormData(prev => ({ 
                  ...prev, 
                  visitDate: start ? start.toISOString().split('T')[0] : '' 
                }));
              }}
            />
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Visit Type</label>
              <input 
                type="text" 
                name="visitType"
                placeholder="e.g. Regular, Warranty"
                value={formData.visitType}
                onChange={handleChange}
                className="px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[#D15616]/[0.02] rounded-xl border border-gray-100/80">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-[#D15616] uppercase tracking-widest pl-1">TDS (Raw Water)</label>
                <input 
                  type="text" 
                  name="tdsRaw"
                  placeholder="ppm or mg/L"
                  value={formData.tdsRaw}
                  onChange={handleChange}
                  className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-[#D15616] uppercase tracking-widest pl-1">TDS (Treated Water)</label>
                <input 
                  type="text" 
                  name="tdsTreated"
                  placeholder="ppm or mg/L"
                  value={formData.tdsTreated}
                  onChange={handleChange}
                  className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Details of Work Performed</label>
              <textarea 
                name="workDetails"
                rows="3"
                placeholder="List all maintenance activities here..."
                value={formData.workDetails}
                onChange={handleChange}
                className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all resize-none shadow-inner"
              ></textarea>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Parts Replaced</label>
              <input 
                type="text" 
                name="partsReplaced"
                placeholder="e.g. RO Membrane, Pre-filter"
                value={formData.partsReplaced}
                onChange={handleChange}
                className="px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">INV #</label>
                <input 
                  type="text" 
                  name="invoiceNo"
                  placeholder="No."
                  value={formData.invoiceNo}
                  onChange={handleChange}
                  className="px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Total (₹)</label>
                <input 
                  type="text" 
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className="px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Customer Feedback / Remarks</label>
              <textarea 
                name="remarks"
                rows="2"
                placeholder="Customer feedback or technician notes..."
                value={formData.remarks}
                onChange={handleChange}
                className="px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all resize-none shadow-inner"
              ></textarea>
            </div>
          </div>

          <div className="pt-7 pb-2 flex justify-end gap-5">
            <button 
              type="button"
              onClick={onClose}
              className="cursor-pointer px-6 py-2.5 text-[12px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              Discard
            </button>
            <button 
              type="submit"
              className="cursor-pointer px-10 py-3 bg-[#D15616] hover:bg-[#b84a12] text-white text-[12px] font-black uppercase tracking-widest rounded-md shadow-xl shadow-[#D15616]/10 transition-all active:scale-95 group flex items-center gap-2"
            >
              {initialData ? 'Update' : 'Submit'}
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ServiceModal;
