import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto close after 3 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-800 dark:text-green-200',
            icon: 'check_circle',
            iconColor: 'text-green-600 dark:text-green-400'
        },
        error: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-800 dark:text-red-200',
            icon: 'error',
            iconColor: 'text-red-600 dark:text-red-400'
        },
        warning: {
            bg: 'bg-yellow-100 dark:bg-yellow-900/30',
            text: 'text-yellow-800 dark:text-yellow-200',
            icon: 'warning',
            iconColor: 'text-yellow-600 dark:text-yellow-400'
        },
        info: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-800 dark:text-blue-200',
            icon: 'info',
            iconColor: 'text-blue-600 dark:text-blue-400'
        }
    };

    const style = styles[type];

    return (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 ${style.bg} border border-transparent dark:border-white/5 min-w-[320px] max-w-[90vw]`}>
            <span className={`material-symbols-outlined text-2xl ${style.iconColor} icon-filled`}>
                {style.icon}
            </span>
            <p className={`text-sm font-bold ${style.text} flex-1`}>
                {message}
            </p>
            <button onClick={onClose} className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${style.text}`}>
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
};

export default Toast;
