import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../apiConfig';

const ProductDropdown = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/customers/products`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p =>
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (product) => {
    setSearchTerm(product);
    onChange({ target: { name: 'productNameAndModel', value: product } });
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange({ target: { name: 'productNameAndModel', value: val } });
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {label} <span className="text-[#D15616]">*</span>
      </label>
      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search or type product model..."
          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#D15616] transition-colors pointer-events-none">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none"><path d="M6 9l6 6 6-6"></path></svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[1100] bg-white border border-gray-100 rounded-xl shadow-2xl shadow-gray-200/50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-gray-100">
          <div className="p-2 space-y-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${searchTerm === product
                      ? 'bg-[#D15616] text-white'
                      : 'text-gray-600 hover:bg-[#D15616]/5 hover:text-[#D15616]'
                    }`}
                >
                  {product}
                  {searchTerm === product && (
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="4" fill="none"><path d="M20 6L9 17l-5-5"></path></svg>
                  )}
                </button>
              ))
            ) : searchTerm ? (
              <div className="px-4 py-4 text-center">
                <p className="text-[10px] font-black text-[#D15616] uppercase tracking-widest mb-1">New Product Line</p>
                <p className="text-[11px] text-gray-400 font-bold">Press Enter or continue typing to add "{searchTerm}"</p>
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-[10px] font-bold text-gray-400">
                Start typing to see products...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDropdown;
