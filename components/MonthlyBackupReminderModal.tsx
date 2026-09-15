import React, { useEffect, useRef } from 'react';

interface MonthlyBackupReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerateReport: () => void;
    previousMonthLabel: string;
}

const MonthlyBackupReminderModal: React.FC<MonthlyBackupReminderModalProps> = ({
    isOpen,
    onClose,
    onGenerateReport,
    previousMonthLabel,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal Sheet */}
            <div
                ref={dialogRef}
                className="relative w-full max-w-md bg-background-light dark:bg-[#1a2e22] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100/50 dark:border-white/5 overflow-hidden"
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                {/* Decorative top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#228b3b] via-[#0be062] to-[#228b3b]" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    aria-label="Fechar"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center px-6 pt-6 pb-8">

                    {/* Cute icon with animated ping */}
                    <div className="relative mb-5">
                        <div className="flex items-center justify-center size-20 rounded-full bg-[#228b3b]/10 dark:bg-[#228b3b]/20">
                            <span className="text-5xl select-none">💾</span>
                        </div>
                        {/* Ping decoration */}
                        <span className="absolute -top-1 -right-1 flex size-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#228b3b] opacity-50" />
                            <span className="relative inline-flex rounded-full size-5 bg-[#228b3b] items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[11px]">star</span>
                            </span>
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">
                        Hora do seu backup! 🎉
                    </h2>

                    {/* Cute message */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                        Novo mês, novo começo! ✨ Que tal guardar um relatório completo de{' '}
                        <span className="font-bold text-gray-700 dark:text-gray-200">{previousMonthLabel}</span>?
                        <br /><br />
                        Ele inclui{' '}
                        <span className="text-[#228b3b] dark:text-[#4ade80] font-semibold">receitas, despesas, veículo, terceiros e compromissos</span>{' '}
                        — tudo organizado bonitinho pra você! 💚
                    </p>

                    {/* Tip chip */}
                    <div className="mt-4 mb-6 flex items-center gap-1.5 bg-[#228b3b]/10 dark:bg-[#228b3b]/20 text-[#1b6d2f] dark:text-[#4ade80] px-3 py-1.5 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                        Seu dinheiro merece ser lembrado 💪
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={onGenerateReport}
                            className="w-full flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-[#228b3b] hover:bg-[#1b6d2f] active:scale-95 text-white font-bold text-base shadow-lg shadow-[#228b3b]/25 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                            Gerar Relatório de {previousMonthLabel}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 active:scale-95 text-gray-600 dark:text-gray-300 font-semibold text-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            Gerar depois
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MonthlyBackupReminderModal;
