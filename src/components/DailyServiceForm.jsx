import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';
import DailyServiceRecords from './DailyServiceRecords';
import TimePicker from './TimePicker';
import VisitTypeSelect from './VisitTypeSelect';
import CodeSelect from './CodeSelect';
import ProductSelect from './ProductSelect';
import DateRangePicker from './DateRangePicker';
import ServiceEntryModal from './ServiceEntryModal';


const DailyServiceForm = () => {
    const [header, setHeader] = useState({
        date: new Date().toISOString().split('T')[0],
        engineerName: localStorage.getItem('last_engineer_name') || '',
        branch: localStorage.getItem('last_branch') || ''
    });

    const [entries, setEntries] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('form'); // 'form' or 'records'
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [metadata, setMetadata] = useState({ engineers: [], branches: [] });
    const [showEngSuggestions, setShowEngSuggestions] = useState(false);
    const [showBranchSuggestions, setShowBranchSuggestions] = useState(false);

    // Fetch unique engineers and branches for suggestions
    React.useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/daily-service/metadata`);
                if (response.data.success) {
                    setMetadata({
                        engineers: response.data.engineers,
                        branches: response.data.branches
                    });
                }
            } catch (error) {
                console.error('Error fetching service metadata:', error);
            }
        };
        fetchMetadata();
    }, [refreshTrigger]);

    const handleHeaderChange = (e) => {
        setHeader({ ...header, [e.target.name]: e.target.value });
    };

    const handleSaveEntry = (entryData) => {
        if (editingIndex !== null) {
            const updatedEntries = [...entries];
            updatedEntries[editingIndex] = { ...entryData, siNo: editingIndex + 1 };
            setEntries(updatedEntries);
            setEditingIndex(null);
        } else {
            setEntries([...entries, { ...entryData, siNo: entries.length + 1 }]);
        }
    };

    const openEditModal = (index) => {
        setEditingIndex(index);
        setIsModalOpen(true);
    };

    const removeEntry = (index) => {
        const updatedEntries = entries.filter((_, i) => i !== index).map((e, i) => ({ ...e, siNo: i + 1 }));
        setEntries(updatedEntries);
    };

    const handleSubmitReport = async () => {
        if (!header.engineerName || !header.branch) {
            setMessage({ type: 'error', text: 'Please fill in Engineer Name and Branch' });
            return;
        }
        if (entries.length === 0) {
            setMessage({ type: 'error', text: 'Please add at least one service entry' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.post(`${API_BASE_URL}/daily-service`, {
                ...header,
                entries
            });
            localStorage.setItem('last_engineer_name', header.engineerName);
            localStorage.setItem('last_branch', header.branch);
            
            setMessage({ type: 'success', text: 'Daily Service Report saved successfully!' });
            setEntries([]);
            // Keep engineerName and branch for the next report
            setRefreshTrigger(prev => prev + 1);
            // Optionally switch to records tab after success
            setTimeout(() => setActiveTab('records'), 1500);
        } catch (error) {
            setMessage({ type: 'error', text: 'Error saving report. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('form')}
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                        activeTab === 'form'
                            ? 'bg-white text-[#F9783B] shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Entry Form
                </button>
                <button
                    onClick={() => setActiveTab('records')}
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                        activeTab === 'records'
                            ? 'bg-white text-[#F9783B] shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    View History
                </button>
            </div>

            {activeTab === 'form' ? (
                <>
                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex flex-wrap gap-8">
                            <div className="flex-1 min-w-[200px] space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Date of Service</label>
                                <DateRangePicker
                                    isSingle={true}
                                    startDate={header.date}
                                    onRangeSelect={(start) => {
                                        const val = start ? start.toISOString().split('T')[0] : '';
                                        setHeader(prev => ({ ...prev, date: val }));
                                    }}
                                />
                            </div>
                            <div className="flex-2 min-w-[300px] space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Service Engineer Name</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="engineerName"
                                        value={header.engineerName}
                                        onChange={handleHeaderChange}
                                        onFocus={() => setShowEngSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowEngSuggestions(false), 200)}
                                        placeholder="Enter Engineer Name"
                                        className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-4 focus:ring-[#D15616]/5 font-bold text-gray-700 outline-none pr-10 transition-all"
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-focus-within:text-[#D15616] transition-colors">
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                            <path d="M6 9l6 6 6-6"></path>
                                        </svg>
                                    </div>
                                    
                                    {/* Custom Dropdown */}
                                    {showEngSuggestions && metadata.engineers.length > 0 && (
                                        <div className="absolute z-[100] left-0 right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Select Active Engineer</p>
                                            {metadata.engineers
                                                .filter(name => !header.engineerName || name.toLowerCase().includes(header.engineerName.toLowerCase()))
                                                .map(name => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => setHeader({ ...header, engineerName: name })}
                                                    className="w-full px-4 py-3 text-left hover:bg-[#D15616]/5 text-sm font-bold text-gray-700 hover:text-[#D15616] flex items-center justify-between group/item transition-colors"
                                                >
                                                    {name}
                                                    <span className="opacity-0 group-hover/item:opacity-100 text-[10px] font-black uppercase tracking-tighter">Use →</span>
                                                </button>
                                            ))}
                                            {metadata.engineers.filter(name => !header.engineerName || name.toLowerCase().includes(header.engineerName.toLowerCase())).length === 0 && (
                                                <p className="px-4 py-4 text-xs font-bold text-gray-300 text-center italic">No matching engineers found</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-w-[200px] space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#D15616]">Branch</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="branch"
                                        value={header.branch}
                                        onChange={handleHeaderChange}
                                        onFocus={() => setShowBranchSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowBranchSuggestions(false), 200)}
                                        placeholder="Enter Branch"
                                        className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-4 focus:ring-[#D15616]/5 font-bold text-gray-700 outline-none pr-10 transition-all"
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-focus-within:text-[#D15616] transition-colors">
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                            <path d="M6 9l6 6 6-6"></path>
                                        </svg>
                                    </div>
                                    
                                    {showBranchSuggestions && metadata.branches.length > 0 && (
                                        <div className="absolute z-[100] left-0 right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                            <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Select Registered Branch</p>
                                            {metadata.branches
                                                .filter(b => !header.branch || b.toLowerCase().includes(header.branch.toLowerCase()))
                                                .map(branch => (
                                                <button
                                                    key={branch}
                                                    type="button"
                                                    onClick={() => setHeader({ ...header, branch: branch })}
                                                    className="w-full px-4 py-3 text-left hover:bg-[#D15616]/5 text-sm font-bold text-gray-700 hover:text-[#D15616] flex items-center justify-between group/item transition-colors"
                                                >
                                                    {branch}
                                                    <span className="opacity-0 group-hover/item:opacity-100 text-[10px] font-black uppercase tracking-tighter">Use →</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Entries Display Table */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h4 className="text-sm font-black text-[#0c1f3d] uppercase tracking-widest flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-[#D15616]"></span>
                                    Daily Service Log Entries
                                </h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{entries.length} Entries Recorded</p>
                            </div>
                            <button
                                onClick={() => { setEditingIndex(null); setIsModalOpen(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-[#F9783B] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F97840] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-900/20 cursor-pointer"
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="4">
                                    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add New Entry
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-black uppercase tracking-widest text-[10px]">
                                        <th className="p-4 w-[12%]">Compl. No</th>
                                        <th className="p-4 w-[25%]">Customer Details</th>
                                        <th className="p-4 w-[12%]">Product</th>
                                        <th className="p-4 w-[8%] text-center">VT</th>
                                        <th className="p-4 w-[12%]">Status</th>
                                        <th className="p-4 w-[12%] text-center">Time</th>
                                        <th className="p-4 text-center w-[12%]">Charges</th>
                                        <th className="p-4 w-[7%] text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="p-12 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
                                                    </svg>
                                                    <p className="text-xs font-black uppercase tracking-widest">No entries added yet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry, index) => (
                                            <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="p-4">
                                                    <p className="text-xs font-black text-[#0c1f3d]">{entry.complaintNo}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[100px]">{entry.visitType}</p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-bold text-gray-800">{entry.customerName || entry.customerDetails}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold truncate max-w-[160px]">{entry.phone}</p>
                                                    <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{entry.address}</p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-xs font-bold text-gray-600 truncate">{entry.product}</p>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase">{entry.visitType || '-'}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${entry.status?.toLowerCase().includes('complete') ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {entry.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <p className="text-[10px] font-black text-gray-800">{entry.timeIn} - {entry.timeOut}</p>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 text-[10px] font-bold text-gray-500">
                                                        <div className="flex justify-between"><span>Spares:</span> <span className="text-green-600">₹{entry.charges.spares}</span></div>
                                                        <div className="flex justify-between"><span>Visit:</span> <span className="text-green-600">₹{entry.charges.visit}</span></div>
                                                        <div className="flex justify-between"><span>Contracts:</span> <span className="text-green-600">₹{entry.charges.contracts}</span></div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditModal(index)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                                                                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => removeEntry(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

                        {/* Footer Actions */}
                        <div className="p-8 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-[#D15616]/10 text-[#D15616] rounded-xl flex items-center justify-center font-black">
                                    {entries.length}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Entries</p>
                                    <p className="text-sm font-black text-[#0c1f3d]">Ready for submission</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                {message.text && (
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {message.text}
                                    </span>
                                )}
                                <button
                                    onClick={handleSubmitReport}
                                    disabled={loading || entries.length === 0}
                                    className={`flex items-center gap-3 px-10 py-4 ${loading ? 'bg-gray-400' : 'bg-[#D15616]'} text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:brightness-110 transition-all transform hover:-translate-y-0.5 shadow-xl shadow-orange-900/20 disabled:opacity-50 disabled:transform-none cursor-pointer`}
                                >
                                    {loading ? 'Processing...' : 'Save Daily Report'}
                                    {!loading && (
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="4">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Entry Modal */}
                    <ServiceEntryModal
                        isOpen={isModalOpen}
                        onClose={() => { setIsModalOpen(false); setEditingIndex(null); }}
                        onSave={handleSaveEntry}
                        entry={editingIndex !== null ? entries[editingIndex] : null}
                        isEdit={editingIndex !== null}
                    />
                </>
            ) : (
                <DailyServiceRecords refreshTrigger={refreshTrigger} />
            )}
        </div>
    );
};

export default DailyServiceForm;
