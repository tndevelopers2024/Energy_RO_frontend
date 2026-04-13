import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../apiConfig';

const ProductSelect = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/customers`);
                const data = await res.json();
                if (data.success) {
                    const unique = [...new Set(
                        data.data
                            .map(c => c.productNameAndModel)
                            .filter(p => p && p.trim())
                    )].sort();
                    setProducts(unique);
                }
            } catch (err) {
                console.error('Failed to fetch products', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = products.filter(p =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        onChange(val);
        if (!isOpen) setIsOpen(true);
    };

    const handleSelect = (product) => {
        setSearchTerm(product);
        onChange(product);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
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
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-[1100] bg-white border border-gray-100 rounded-xl shadow-2xl shadow-gray-200/50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-gray-100">
                    <div className="p-2 space-y-0.5">
                        {loading ? (
                            <div className="flex items-center justify-center py-6 gap-2">
                                <div className="h-4 w-4 border-2 border-[#D15616]/20 border-t-[#D15616] rounded-full animate-spin"></div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading...</p>
                            </div>
                        ) : filtered.length > 0 ? (
                            filtered.map((product, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelect(product)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                                        searchTerm === product
                                            ? 'bg-[#D15616] text-white'
                                            : 'text-gray-600 hover:bg-[#D15616]/5 hover:text-[#D15616]'
                                    }`}
                                >
                                    {product}
                                    {searchTerm === product && (
                                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="4" fill="none">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    )}
                                </button>
                            ))
                        ) : searchTerm ? (
                            <div className="px-4 py-4 text-center">
                                <p className="text-[10px] font-black text-[#D15616] uppercase tracking-widest mb-1">New Product</p>
                                <p className="text-[11px] text-gray-400 font-bold">Press Enter to use "{searchTerm}"</p>
                            </div>
                        ) : (
                            <div className="px-4 py-4 text-center text-[10px] font-bold text-gray-400">
                                Start typing to search products...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductSelect;
