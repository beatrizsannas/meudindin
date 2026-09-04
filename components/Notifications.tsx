import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(session?.user?.id);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 pb-24">
            <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[#111814] dark:text-white">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-[#111814] dark:text-white">Notificações</h1>
                </div>

                {unreadCount > 1 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs font-bold text-emerald-700 dark:text-primary hover:text-emerald-800 dark:hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-primary/10"
                    >
                        Marcar todas como lidas
                    </button>
                )}
            </header>

            <main className="px-6 pt-4 flex flex-col gap-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-2 gap-5">
                        <div className="flex items-center justify-center size-20 rounded-full bg-orange-50 dark:bg-orange-900/20">
                            <span className="material-symbols-outlined text-5xl text-orange-400 dark:text-orange-300">notifications_off</span>
                        </div>
                        <div className="flex flex-col gap-3 text-center">
                            <p className="text-base font-bold text-[#111814] dark:text-white leading-snug">
                                Nenhuma notificação por enquanto
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                As notificações são exclusivas dos seus cartões de crédito — só aparecerá aqui lembretes quando faltar <span className="font-bold text-orange-500 dark:text-orange-400">2 dias</span> para você pagar a sua fatura.
                            </p>
                        </div>
                        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 rounded-2xl p-4 text-left w-full">
                            <span className="material-symbols-outlined text-2xl text-primary shrink-0 mt-0.5 icon-filled">credit_card</span>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                Cadastre seus cartões na aba do <span className="font-bold text-[#111814] dark:text-white">menu lateral</span> para nunca mais esquecer de pagar 😊
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4 text-left w-full">
                            <span className="material-symbols-outlined text-2xl text-emerald-700 dark:text-primary shrink-0 mt-0.5">info</span>
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                                Você sempre saberá 2 dias antes da data do vencimento quais cartões que você tem para pagar, não precisa mais gastar sua memória com isso :)
                            </p>
                        </div>
                        {notifications.map(item => (
                            <div
                                key={item.id}
                                onClick={() => !item.isRead && markAsRead(item.id)}
                                className={`p-4 rounded-xl shadow-sm border flex items-start gap-4 transition-all duration-300 cursor-pointer active:scale-[0.98] ${item.isRead
                                        ? 'bg-gray-50 dark:bg-surface-dark/50 border-gray-100 dark:border-gray-800 opacity-60 grayscale'
                                        : 'bg-white dark:bg-surface-dark border-orange-100 dark:border-orange-900/30'
                                    }`}
                            >
                                <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${item.isRead
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                    }`}>
                                    <span className="material-symbols-outlined">
                                        {item.isRead ? 'notifications' : 'warning'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${item.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-[#111814] dark:text-white'}`}>
                                        {item.title}
                                    </h3>
                                    <p className={`text-sm mt-1 ${item.isRead ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {item.message}
                                    </p>
                                    {/* WCAG: orange-700 sobre white = ~4.8:1 ✅ */}
                                    <p className={`text-xs mt-2 font-bold ${item.isRead ? 'text-gray-500' : 'text-orange-700 dark:text-orange-400'}`}>
                                        Vencimento: {item.date}
                                    </p>
                                </div>
                                {!item.isRead && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(item.id);
                                        }}
                                        className="p-1 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                        title="Marcar como lida"
                                    >
                                        <span className="material-symbols-outlined text-xl">check_circle</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
};

export default Notifications;
