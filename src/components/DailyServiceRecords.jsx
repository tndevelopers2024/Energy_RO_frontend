import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';
import ServiceEntryModal from './ServiceEntryModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import DailyServiceDetailModal from './DailyServiceDetailModal';
import Pagination from './Pagination';
import DateRangePicker from './DateRangePicker';

const DailyServiceRecords = ({ refreshTrigger }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEngineer, setSelectedEngineer] = useState('all');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingEntry, setDeletingEntry] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingEntry, setViewingEntry] = useState(null);

    // Column visibility state
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        date: true,
        engineer: true,
        complaintNo: true,
        complaintDate: true,
        initialStatus: true,
        customer: true,
        product: true,
        visitType: true,
        status: true,
        time: true,
        workDetails: true,
        charges: true,
        actions: true
    });

    const toggleColumn = (key) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

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

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/daily-service`);
            setReports(res.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [refreshTrigger]);

    // Flatten all entries from all reports into a single list
    const allEntries = useMemo(() => {
        const flattened = [];
        reports.forEach(report => {
            report.entries.forEach(entry => {
                flattened.push({
                    ...entry,
                    reportId: report._id,
                    engineerName: report.engineerName,
                    date: report.date,
                    branch: report.branch
                });
            });
        });
        // Sort by date newest first
        return flattened.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [reports]);

    // 1. First, filter entries based on the search term
    const searchedEntries = useMemo(() => {
        if (!searchTerm.trim()) return allEntries;
        
        const term = searchTerm.toLowerCase();
        return allEntries.filter(entry => 
            (entry.customerName && entry.customerName.toLowerCase().includes(term)) ||
            (entry.customerDetails && entry.customerDetails.toLowerCase().includes(term)) ||
            (entry.phone && entry.phone.includes(term)) ||
            (entry.complaintNo && entry.complaintNo.toLowerCase().includes(term))
        );
    }, [allEntries, searchTerm]);

    // 2. Derive the available engineers list from the SEARCH-FILTERED entries
    const engineers = useMemo(() => {
        const uniqueNames = new Set(searchedEntries.map(e => e.engineerName));
        return Array.from(uniqueNames).sort();
    }, [searchedEntries]);

    // 3. Finally, filter the searched results by the selected engineer and date range
    const filteredEntries = useMemo(() => {
        let result = searchedEntries;
        
        if (selectedEngineer !== 'all') {
            result = result.filter(entry => entry.engineerName === selectedEngineer);
        }
        
        if (dateRange.start) {
            result = result.filter(entry => {
                if (!entry.date) return false;
                const d = new Date(entry.date);
                if (isNaN(d.getTime())) return false;
                
                const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                const start = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), dateRange.start.getDate()).getTime();
                
                if (dateRange.end) {
                    const end = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth(), dateRange.end.getDate()).getTime();
                    return entryDate >= start && entryDate <= end;
                } else {
                    return entryDate === start;
                }
            });
        }
        
        return result;
    }, [searchedEntries, selectedEngineer, dateRange]);

    // 4. Pagination logic
    const totalItems = filteredEntries.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedEngineer, dateRange]);

    const pagedEntries = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEntries.slice(start, start + itemsPerPage);
    }, [filteredEntries, currentPage, itemsPerPage]);

    const handleUpdateEntry = async (updatedData) => {
        try {
            await axios.put(`${API_BASE_URL}/daily-service/${editingEntry.reportId}/entry/${editingEntry._id}`, updatedData);
            fetchReports();
            setEditModalOpen(false);
        } catch (error) {
            console.error('Error updating entry:', error);
            alert('Failed to update entry');
        }
    };

    const handleDeleteEntry = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/daily-service/${deletingEntry.reportId}/entry/${deletingEntry._id}`);
            fetchReports();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry');
        }
    };

    const handleDownloadCSV = () => {
        if (filteredEntries.length === 0) {
            alert('No records to download');
            return;
        }

        const headers = [
            'Date', 'Service Engineer', 'Branch', 'Complaint No', 'Complaint Date', 'Initial Status',
            'Customer Name', 'Phone', 'Address', 'Product', 
            'Visit Type', 'Status', 'Time In', 'Time Out', 
            'Work Details', 'Spares Charges', 'Visit Charges', 'Contract Charges', 'Total Charges'
        ];

        const csvRows = [headers.join(',')];

        filteredEntries.forEach(entry => {
            const customerName = (entry.customerName || entry.customerDetails || '').replace(/,/g, '');
            const address = (entry.address || '').replace(/,/g, '');
            const workDetails = (entry.workDetails || '').replace(/,/g, ' ');
            const totalCharges = (entry.charges?.spares || 0) + (entry.charges?.visit || 0) + (entry.charges?.contracts || 0);

            const row = [
                formatDate(entry.date),
                entry.engineerName,
                entry.branch || '',
                entry.complaintNo || '',
                entry.dateOfComplain ? new Date(entry.dateOfComplain).toLocaleDateString('en-GB') : '',
                entry.initialStatus || '',
                customerName,
                entry.phone || '',
                address,
                entry.product || '',
                getFullVisitType(entry.visitType),
                getFullStatus(entry.status),
                entry.timeIn || '',
                entry.timeOut || '',
                workDetails,
                entry.charges?.spares || 0,
                entry.charges?.visit || 0,
                entry.charges?.contracts || 0,
                totalCharges
            ];

            // Escape all values safely for CSV
            csvRows.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
        });

        // Add BOM for Excel UTF-8 compatibility
        const csvContent = "\uFEFF" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Service_Records_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="h-10 w-10 border-4 border-[#F9783B]/10 border-t-[#F9783B] rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Fetching All Service Records...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 font-['Plus_Jakarta_Sans']">
            {/* Header & Filter Bar */}
            <div className="p-6 border-b border-gray-50 bg-gray-50/20 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Daily Service Records</h3>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-70">Complete History Log</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Stats Badge */}
                        <div className="flex items-center gap-2 bg-[#F9783B]/10 px-3 py-1.5 rounded-lg border border-[#F9783B]/5 h-9">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hidden sm:inline">Entries:</span>
                            <span className="text-sm font-black text-[#F9783B]">{filteredEntries.length}</span>
                        </div>

                        {/* Columns Toggle */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                                className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-9 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                Columns
                            </button>
                            
                            {showColumnDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowColumnDropdown(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 py-3 overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 pb-2 mb-2 border-b border-gray-50">Toggle Columns</div>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                            {Object.entries({
                                                date: 'Date', engineer: 'Service Engineer', complaintNo: 'Complaint No', 
                                                complaintDate: 'Complaint Date', initialStatus: 'Initial Status', 
                                                customer: 'Customer Details', product: 'Product', visitType: 'Visit Type', 
                                                status: 'Status', time: 'Time', workDetails: 'Work Details', 
                                                charges: 'Charges', actions: 'Actions'
                                            }).map(([key, label]) => (
                                                <label key={key} className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden" 
                                                        checked={visibleColumns[key]}
                                                        onChange={() => toggleColumn(key)}
                                                    />
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleColumns[key] ? 'bg-[#F9783B] border-[#F9783B]' : 'border-gray-300 bg-white'}`}>
                                                        {visibleColumns[key] && <svg viewBox="0 0 24 24" width="10" height="10" stroke="white" strokeWidth="4" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-gray-700 group-hover:text-gray-900">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button 
                            onClick={handleDownloadCSV}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-9 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-100/50"
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            CSV
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                    {/* Search Field */}
                    <div className="flex flex-col gap-1.5 w-full md:flex-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Search Customer / Phone</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#F9783B] focus:ring-4 focus:ring-[#F9783B]/5 transition-all outline-none"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="flex flex-col gap-1.5 w-full md:w-64">
                        <label className="text-[9px] font-black text-[#F9783B] uppercase tracking-[0.2em] ml-1">Filter by Date</label>
                        <DateRangePicker 
                            startDate={dateRange.start}
                            endDate={dateRange.end}
                            isSingle={false}
                            onRangeSelect={(start, end) => setDateRange({ start, end })}
                        />
                    </div>

                    {/* Engineer Filter Dropdown */}
                    <div className="flex flex-col gap-1.5 w-full md:w-56">
                        <label className="text-[9px] font-black text-[#F9783B] uppercase tracking-[0.2em] ml-1">Filter by Engineer</label>
                        <div className="relative group">
                            <select
                                value={selectedEngineer}
                                onChange={(e) => setSelectedEngineer(e.target.value)}
                                className="w-full bg-white border border-gray-100 rounded-xl pl-4 pr-10 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#F9783B] focus:ring-4 focus:ring-[#F9783B]/5 transition-all outline-none appearance-none cursor-pointer"
                            >
                                <option value="all">All Engineers</option>
                                {engineers.map((name, idx) => (
                                    <option key={idx} value={name}>{name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                    <path d="M6 9l6 6 6-6"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flattened Table */}
            <div className="overflow-x-auto px-2">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100 whitespace-nowrap">
                            {visibleColumns.date && <th className="px-2 py-5 min-w-[100px]">Date</th>}
                            {visibleColumns.engineer && <th className="px-2 py-5 min-w-[120px]">Service Engineer</th>}
                            {visibleColumns.complaintNo && <th className="px-2 py-5 min-w-[100px]">Complaint No</th>}
                            {visibleColumns.complaintDate && <th className="px-2 py-5 min-w-[120px]">Complaint Date</th>}
                            {visibleColumns.initialStatus && <th className="px-2 py-5 min-w-[120px]">Initial Status</th>}
                            {visibleColumns.customer && <th className="px-2 py-5 min-w-[180px]">Customer Details</th>}
                            {visibleColumns.product && <th className="px-2 py-5 min-w-[120px]">Product</th>}
                            {visibleColumns.visitType && <th className="px-2 py-5 min-w-[100px] text-center">Visit Type</th>}
                            {visibleColumns.status && <th className="px-2 py-5 min-w-[100px]">Status</th>}
                            {visibleColumns.time && <th className="px-2 py-5 min-w-[120px] text-center">Time</th>}
                            {visibleColumns.workDetails && <th className="px-2 py-5 min-w-[150px]">Work Details</th>}
                            {visibleColumns.charges && <th className="px-2 py-5 text-right min-w-[100px]">Charges</th>}
                            {visibleColumns.actions && <th className="px-2 py-5 min-w-[100px] text-center sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] border-l border-gray-100">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="px-8 py-24 text-center opacity-40">
                                    <div className="flex flex-col items-center gap-4">
                                        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                        </svg>
                                        <p className="text-xs font-black uppercase tracking-widest">No matching service records found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            pagedEntries.map((entry, idx) => {
                                const totalCharges = entry.charges.spares + entry.charges.visit + entry.charges.contracts;
                                return (
                                    <tr key={`${entry.reportId}-${idx}`} className="hover:bg-gray-50/80 transition-all duration-300 group">
                                        {visibleColumns.date && (
                                            <td className="px-2 py-5 font-bold text-gray-700 text-xs">
                                                {formatDate(entry.date)}
                                            </td>
                                        )}
                                        {visibleColumns.engineer && (
                                            <td className="px-2 py-5">
                                                <p className="text-xs font-black text-[#0c1f3d]">{entry.engineerName}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{entry.branch}</p>
                                            </td>
                                        )}
                                        {visibleColumns.complaintNo && (
                                            <td className="px-2 py-5 text-xs font-black text-[#F9783B] whitespace-nowrap">#{entry.complaintNo}</td>
                                        )}
                                        {visibleColumns.complaintDate && (
                                            <td className="px-2 py-5 font-bold text-gray-700 text-xs whitespace-nowrap">
                                                {entry.dateOfComplain ? new Date(entry.dateOfComplain).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                        )}
                                        {visibleColumns.initialStatus && (
                                            <td className="px-2 py-5 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${entry.initialStatus === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {entry.initialStatus || '-'}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.customer && (
                                            <td className="px-2 py-5">
                                                <p className="text-xs font-bold text-gray-800">{entry.customerName || entry.customerDetails}</p>
                                                {entry.phone && <p className="text-[10px] text-gray-400 font-bold truncate max-w-[180px] mt-0.5"> {entry.phone}</p>}
                                                {entry.address && <p className="text-[10px] text-gray-400 truncate max-w-[180px] mt-0.5"> {entry.address}</p>}
                                            </td>
                                        )}
                                        {visibleColumns.product && (
                                            <td className="px-2 py-5">
                                                <p className="text-xs font-medium text-gray-600 truncate max-w-[120px]">{entry.product}</p>
                                            </td>
                                        )}
                                        {visibleColumns.visitType && (
                                            <td className="px-2 py-5 text-center">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase">{getFullVisitType(entry.visitType)}</span>
                                            </td>
                                        )}
                                        {visibleColumns.status && (
                                            <td className="px-2 py-5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${entry.status?.toLowerCase().includes('complete') || entry.status === 'IW' || entry.status === 'IC' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {getFullStatus(entry.status)}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.time && (
                                            <td className="px-2 py-5 text-center text-[9px] font-black text-gray-800">
                                                {entry.timeIn} - {entry.timeOut}
                                            </td>
                                        )}
                                        {visibleColumns.workDetails && (
                                            <td className="px-2 py-5">
                                                <p className="text-[11px] font-medium text-gray-500 line-clamp-2 leading-relaxed">{entry.workDetails}</p>
                                            </td>
                                        )}
                                        {visibleColumns.charges && (
                                            <td className="px-2 py-5 text-right">
                                                <span className="text-xs font-black text-green-600">₹{totalCharges}</span>
                                            </td>
                                        )}
                                        {visibleColumns.actions && (
                                            <td className="px-2 py-5 sticky right-0 bg-white group-hover:bg-gray-50 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] border-l border-gray-100 transition-colors">
                                                <div className="flex items-center justify-center gap-2 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => { setViewingEntry(entry); setViewModalOpen(true); }}
                                                        className="p-2 text-[#F9783B] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                                        title="View Full Detail"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                            <circle cx="12" cy="12" r="3"></circle>
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setEditingEntry(entry); setEditModalOpen(true); }}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Entry"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setDeletingEntry(entry); setDeleteModalOpen(true); }}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete Entry"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />

            {/* Modals */}
            <ServiceEntryModal 
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={handleUpdateEntry}
                entry={editingEntry}
                isEdit={true}
            />

            <DeleteConfirmModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteEntry}
                customerName={deletingEntry?.customerName || deletingEntry?.customerDetails || 'this entry'}
            />

            <DailyServiceDetailModal 
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                entry={viewingEntry}
            />
        </div>
    );
};

export default DailyServiceRecords;
