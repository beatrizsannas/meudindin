import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = false,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
                onClick={isLoading ? undefined : onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white dark:bg-[#1c2e24] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    {/* Icon based on destructive or not */}
                    <div className={`flex items-center justify-center size-12 rounded-full ${isDestructive ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-[#0df26c]/10 text-[#0aad4c] dark:bg-[#0df26c]/20 dark:text-[#0df26c]'}`}>
                        <span className="material-symbols-outlined text-[24px]">
                            {isDestructive ? 'warning' : 'content_copy'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 ${isDestructive
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-[#003314] dark:bg-[#0df26c] dark:text-[#003314] hover:bg-[#004d1f] dark:hover:bg-[#0be062] shadow-[#0df26c]/20'
                                }`}
                        >
                            {isLoading && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
