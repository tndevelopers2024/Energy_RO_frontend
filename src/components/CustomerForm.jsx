import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';
import ProductDropdown from './ProductDropdown';
import DateRangePicker from './DateRangePicker';
import axios from 'axios';

const InputField = ({ label, name, value, onChange, type = 'text', required = false, maxLength, readOnly, isSearching, onFocus, onBlur }) => (
  <div className="flex flex-col gap-1.5 relative">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label} {required && <span className="text-[#D15616]">*</span>}</label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        maxLength={maxLength}
        readOnly={readOnly}
        autoComplete="off"
        className={`w-full px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium ${readOnly ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}`}
        placeholder={readOnly ? '' : `Enter ${label.toLowerCase()}`}
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[#D15616] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  </div>
);

const CustomerForm = () => {
  const navigate = useNavigate();
  const generateOrderNo = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${day}${month}${random}`;
  };

  const [formData, setFormData] = useState({
    userName: '',
    mobileNumber: '',
    email: '',
    doorNo: '',
    street: '',
    area: '',
    pincode: '',
    address: 'PENDING', // Will be built on backend
    productNameAndModel: '',
    cardNumber: '',
    orderNo: generateOrderNo(),
    dateOfInstallationOrService: '',
    type: 'Installation',
    unitSerialNumber: '',
    occupation: '',
    dob: '',
    weddingAnniversary: '',
    locationLink: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search for customers when userName or mobileNumber changes
  useEffect(() => {
    const source = axios.CancelToken.source();
    
    const searchCustomer = async () => {
      const query = formData.userName || formData.mobileNumber;
      if (query.trim().length < 3) {
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
  }, [formData.userName, formData.mobileNumber]);

  const selectExistingCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      userName: customer.userName || '',
      mobileNumber: customer.mobileNumber || '',
      email: customer.email || '',
      doorNo: customer.doorNo || '',
      street: customer.street || '',
      area: customer.area || '',
      pincode: customer.pincode || '',
      address: customer.address || 'PENDING',
      locationLink: customer.locationLink || '',
      unitSerialNumber: customer.unitSerialNumber || '',
      occupation: customer.occupation || '',
      dob: customer.dob ? new Date(customer.dob).toISOString().split('T')[0] : '',
      weddingAnniversary: customer.weddingAnniversary ? new Date(customer.weddingAnniversary).toISOString().split('T')[0] : ''
    }));
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setFormData({
      userName: '',
      mobileNumber: '',
      email: '',
      doorNo: '',
      street: '',
      area: '',
      pincode: '',
      address: 'PENDING',
      productNameAndModel: '',
      cardNumber: '',
      orderNo: generateOrderNo(),
      dateOfInstallationOrService: '',
      type: 'Installation',
      unitSerialNumber: '',
      occupation: '',
      dob: '',
      weddingAnniversary: '',
      locationLink: ''
    });
    setIsAdvancedOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      const onlyNums = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: onlyNums }));
      return;
    }

    if (name === 'pincode') {
      const onlyNums = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: onlyNums }));
      
      if (onlyNums.length === 6) {
        fetch(`https://api.postalpincode.in/pincode/${onlyNums}`)
          .then(res => res.json())
          .then(data => {
            if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
              // Automatically fill area with the first post office name
              setFormData(prev => ({ ...prev, area: data[0].PostOffice[0].Name }));
            }
          })
          .catch(err => console.error("Error fetching pincode data:", err));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mobile validation cleanup and check
    const cleanMobile = formData.mobileNumber.trim();
    if (cleanMobile.length !== 10) {
      setError(`Mobile number must be exactly 10 digits (Current: ${cleanMobile.length})`);
      return;
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }

      setSuccess(true);
      resetForm();

      // Redirect to database after 1.5 seconds to see the success message
      setTimeout(() => {
        setSuccess(false);
        navigate('/database');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl shadow-gray-200/50 border border-gray-50 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Registration Form</h2>
        <div className="h-1.5 w-12 bg-[#D15616] mt-3 rounded-full"></div>
        <p className="text-sm text-gray-400 mt-4 font-semibold opacity-70">Fill out the customer and product details carefully.</p>
      </div>

      {error && <div className="mb-8 bg-red-50 text-red-600 px-6 py-4 rounded-lg text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
        <span className="h-2 w-2 bg-red-600 rounded-full"></span>
        {error}
      </div>}

      {success && <div className="mb-8 bg-[#D15616]/5 text-[#D15616] px-6 py-4 rounded-lg text-sm font-bold border border-[#D15616]/10 flex items-center gap-3">
        <span className="h-2 w-2 bg-[#D15616] rounded-full animate-ping"></span>
        Record saved successfully! Redirecting...
      </div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative">
            <InputField
              label="Customer Name"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              onFocus={() => formData.userName.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              isSearching={isSearching && formData.userName.length >= 3}
              required
            />
            {showSuggestions && formData.userName.length >= 3 && renderSuggestions(suggestions, selectExistingCustomer)}
          </div>
          
          <div className="relative">
            <InputField
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              onFocus={() => formData.mobileNumber.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              isSearching={isSearching && formData.mobileNumber.length >= 3}
              maxLength={10}
              required
            />
            {showSuggestions && formData.mobileNumber.length >= 3 && renderSuggestions(suggestions, selectExistingCustomer)}
          </div>
          <InputField
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
          />
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <InputField
                label="Door No"
                name="doorNo"
                value={formData.doorNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="md:col-span-3">
              <InputField
                label="Street Name"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-span-1 md:col-span-3">
              <InputField
                label="Area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <InputField
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength={6}
                required
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <InputField
              label="Location Link (Google Maps)"
              name="locationLink"
              value={formData.locationLink}
              onChange={handleChange}
            />
          </div>
          <ProductDropdown
            label="Product & Model"
            value={formData.productNameAndModel}
            onChange={handleChange}
          />
          <InputField
            label="Card No"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            required
          />
          <DateRangePicker
            label="Installation Date"
            isSingle={true}
            required={true}
            startDate={formData.dateOfInstallationOrService}
            onRangeSelect={(start) => {
              setFormData(prev => ({
                ...prev,
                dateOfInstallationOrService: start ? start.toISOString().split('T')[0] : ''
              }));
            }}
          />
          <InputField
            label="Order ID"
            name="orderNo"
            value={formData.orderNo}
            onChange={handleChange}
            readOnly
          />
        </div>

        {/* Advanced Details Accordion */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between p-5 bg-gray-50/50 hover:bg-[#D15616]/5 border border-gray-100 rounded-xl transition-all group overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <span className="h-10 w-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#D15616] group-hover:scale-110 transition-transform shadow-sm">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"></path>
                  <path d="M12 8v4l3 3"></path>
                </svg>
              </span>
              <div className="text-left">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Advanced Information</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 opacity-70">Optional specialized details</p>
              </div>
            </div>
            <div className={`p-2 rounded-lg bg-white border border-gray-100 transition-all duration-300 ${isAdvancedOpen ? 'rotate-180 bg-[#D15616]/10 border-[#D15616]/20' : ''}`}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke={isAdvancedOpen ? '#D15616' : 'currentColor'} strokeWidth="3" fill="none">
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </div>
          </button>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isAdvancedOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
              <InputField
                label="Unit Serial No"
                name="unitSerialNumber"
                value={formData.unitSerialNumber}
                onChange={handleChange}
              />
              <InputField
                label="Occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
              />
              <DateRangePicker
                label="Date of Birth (D.O.B)"
                isSingle={true}
                startDate={formData.dob}
                onRangeSelect={(date) => setFormData(prev => ({ ...prev, dob: date ? date.toISOString().split('T')[0] : '' }))}
              />
              <DateRangePicker
                label="Wedding Anniversary"
                isSingle={true}
                startDate={formData.weddingAnniversary}
                onRangeSelect={(date) => setFormData(prev => ({ ...prev, weddingAnniversary: date ? date.toISOString().split('T')[0] : '' }))}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">* Required fields must be completed</p>
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-[#D15616] hover:bg-[#b84a12] text-white font-bold text-sm rounded-lg shadow-xl shadow-[#D15616]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </>
            ) : 'Submit Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

const renderSuggestions = (suggestions, onSelect) => (
  <div className="absolute z-[100] left-0 right-0 top-[calc(100%+8px)] bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
    <p className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Returning Customer Found?</p>
    {suggestions.map((customer) => (
      <button
        key={customer._id}
        type="button"
        onClick={() => onSelect(customer)}
        className="w-full px-4 py-3 text-left hover:bg-[#D15616]/5 flex flex-col gap-0.5 border-b border-gray-50 last:border-0 transition-colors group"
      >
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-[#0c1f3d]">{customer.userName}</span>
          <span className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-[#D15616] uppercase tracking-tighter transition-opacity">Select →</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <span className="text-[#D15616]">📞 {customer.mobileNumber}</span>
          <span className="truncate max-w-[150px]">📍 {customer.address}</span>
        </div>
      </button>
    ))}
  </div>
);

export default CustomerForm;
