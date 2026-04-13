import React from 'react';
import { createPortal } from 'react-dom';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, customerName, title = "Erase Record?", message }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 font-['Plus_Jakarta_Sans']">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
                    <p className="text-sm font-semibold text-gray-500 leading-relaxed">
                        {message || (
                            <>
                                You are about to permanently delete <span className="text-gray-900 font-bold">"{customerName}"</span>.
                                This action cannot be undone and all associated service history will be lost.
                            </>
                        )}
                    </p>
                </div>
                <div className="p-6 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="cursor-pointer flex-1 py-3.5 bg-white text-gray-700 text-[11px] font-black uppercase tracking-widest rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="cursor-pointer flex-1 py-3.5 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
                    >
                        Delete Forever
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteConfirmModal;
