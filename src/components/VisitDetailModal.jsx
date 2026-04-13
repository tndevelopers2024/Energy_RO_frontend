import React from 'react';
import { createPortal } from 'react-dom';

const VisitDetailModal = ({ isOpen, onClose, report, serviceName, customer, onEdit }) => {
  if (!isOpen || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  const DetailSection = ({ label, value, icon }) => (
    <div className="flex flex-col gap-1.5 p-4 bg-gray-50/50 rounded-md border border-gray-100/50">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </span>
      <p className="text-sm font-bold text-gray-800">
        {value || 'N/A'}
      </p>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto font-['Plus_Jakarta_Sans']">
      <div className="bg-white w-full max-w-xl my-auto rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-600 text-white rounded-md flex items-center justify-center shadow-lg shadow-emerald-100">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Record Audit</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                {serviceName} // Timestamp: {new Date().getTime().toString().slice(-10)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-md text-gray-400 hover:text-gray-600 transition-all">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-7 space-y-6 max-h-[70vh] overflow-y-auto cursor-default">
          {/* Top Row: Date & Type */}
          <div className="grid grid-cols-2 gap-4">
            <DetailSection label="Visit Date" value={new Date(report.visitDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} />
            <DetailSection label="Operation Type" value={report.visitType} />
          </div>

          {/* TDS Levels */}
          <div className="grid grid-cols-2 gap-4 p-5 bg-[#D15616]/[0.02] rounded-md border border-[#D15616]/10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-[#D15616] uppercase tracking-widest">Source TDS</span>
              <p className="text-xl font-black text-gray-800">{report.tdsRaw} <span className="text-[10px] font-bold text-gray-400">PPM</span></p>
            </div>
            <div className="flex flex-col gap-1.5 border-l border-[#D15616]/10 pl-6">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Output TDS</span>
              <p className="text-xl font-black text-emerald-600">{report.tdsTreated} <span className="text-[10px] font-bold text-emerald-400">PPM</span></p>
            </div>
          </div>

          {/* Work Summary */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Work Description Log</span>
            <div className="p-5 bg-gray-50/50 rounded-md border border-gray-100 text-sm text-gray-600 leading-relaxed font-semibold">
              "{report.workDetails}"
            </div>
          </div>

          {/* Parts & Financials */}
          <div className="grid grid-cols-1 gap-4">
            <DetailSection label="Components Modified" value={report.partsReplaced} />
            <div className="grid grid-cols-2 gap-4">
              <DetailSection label="Reference INV" value={report.invoiceNo} />
              <div className="flex flex-col gap-1.5 p-4 bg-emerald-50 border border-emerald-100 rounded-md">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified Amount</span>
                <p className="text-lg font-black text-emerald-700">₹{report.amount}</p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">System Audit Remarks</span>
            <p className="text-sm font-bold text-gray-700 bg-gray-50/30 p-4 rounded-md border border-gray-100/50">
              {report.remarks || 'No additional remarks logged during this operation.'}
            </p>
          </div>
        </div>

        {/* --- PRINTABLE INVOICE TEMPLATE (Hidden from UI, visible in print) --- */}
        <div className="hidden print:block fixed inset-0 bg-white p-12 overflow-visible" id="print-area">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { margin: 0; }
              body { margin: 0; }
              body * { visibility: hidden; }
              #print-area, #print-area * { visibility: visible; }
              #print-area { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                margin: 0;
                padding: 1.5cm !important;
                background: white !important;
              }
              .print-no-break { break-inside: avoid; }
            }
          `}} />
          
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
            <div className="space-y-2">
              <img src="/energy-logo.png" alt="Energy Enterprises" className="h-16" />
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                Authorised Service Partner
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">SERVICE INVOICE</h1>
              <p className="text-xs font-bold text-gray-500">#{new Date().getTime().toString().slice(-8)}</p>
              <div className="mt-4 text-[10px] font-black uppercase text-gray-600 tracking-widest bg-gray-100 px-3 py-1.5 rounded inline-block">
                Date: {new Date(report.visitDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Customer & System Detail */}
          <div className="grid grid-cols-2 gap-12 mb-10">
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Customer Details</h4>
              <div>
                <p className="text-lg font-black text-gray-900 leading-none mb-1">{customer?.userName}</p>
                <p className="text-sm font-bold text-gray-600 mb-2">{customer?.mobileNumber}</p>
                <p className="text-xs font-medium text-gray-500 leading-relaxed max-w-[250px]">
                  {customer?.address}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Technical Info</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Product Model</p>
                  <p className="text-xs font-bold text-gray-800">{customer?.productNameAndModel}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Service Type</p>
                  <p className="text-xs font-bold text-gray-800">{serviceName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Order Ref</p>
                  <p className="text-xs font-bold text-gray-800">#{customer?.orderNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Visit Type</p>
                  <p className="text-xs font-bold text-gray-800">{report.visitType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Data Table */}
          <div className="mb-10 text-center">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2 text-left mb-4">Water Quality Analysis</h4>
            <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
              <div className="bg-gray-50 p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Source Water TDS</p>
                <p className="text-2xl font-black text-gray-900">{report.tdsRaw} <span className="text-xs text-gray-400">PPM</span></p>
              </div>
              <div className="bg-gray-50 p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Treated Water TDS</p>
                <p className="text-2xl font-black text-emerald-600">{report.tdsTreated} <span className="text-xs text-emerald-400 font-bold">PPM</span></p>
              </div>
            </div>
          </div>

          {/* Work Description */}
          <div className="mb-10">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2 mb-4">Work Performed & Parts Replaced</h4>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-h-[100px]">
              <p className="text-sm font-bold text-gray-700 leading-relaxed mb-4 italic">
                "{report.workDetails}"
              </p>
              {report.partsReplaced && (
                <div className="flex gap-2 items-center flex-wrap pt-4 border-t border-gray-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Modified Components:</span>
                  <span className="text-xs font-bold text-gray-800">{report.partsReplaced}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-8 border-t-2 border-gray-900 mt-12">
            <div className="w-[300px] space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                <span>Total Service Charges</span>
                <span className="text-gray-900">₹{report.amount}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-black text-gray-900 pt-3 border-t border-gray-100">
                <span className="uppercase tracking-widest text-xs">Net Payable</span>
                <span className="text-2xl tracking-tighter">₹{report.amount}.00</span>
              </div>
              <div className="pt-16 flex flex-col items-center">
                <div className="w-full border-b border-gray-300 mb-2"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Authorised Signature</p>
              </div>
            </div>
          </div>

          {/* Invoice Footer */}
          <div className="fixed bottom-12 left-12 right-12 text-center text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] opacity-40">
            Energy Enterprises • RO System Specialised Sales & Services • Customer Support: +91 95000 00864
          </div>
        </div>

        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-center gap-3">
          <button 
            onClick={handlePrint}
            className="cursor-pointer flex-1 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-emerald-100 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect><rect x="6" y="2" width="12" height="6"></rect></svg>
            Print Invoice
          </button>
          <button 
            onClick={onEdit}
            className="cursor-pointer flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-gray-100 flex items-center justify-center gap-2"
          >
            Edit Record
          </button>
          <button 
            onClick={onClose}
            className="cursor-pointer flex-[1.5] py-3.5 bg-[#D15616] hover:bg-[#b84a12] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-[#D15616]/10"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VisitDetailModal;
