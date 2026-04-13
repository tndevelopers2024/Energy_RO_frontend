import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100]
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 w-full text-xs font-['Plus_Jakarta_Sans']">
      
      {/* Left: Items per page */}
      <div className="flex items-center gap-3">
        <span className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Items Per Page</span>
        <div className="relative group/select">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1); // Reset to page 1
            }}
            className="appearance-none bg-white border border-gray-100/80 rounded-lg pl-4 pr-8 py-2 text-xs font-bold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 transition-all outline-none cursor-pointer shadow-sm"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none">
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Center: Showing text */}
      <div className="bg-gray-50/50 px-6 py-2.5 rounded-full border border-gray-100/50 shadow-inner">
        <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
          Showing <span className="text-[#0c1f3d] font-black">{startItem} - {endItem}</span> of <span className="text-[#0c1f3d] font-black">{totalItems}</span> Items
        </p>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* First & Prev */}
        <div className="flex items-center border border-gray-100 rounded-lg bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-gray-100"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"></path></svg>
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M15 18l-6-6 6-6"></path></svg>
          </button>
        </div>

        {/* Current Page Tag */}
        <div className="bg-[#0c1f3d] text-white px-4 py-2 rounded-lg shadow-md flex items-center justify-center">
          <span className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
            Page <span className="text-[#D15616]">{currentPage}</span> of {totalPages}
          </span>
        </div>

        {/* Next & Last */}
        <div className="flex items-center border border-gray-100 rounded-lg bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-gray-100"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M9 18l6-6-6-6"></path></svg>
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"></path></svg>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Pagination;
