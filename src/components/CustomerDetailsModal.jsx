import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import VisitDetailModal from './VisitDetailModal';
import DateRangePicker from './DateRangePicker';
import API_BASE_URL from '../apiConfig';

const CustomerDetailsModal = ({ isOpen, onClose, customer, onEditService }) => {
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showAcmcConfirm, setShowAcmcConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [acmcActivationDate, setAcmcActivationDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerComplaints, setCustomerComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!customer?.mobileNumber) return;
      setLoadingComplaints(true);
      try {
        const [complaintsRes, dailyRes] = await Promise.all([
          fetch(`${API_BASE_URL}/complaints/customer/${customer.mobileNumber}`),
          fetch(`${API_BASE_URL}/daily-service/customer/${customer.mobileNumber}`)
        ]);
        const complaintsData = await complaintsRes.json();
        const dailyData = await dailyRes.json();
        
        let combined = [];
        
        if (complaintsData.success) {
          combined = [...combined, ...complaintsData.data.map(c => ({ ...c, type: 'complaint' }))];
        }
        
        if (dailyData.success) {
          combined = [...combined, ...dailyData.data.map(d => ({ ...d, type: 'service' }))];
        }
        
        combined.sort((a, b) => {
          const dateA = a.type === 'complaint' ? new Date(a.date) : new Date(a.entry.dateOfComplain || a.date);
          const dateB = b.type === 'complaint' ? new Date(b.date) : new Date(b.entry.dateOfComplain || b.date);
          return dateB - dateA;
        });

        setCustomerComplaints(combined);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoadingComplaints(false);
      }
    };
    
    if (isOpen) {
      fetchHistory();
    }
  }, [customer?.mobileNumber, isOpen]);


  if (!isOpen || !customer) return null;

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

  const serviceDates = calculateServiceDates(customer.dateOfInstallationOrService);
  const acmcDates = calculateAcmcDates(customer.acmcStartDate);

  const isWarrantyExpired = !customer.isACMC && serviceDates[2] && new Date() > serviceDates[2];
  const isAcmcCompletedOrExpired = customer.isACMC && (
    (new Date() > new Date(customer.acmcExpiryDate)) || 
    (customer.acmcServicesCompleted?.length === 3 && customer.acmcServicesCompleted.every(status => status === true))
  );

  const handleActivateACMC = () => {
    setShowAcmcConfirm(true);
  };

  const handleCancelACMC = () => {
    setShowCancelConfirm(true);
  };

  const executeAcmcCancellation = async () => {
    setShowCancelConfirm(false);
    setIsCancelling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customer._id}/acmc/cancel`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to cancel ACMC", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const executeAcmcActivation = async () => {
    setShowAcmcConfirm(false);
    setIsActivating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customer._id}/acmc/activate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startDate: acmcActivationDate })
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to activate ACMC", error);
    } finally {
      setIsActivating(false);
    }
  };

  const DetailItem = ({ label, value, icon, fullWidth }) => (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'col-span-full' : ''}`}>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </span>
      <p className="text-sm font-bold text-gray-800 bg-gray-50/50 px-4 py-2.5 rounded-lg border border-gray-100/50">
        {value || 'Not provided'}
      </p>
    </div>
  );

  const ServiceCard = ({ idx, isCompleted, report, date, isACMC }) => (
    <div
      onClick={() => isCompleted && setSelectedVisit({ report, name: `${isACMC ? 'ACMC' : 'Warranty'} Service S${idx + 1}`, index: idx, isACMC })}
      className={`p-5 rounded-2xl border transition-all relative group ${isCompleted
        ? 'bg-emerald-50/30 border-emerald-100/50 shadow-sm shadow-emerald-100/20 cursor-pointer hover:border-emerald-300 hover:shadow-emerald-200/40 hover:-translate-y-1'
        : 'bg-gray-50/30 border-gray-100 shadow-sm'
        }`}
    >
      {isCompleted && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 rounded-full p-1 text-white shadow-lg">
          <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="4" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${isCompleted ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'bg-gray-200 text-gray-500'}`}>
          {isACMC ? 'ACMC' : 'Service'} S{idx + 1}
        </span>
        {isCompleted ? (
          <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in duration-500">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="4" fill="none"><path d="M20 6L9 17l-5-5"></path></svg>
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className={isCompleted && report?.visitDate ? "grid grid-cols-2 gap-2" : ""}>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Est. Date</p>
            <p className={`font-bold ${isCompleted && report?.visitDate ? 'text-xs text-gray-500' : 'text-sm text-gray-700'}`}>
              {date?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {isCompleted && report?.visitDate && (
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Visit Date</p>
              <p className="text-[12px] font-bold text-emerald-700">
                {new Date(report.visitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {isCompleted && report ? (
          <div className="pt-3 border-t border-emerald-100/50 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">TDS Raw</p>
                <p className="text-xs font-bold text-gray-700">{report.tdsRaw || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">TDS Treated</p>
                <p className="text-xs font-bold text-emerald-600">{report.tdsTreated || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Work Summary</p>
              <p className="text-[11px] font-bold text-gray-600 leading-relaxed truncate">{report.workDetails || 'Maintenance check complete'}</p>
              <p className="text-[8px] font-bold text-emerald-600 mt-1 uppercase group-hover:underline">Click to see full report →</p>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400">Service not yet performed</p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto font-['Plus_Jakarta_Sans']">
        <div className="bg-white w-full max-w-3xl my-auto rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg ${customer.isACMC ? 'bg-emerald-600 shadow-emerald-200' : 'bg-[#D15616] shadow-[#D15616]/20'}`}>
                {customer.userName?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{customer.userName}</h3>
                  {customer.isACMC && !isAcmcCompletedOrExpired && (
                    <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] shadow-sm animate-pulse">ACMC Active</span>
                  )}
                  {customer.isACMC && isAcmcCompletedOrExpired && (
                    <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] shadow-sm">ACMC Expired</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Customer Profile & Service History
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {customer.isACMC && !isAcmcCompletedOrExpired && (
                <button
                  onClick={handleCancelACMC}
                  disabled={isCancelling}
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-widest border border-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel ACMC'}
                  {!isCancelling && <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                </button>
              )}
              {isAcmcCompletedOrExpired && (
                <button
                  onClick={handleActivateACMC}
                  disabled={isActivating}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-widest border border-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isActivating ? 'Renewing...' : 'Renew ACMC'}
                  {!isActivating && <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none"><path d="M12 2v20M2 12h20"></path></svg>}
                </button>
              )}
              {isWarrantyExpired && (
                <button
                  onClick={handleActivateACMC}
                  disabled={isActivating}
                  className="bg-[#D15616] hover:bg-[#b84a12] text-white text-[9px] font-black px-4 py-2.5 rounded-lg uppercase tracking-widest shadow-xl shadow-[#D15616]/10 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isActivating ? 'Activating...' : 'Activate ACMC'}
                  {!isActivating && <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none"><path d="M12 2v20M2 12h20"></path></svg>}
                </button>
              )}
              <button onClick={onClose} className="p-2 ml-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Section 1: Contact & Registration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D15616]"></span>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Registered Details</h4>
                {isWarrantyExpired && (
                  <span className="ml-auto text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-red-500 animate-ping"></span>
                    Warranty Expired
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Mobile Number" value={customer.mobileNumber} />
                {customer.alternateMobileNumber && <DetailItem label="Alternate Mobile" value={customer.alternateMobileNumber} />}
                <DetailItem label="Email Address" value={customer.email} />
                <DetailItem label="Installation Address" value={customer.address} fullWidth />
                <DetailItem label="Product & Model" value={customer.productNameAndModel} />
                <DetailItem label="Order ID" value={customer.orderNo ? `ORD #${customer.orderNo}` : ''} />
                <DetailItem label="Installation Date" value={customer.dateOfInstallationOrService ? new Date(customer.dateOfInstallationOrService).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending'} />
                <DetailItem label="Card Number" value={customer.cardNumber} />
                {customer.unitSerialNumber && <DetailItem label="Unit Serial No" value={customer.unitSerialNumber} />}
                {customer.occupation && <DetailItem label="Occupation" value={customer.occupation} />}
                {customer.dob && <DetailItem label="Date of Birth" value={new Date(customer.dob).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} />}
                {customer.weddingAnniversary && <DetailItem label="Wedding Anniversary" value={new Date(customer.weddingAnniversary).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} />}
                {customer.locationLink && (
                  <div className="flex flex-col gap-1.5 col-span-full">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      Location Map Link
                    </span>
                    <a href={customer.locationLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-500 hover:text-blue-600 hover:underline bg-gray-50/50 px-4 py-2.5 rounded-lg border border-gray-100/50 break-all block">
                      {customer.locationLink}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Warranty Service History */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Warranty Cycle (Year 1)</h4>
                </div>
                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  {customer.servicesCompleted?.filter(v => v).length} of 3 Complete
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[0, 1, 2].map((idx) => (
                  <ServiceCard
                    key={idx}
                    idx={idx}
                    isCompleted={customer.servicesCompleted?.[idx]}
                    report={customer.serviceReports?.[idx]}
                    date={serviceDates[idx]}
                    isACMC={false}
                  />
                ))}
              </div>
            </div>

            {/* Section 3: ACMC History (If Active) */}
            {customer.isACMC && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">ACMC Cycle (Year 2+)</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Ends: {new Date(customer.acmcExpiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      {customer.acmcServicesCompleted?.filter(v => v).length} of 3 Complete
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[0, 1, 2].map((idx) => (
                    <ServiceCard
                      key={idx}
                      idx={idx}
                      isCompleted={customer.acmcServicesCompleted?.[idx]}
                      report={customer.acmcServiceReports?.[idx]}
                      date={acmcDates[idx]}
                      isACMC={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Complaint History */}
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Service & Complaint History</h4>
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {customerComplaints.length} Records
                </span>
              </div>

              {loadingComplaints ? (
                <div className="text-center py-4 text-xs font-bold text-gray-400 animate-pulse">Loading Complaints...</div>
              ) : customerComplaints.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                  <p className="text-xs font-bold text-gray-400">No complaints registered for this customer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerComplaints.map((item) => {
                    if (item.type === 'complaint') {
                      return (
                        <div key={item._id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col md:flex-row md:items-start gap-4 hover:border-blue-200 transition-colors">
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              item.status === 'Fixed' ? 'bg-emerald-100 text-emerald-600' :
                              item.status === 'Process' ? 'bg-blue-100 text-blue-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {item.status === 'Fixed' ? (
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              ) : item.status === 'Process' ? (
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                              )}
                            </div>
                            <div className="h-full w-px bg-gray-100 my-2 md:block hidden min-h-[40px]"></div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                <h5 className="text-sm font-bold text-gray-800 mt-1 whitespace-pre-line">{item.complaintDetails}</h5>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ml-4 shrink-0 ${
                                item.status === 'Fixed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                item.status === 'Process' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            
                            {item.remarks && (
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Office Remarks</p>
                                <p className="text-xs font-semibold text-gray-600 whitespace-pre-line">{item.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={item._id} className="p-4 rounded-xl border border-gray-100 bg-orange-50/20 shadow-sm flex flex-col md:flex-row md:items-start gap-4 hover:border-orange-200 transition-colors">
                          <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs bg-orange-100 text-[#D15616]">
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </div>
                            <div className="h-full w-px bg-gray-100 my-2 md:block hidden min-h-[40px]"></div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  {new Date(item.entry.dateOfComplain || item.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                  <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                                  {item.engineerName}
                                </p>
                                <h5 className="text-sm font-bold text-gray-800 mt-1 whitespace-pre-line">{item.entry.workDetails || 'Maintenance Service'}</h5>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                                  item.entry.initialStatus?.toUpperCase() === 'FIXED' || item.entry.initialStatus?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  item.entry.initialStatus?.toUpperCase() === 'PROCESS' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  'bg-gray-50 text-gray-600 border-gray-100'
                                }`}>
                                  {item.entry.initialStatus || 'Daily Service'}
                                </span>
                              </div>
                            </div>
                            
                            {item.entry.sparesReplaced && (
                              <div className="bg-white p-3 rounded-lg border border-orange-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Spares Replaced</p>
                                <p className="text-xs font-semibold text-gray-600 whitespace-pre-line">
                                  {item.entry.sparesReplaced}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center sticky bottom-0 bg-white">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Energy Enterprises Records System</p>
            <button
              onClick={onClose}
              className="cursor-pointer px-8 py-2.5 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>

      <VisitDetailModal
        isOpen={!!selectedVisit}
        report={selectedVisit?.report}
        serviceName={selectedVisit?.name}
        customer={customer}
        onClose={() => setSelectedVisit(null)}
        onEdit={() => {
          onEditService(customer._id, selectedVisit.index, selectedVisit.isACMC, selectedVisit.report);
          setSelectedVisit(null);
        }}
      />

      {showAcmcConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans']">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path><circle cx="12" cy="12" r="2"></circle></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Activate / Renew ACMC</h3>
              <p className="text-sm font-semibold text-gray-500">
                This will jumpstart a new 1-year service cycle. Please select the start date:
              </p>
              
              <div className="mt-6 space-y-3 text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Activation Date <span className="text-[#D15616]">*</span></p>
                <div className="relative">
                  <DateRangePicker 
                    isSingle={true}
                    startDate={acmcActivationDate}
                    onRangeSelect={(start) => setAcmcActivationDate(start ? start.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}
                  />
                </div>
                <div className="flex items-center gap-2 px-1 pt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                    Cycle ends: {new Date(new Date(acmcActivationDate).setFullYear(new Date(acmcActivationDate).getFullYear() + 1)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowAcmcConfirm(false)}
                className="cursor-pointer flex-1 py-3 bg-white text-gray-700 text-xs font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeAcmcActivation}
                className="cursor-pointer flex-1 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans']">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"></path></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Terminate ACMC?</h3>
              <p className="text-sm font-semibold text-gray-500">
                Are you sure you want to cancel this customer's ACMC? This action will stop the current service cycle.
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="cursor-pointer flex-1 py-3 bg-white text-gray-700 text-xs font-black uppercase tracking-widest rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Go Back
              </button>
              <button
                onClick={executeAcmcCancellation}
                className="cursor-pointer flex-1 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
              >
                Cancel ACMC
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default CustomerDetailsModal;
