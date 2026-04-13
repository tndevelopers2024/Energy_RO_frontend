import React from 'react';
import { createPortal } from 'react-dom';

const DailyServiceDetailModal = ({ isOpen, onClose, entry }) => {
    if (!isOpen || !entry) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getFullVisitType = (code) => {
        const types = {
            'MS': 'Mandatory Service',
            'CS': 'Contract Service',
            'C': 'Complaints',
            'SV': 'Site Visit',
            'RC': 'Regeneration Calls',
            'I': 'Installation',
            'CC': 'Contract Collection'
        };
        return types[code] || code || 'Regular';
    };

    const getFullStatus = (code) => {
        const statuses = {
            'IW': 'Inside Warranty',
            'IC': 'Inside Contract',
            'OW': 'Outside Warranty'
        };
        return statuses[code] || code || 'Pending';
    };

    const getFullResult = (code) => {
        const results = {
            'WC': 'Work Completed',
            'DL': 'Door Locked',
            'WA': 'Wrong Address',
            'PNS': 'Problem Not Solved',
            'P': 'Pending',
            'CA': 'Called Again'
        };
        return results[code] || code || 'N/A';
    };

    const handlePrint = () => {
        window.print();
    };

    const DetailSection = ({ label, value, icon, fullWidth }) => (
        <div className={`flex flex-col gap-1.5 p-4 bg-gray-50/50 rounded-md border border-gray-100/50 ${fullWidth ? 'col-span-full' : ''}`}>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {icon}
                {label}
            </span>
            <p className="text-sm font-bold text-gray-800">
                {value || 'N/A'}
            </p>
        </div>
    );

    const totalCharges = (entry.charges?.spares || 0) + (entry.charges?.visit || 0) + (entry.charges?.contracts || 0);

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto font-['Plus_Jakarta_Sans']">
            <div className="bg-white w-full max-w-2xl my-auto rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-[#F9783B] text-white rounded-md flex items-center justify-center shadow-lg shadow-orange-100">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Service Audit</h3>
                            <p className="text-[10px] text-[#F9783B] font-bold uppercase tracking-widest mt-0.5">
                                COMPLAINT #{entry.complaintNo} // DATE: {formatDate(entry.date)}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-md text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-7 space-y-6 max-h-[70vh] overflow-y-auto cursor-default">
                    {/* Engineer & Customer Core */}
                    <div className="grid grid-cols-2 gap-4">
                        <DetailSection label="Service Engineer" value={entry.engineerName} />
                        <DetailSection label="Branch" value={entry.branch} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <DetailSection label="Customer Name" value={entry.customerName} />
                        <DetailSection label="Phone Number" value={entry.phone} />
                        <DetailSection label="Address" value={entry.address} fullWidth />
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-3 gap-4">
                        <DetailSection label="Visit Type" value={getFullVisitType(entry.visitType)} />
                        <DetailSection label="Status" value={getFullStatus(entry.status)} />
                        <DetailSection label="Result" value={getFullResult(entry.result)} />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <DetailSection label="Product" value={entry.product} />
                        <DetailSection label="Work Details" value={entry.workDetails} fullWidth />
                        <DetailSection label="Spares Replaced" value={entry.sparesReplaced} fullWidth />
                    </div>

                    {/* Time & Receipt */}
                    <div className="grid grid-cols-2 gap-4">
                        <DetailSection label="Time Duration" value={`${entry.timeIn} - ${entry.timeOut}`} />
                        <div className="grid grid-cols-1 gap-4">
                            <DetailSection label="Receipt" value={entry.receiptNo ? `${entry.receiptNo} (${formatDate(entry.receiptDate)})` : 'N/A'} />
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-5 bg-emerald-50/50 rounded-md border border-emerald-100">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4 block">Charges Breakdown</span>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Spares</span>
                                <p className="text-sm font-black text-gray-700">₹{entry.charges?.spares || 0}</p>
                            </div>
                            <div className="flex flex-col border-l border-emerald-100 pl-4">
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Visit</span>
                                <p className="text-sm font-black text-gray-700">₹{entry.charges?.visit || 0}</p>
                            </div>
                            <div className="flex flex-col border-l border-emerald-100 pl-4">
                                <span className="text-[8px] font-bold text-gray-400 uppercase">Contracts</span>
                                <p className="text-sm font-black text-gray-700">₹{entry.charges?.contracts || 0}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Collected</span>
                            <span className="text-lg font-black text-emerald-700">₹{totalCharges}</span>
                        </div>
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
                        onClick={onClose}
                        className="cursor-pointer flex-[1.5] py-3.5 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        Close Detail
                    </button>
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
                                Date: {formatDate(entry.date)}
                            </div>
                        </div>
                    </div>

                    {/* Customer & System Detail */}
                    <div className="grid grid-cols-2 gap-12 mb-10">
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Customer Details</h4>
                            <div>
                                <p className="text-lg font-black text-gray-900 leading-none mb-1">{entry.customerName}</p>
                                <p className="text-sm font-bold text-gray-600 mb-2">{entry.phone}</p>
                                <p className="text-xs font-medium text-gray-500 leading-relaxed max-w-[250px]">
                                    {entry.address}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Technical Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Product Model</p>
                                    <p className="text-xs font-bold text-gray-800">{entry.product}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Service Type</p>
                                    <p className="text-xs font-bold text-gray-800">{getFullVisitType(entry.visitType)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Complaint Ref</p>
                                    <p className="text-xs font-bold text-gray-800">#{entry.complaintNo || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Status</p>
                                    <p className="text-xs font-bold text-gray-800">{getFullStatus(entry.status)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Work Description */}
                    <div className="mb-10">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2 mb-4">Work Performed & Parts Replaced</h4>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-h-[100px]">
                            <p className="text-sm font-bold text-gray-700 leading-relaxed mb-4 italic">
                                "{entry.workDetails}"
                            </p>
                            {entry.sparesReplaced && (
                                <div className="flex gap-2 items-center flex-wrap pt-4 border-t border-gray-100">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">Modified Components:</span>
                                    <span className="text-xs font-bold text-gray-800">{entry.sparesReplaced}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 gap-12 mb-10">
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-2">Log Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Engineer</p>
                                    <p className="text-xs font-bold text-gray-800">{entry.engineerName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Time Duration</p>
                                    <p className="text-xs font-bold text-gray-800">{entry.timeIn} - {entry.timeOut}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Result</p>
                                    <p className="text-xs font-bold text-gray-800">{getFullResult(entry.result)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Receipt No</p>
                                    <p className="text-xs font-bold text-gray-800">{entry.receiptNo || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-end pt-8 border-t-2 border-gray-900 mt-12">
                        <div className="w-[300px] space-y-3">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>Spares Charges</span>
                                <span className="text-gray-900">₹{entry.charges?.spares || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>Visit Charges</span>
                                <span className="text-gray-900">₹{entry.charges?.visit || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>Contracts Charges</span>
                                <span className="text-gray-900">₹{entry.charges?.contracts || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-black text-gray-900 pt-3 border-t border-gray-100">
                                <span className="uppercase tracking-widest text-xs">Net Payable</span>
                                <span className="text-2xl tracking-tighter">₹{totalCharges}.00</span>
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
            </div>
        </div>,
        document.body
    );
};

export default DailyServiceDetailModal;
