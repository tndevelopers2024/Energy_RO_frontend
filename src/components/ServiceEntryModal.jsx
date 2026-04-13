import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TimePicker from './TimePicker';
import VisitTypeSelect from './VisitTypeSelect';
import CodeSelect from './CodeSelect';
import ProductSelect from './ProductSelect';
import DateRangePicker from './DateRangePicker';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

export const STATUS_OPTIONS = [
    { code: 'IW', label: 'Inside Warranty' },
    { code: 'IC', label: 'Inside Contract' },
    { code: 'OW', label: 'Outside Warranty' },
];

export const RESULT_OPTIONS = [
    { code: 'WC',  label: 'Work Completed' },
    { code: 'DL',  label: 'Door Lockwd' },
    { code: 'WA',  label: 'Wrong Address' },
    { code: 'PNS', label: 'Problem Not Solved' },
    { code: 'P',   label: 'Pending' },
    { code: 'CA',  label: 'Called Again' },
];

const ServiceEntryModal = ({ isOpen, onClose, onSave, entry, isEdit }) => {
    const [formData, setFormData] = useState({
        complaintNo: '',
        customerName: '',
        address: '',
        phone: '',
        product: '',
        visitType: '',
        status: '',
        timeIn: '',
        timeOut: '',
        workDetails: '',
        sparesReplaced: '',
        result: '',
        receiptNo: '',
        receiptDate: '',
        charges: {
            spares: 0,
            visit: 0,
            contracts: 0
        }
    });

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [customerROs, setCustomerROs] = useState([]); // Other ROs for this phone

    // Search for customers when customerName or phone changes
    useEffect(() => {
        const source = axios.CancelToken.source();
        
        const searchCustomer = async () => {
            const query = formData.customerName || formData.phone;
            if (query.length < 3 || isEdit) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/customers/search?q=${query}`, {
                    cancelToken: source.token
                });
                if (response.data.success) {
                    setSuggestions(response.data.data);
                    setShowSuggestions(response.data.data.length > 0);
                }
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error('Search error:', error);
                }
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchCustomer, 300);
        return () => {
            clearTimeout(timeoutId);
            source.cancel();
        };
    }, [formData.customerName, formData.phone, isEdit]);

    const selectCustomer = async (customer) => {
        setFormData({
            ...formData,
            customerName: customer.userName,
            phone: customer.mobileNumber,
            address: customer.address,
            product: customer.productNameAndModel || formData.product
        });
        setShowSuggestions(false);

        // Fetch all ROs for this mobile number to provide a quick dropdown
        try {
            const response = await axios.get(`${API_BASE_URL}/customers/search?q=${customer.mobileNumber}`);
            if (response.data.success && response.data.data.length > 1) {
                setCustomerROs(response.data.data);
            } else {
                setCustomerROs([]);
            }
        } catch (error) {
            console.error('Error fetching ROs:', error);
        }
    };

    useEffect(() => {
        if (entry) {
            setFormData(entry);
        } else {
            setFormData({
                complaintNo: '',
                customerName: '',
                address: '',
                phone: '',
                product: '',
                visitType: '',
                status: '',
                timeIn: '',
                timeOut: '',
                workDetails: '',
                sparesReplaced: '',
                result: '',
                receiptNo: '',
                receiptDate: '',
                charges: { spares: 0, visit: 0, contracts: 0 }
            });
        }
    }, [entry, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field, value, subField) => {
        if (subField) {
            setFormData({
                ...formData,
                charges: { ...formData.charges, [subField]: value }
            });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-100 my-auto">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-black text-xl font-black tracking-tight flex items-center gap-2">
                            <span className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            </span>
                            {isEdit ? 'Edit Service Entry' : 'Add New Service Entry'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-black/60 hover:text-black transition-colors cursor-pointer">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="3" fill="none">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Complaint Info */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Complaint No</label>
                            <input
                                type="text"
                                required
                                value={formData.complaintNo}
                                onChange={(e) => handleChange('complaintNo', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm"
                                placeholder="Enter Complaint #"
                            />
                        </div>

                        {/* Visit Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visit Type (VT)</label>
                            <VisitTypeSelect
                                value={formData.visitType}
                                onChange={(val) => handleChange('visitType', val)}
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                            <CodeSelect
                                value={formData.status}
                                onChange={(val) => handleChange('status', val)}
                                options={STATUS_OPTIONS}
                                storageKey="custom_status_options"
                                placeholder="Select Status"
                            />
                        </div>

                        {/* Customer Name */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={formData.customerName}
                                    onChange={(e) => handleChange('customerName', e.target.value)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onFocus={() => formData.customerName.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
                                    placeholder="Enter customer name"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-[#D15616] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && (
                                <div className="absolute z-[1001] left-0 right-0 top-[calc(100%+4px)] bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {suggestions.map((customer) => (
                                        <button
                                            key={customer._id}
                                            type="button"
                                            onClick={() => selectCustomer(customer)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex flex-col gap-0.5 border-b border-gray-50 last:border-0 transition-colors"
                                        >
                                            <span className="text-xs font-black text-[#0c1f3d]">{customer.userName}</span>
                                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                <span className="text-[#D15616]">📦 {customer.productNameAndModel || 'No Product'}</span>
                                                <span>📞 {customer.mobileNumber}</span>
                                                <span className="truncate max-w-[150px]">📍 {customer.address}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone No</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
                                placeholder="Mobile number"
                            />
                        </div>

                        {/* Address */}
                        <div className="md:col-span-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
                                placeholder="Customer address"
                            />
                        </div>

                        {/* Product */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</label>
                                {customerROs.length > 1 && (
                                    <span className="text-[9px] font-black text-orange-500 uppercase animate-pulse">Multiple ROs Found</span>
                                )}
                            </div>
                            <div className="relative group">
                                <ProductSelect
                                    value={formData.product}
                                    onChange={(val) => handleChange('product', val)}
                                    // If we have registered ROs, we could prioritize them
                                />
                                {customerROs.length > 1 && (
                                    <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
                                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-tighter mb-1.5 px-1">Switch to registered RO:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {customerROs.map((ro) => (
                                                <button
                                                    key={ro._id}
                                                    type="button"
                                                    onClick={() => handleChange('product', ro.productNameAndModel)}
                                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                                        formData.product === ro.productNameAndModel
                                                            ? 'bg-orange-500 text-white shadow-sm'
                                                            : 'bg-white text-orange-600 border border-orange-200 hover:border-orange-400'
                                                    }`}
                                                >
                                                    {ro.productNameAndModel}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Time In/Out */}
                        <div className="grid grid-cols-2 gap-4">
                            <TimePicker
                                label="Time In"
                                value={formData.timeIn}
                                onChange={(val) => handleChange('timeIn', val)}
                            />
                            <TimePicker
                                label="Time Out"
                                value={formData.timeOut}
                                onChange={(val) => handleChange('timeOut', val)}
                            />
                        </div>

                        {/* Result */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Result</label>
                            <CodeSelect
                                value={formData.result}
                                onChange={(val) => handleChange('result', val)}
                                options={RESULT_OPTIONS}
                                storageKey="custom_result_options"
                                placeholder="Select Result"
                            />
                        </div>

                        {/* Receipt No */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receipt No</label>
                            <input
                                type="text"
                                value={formData.receiptNo}
                                onChange={(e) => handleChange('receiptNo', e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
                                placeholder="e.g. R123"
                            />
                        </div>

                        {/* Receipt Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receipt Date</label>
                            <DateRangePicker
                                isSingle={true}
                                startDate={formData.receiptDate}
                                onRangeSelect={(start) =>
                                    handleChange('receiptDate', start ? start.toISOString().split('T')[0] : '')
                                }
                            />
                        </div>

                        {/* Work Details */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Work Details</label>
                            <textarea
                                rows="2"
                                value={formData.workDetails}
                                onChange={(e) => handleChange('workDetails', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm resize-none"
                                placeholder="Summarize work done"
                            ></textarea>
                        </div>

                        {/* Spares Replaced */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spares Replaced</label>
                            <input
                                type="text"
                                value={formData.sparesReplaced}
                                onChange={(e) => handleChange('sparesReplaced', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#D15616] focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none font-bold text-gray-800 text-sm"
                                placeholder="List replaced parts"
                            />
                        </div>

                        {/* Charges */}
                        <div className="md:col-span-3">
                            <label className="text-[11px] font-black text-[#D15616] uppercase tracking-widest mb-4 block">Charges Collected</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spares Charge</label>
                                    <input
                                        type="number"
                                        value={formData.charges.spares}
                                        onChange={(e) => handleChange('charges', Number(e.target.value), 'spares')}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all outline-none font-bold text-gray-800 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visit Charge</label>
                                    <input
                                        type="number"
                                        value={formData.charges.visit}
                                        onChange={(e) => handleChange('charges', Number(e.target.value), 'visit')}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all outline-none font-bold text-gray-800 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contracts Charge</label>
                                    <input
                                        type="number"
                                        value={formData.charges.contracts}
                                        onChange={(e) => handleChange('charges', Number(e.target.value), 'contracts')}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all outline-none font-bold text-gray-800 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-lg border border-gray-200 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-4 rounded-lg bg-[#D15616] text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-[#D15616]/20 hover:scale-[1.02] transition-all cursor-pointer"
                        >
                            {isEdit ? 'Update Entry' : 'Add Entry to Table'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ServiceEntryModal;
