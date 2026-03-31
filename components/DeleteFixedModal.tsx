import React from 'react';

interface DeleteFixedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteSingle: () => void;
    onDeleteAll: () => void;
    isLoading?: boolean;
}

const DeleteFixedModal: React.FC<DeleteFixedModalProps> = ({
    isOpen,
    onClose,
    onDeleteSingle,
    onDeleteAll,
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
                onClick={isLoading ? undefined : onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white dark:bg-[#1c2e24] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    {/* Icon */}
                    <div className="flex items-center justify-center size-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        <span className="material-symbols-outlined text-[24px]">event_repeat</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            Apagar Despesa Fixa
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Esta é uma despesa recorrente. O que deseja fazer?
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full mt-2">
                        {/* Delete only this one */}
                        <button
                            onClick={onDeleteSingle}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="size-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            )}
                            Apagar só esta
                        </button>

                        {/* Delete this and all future */}
                        <button
                            onClick={onDeleteAll}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                            )}
                            Apagar esta e as próximas
                        </button>

                        {/* Cancel */}
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteFixedModal;
