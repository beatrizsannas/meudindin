import React from 'react';

interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 scale-100">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-red-600 dark:text-red-500 text-3xl">logout</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        Sair da conta?
                    </h3>

                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed px-4">
                        Tem certeza que deseja sair? Você precisará fazer login novamente para acessar seus dados.
                    </p>

                    <div className="flex gap-3 w-full mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus:scale-[0.98]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmationModal;
