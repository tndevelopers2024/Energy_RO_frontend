import React from 'react';
import { createPortal } from 'react-dom';

const VisitDetailModal = ({ isOpen, onClose, report, serviceName, onEdit }) => {
  if (!isOpen || !report) return null;

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

        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-center gap-4">
          <button 
            onClick={onEdit}
            className="cursor-pointer w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest rounded-md transition-all active:scale-95 border border-gray-200"
          >
            Edit Record
          </button>
          <button 
            onClick={onClose}
            className="cursor-pointer w-full py-4 bg-[#D15616] hover:bg-[#b84a12] text-white text-xs font-black uppercase tracking-widest rounded-md transition-all active:scale-95 shadow-xl shadow-[#D15616]/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VisitDetailModal;
