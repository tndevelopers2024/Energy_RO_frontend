import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductDropdown from './ProductDropdown';
import DateRangePicker from './DateRangePicker';

const InputField = ({ label, name, value, onChange, type = 'text', required = false, maxLength, readOnly }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label} {required && <span className="text-[#D15616]">*</span>}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      maxLength={maxLength}
      readOnly={readOnly}
      className={`px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium ${readOnly ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}`}
      placeholder={readOnly ? '' : `Enter ${label.toLowerCase()}`}
    />
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
    address: '',
    productNameAndModel: '',
    cardNumber: '',
    orderNo: generateOrderNo(),
    dateOfInstallationOrService: '',
    type: 'Installation'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setFormData({
      userName: '',
      mobileNumber: '',
      email: '',
      address: '',
      productNameAndModel: '',
      cardNumber: '',
      orderNo: generateOrderNo(),
      dateOfInstallationOrService: '',
      type: 'Installation'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'mobileNumber') {
      const onlyNums = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: onlyNums }));
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
      const response = await fetch('http://127.0.0.1:5000/api/customers', {
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
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Register Service</h2>
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
          <InputField 
            label="Customer Name" 
            name="userName" 
            value={formData.userName} 
            onChange={handleChange} 
            required 
          />
          <InputField 
            label="Mobile Number" 
            name="mobileNumber" 
            value={formData.mobileNumber} 
            onChange={handleChange} 
            maxLength={10} 
            required 
          />
          <InputField 
            label="Email Address" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            type="email" 
          />
          <InputField 
            label="Installation Address" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            required
          />
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
          />
          <DateRangePicker 
            label="Installation Date" 
            isSingle={true}
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

        <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">* Required fields must be completed</p>
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-[#D15616] hover:bg-[#b84a12] text-white font-bold text-sm rounded-lg shadow-xl shadow-[#D15616]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
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

export default CustomerForm;
