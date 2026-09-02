import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import { useTransactions, Transaction } from '../hooks/useTransactions';
import { useQueryClient } from '@tanstack/react-query';



const AllTransactions: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // React Query
    const queryClient = useQueryClient();
    const { data: allTransactions = [], isLoading } = useTransactions(session?.user?.id);
    const loading = isLoading;

    // Local Filter State
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>('Todos'); // '0', '1', ... '11' or 'Todos'
    const [selectedYear, setSelectedYear] = useState<string>('Todos'); // '2024', '2025' or 'Todos'

    const months = [
        { value: '0', label: 'Janeiro' },
        { value: '1', label: 'Fevereiro' },
        { value: '2', label: 'Março' },
        { value: '3', label: 'Abril' },
        { value: '4', label: 'Maio' },
        { value: '5', label: 'Junho' },
        { value: '6', label: 'Julho' },
        { value: '7', label: 'Agosto' },
        { value: '8', label: 'Setembro' },
        { value: '9', label: 'Outubro' },
        { value: '10', label: 'Novembro' },
        { value: '11', label: 'Dezembro' },
    ];

    const currentYear = new Date().getFullYear();
    const years = ['Todos', String(currentYear + 1), String(currentYear), String(currentYear - 1), String(currentYear - 2)];

    // Filter Logic
    // Filter Logic
    // const transactions = allTransactions.filter(t => !t.exclude_from_global); (OLD)

    // Group installments similar to Dashboard
    const initialTransactions = useMemo(() => {
        const installmentRegex = /^(.*?) \((\d+)\/(\d+)\)$/;
        const groups = new Map<string, { total: number, date: string, item: Transaction, baseDesc: string, count: number }>();
        const singles: Transaction[] = [];

        // Helper to get time
        const getTime = (d: string) => new Date(d).getTime();

        allTransactions.forEach(t => {
            if (t.exclude_from_global) return;

            const match = t.description.match(installmentRegex);
            if (match) {
                const baseDesc = match[1];
                // Key: baseDesc + created_at (ids the batch)
                const key = `${baseDesc}|${t.created_at || 'unknown'}`;

                if (!groups.has(key)) {
                    groups.set(key, {
                        total: 0,
                        date: t.date,
                        item: t,
                        baseDesc,
                        count: 0
                    });
                }

                const group = groups.get(key)!;
                group.total += Number(t.amount);
                group.count += 1;
                // Find earliest date (purchase date)
                if (getTime(t.date) < getTime(group.date)) {
                    group.date = t.date;
                }
            } else {
                singles.push(t);
            }
        });

        const groupedList = Array.from(groups.values()).map(g => ({
            ...g.item,
            description: g.baseDesc,
            originalDescription: g.item.description, // Keep raw desc
            amount: g.total,
            date: g.date,
            installmentCount: g.count
        }));

        return [...singles, ...groupedList]
            .sort((a, b) => {
                const diffDate = getTime(b.date) - getTime(a.date);
                if (diffDate !== 0) return diffDate;
                return (b.created_at || '').localeCompare(a.created_at || '');
            });

    }, [allTransactions]);

    const transactions = initialTransactions;

    const getCategoryStyle = (catName: string = '', type: string) => {
        const name = catName.toLowerCase();

        // Custom mapping matching the user's HTML example colors where possible
        if (name.includes('alimentação') || name.includes('supermercado')) return { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', icon: 'shopping_bag' };
        if (name.includes('salário') || name.includes('trabalho')) return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'attach_money' };
        if (name.includes('transporte') || name.includes('posto') || name.includes('combustível')) return { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'local_gas_station' };
        if (name.includes('lazer') || name.includes('netflix') || name.includes('cinema')) return { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'movie' };
        if (name.includes('refeição') || name.includes('almoço') || name.includes('restaurante')) return { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', icon: 'restaurant' };
        if (name.includes('freela') || name.includes('projeto')) return { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', icon: 'work' };

        // Default based on type
        if (type === 'income') return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'attach_money' };
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: 'category' };
    };

    const filterTransactions = () => {
        return transactions.filter(t => {
            const matchesType = filterType === 'all' || t.type === filterType;
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Date Filter
            const d = new Date(t.date + 'T12:00:00');
            const matchesMonth = selectedMonth === 'Todos' || d.getMonth() === parseInt(selectedMonth);
            const matchesYear = selectedYear === 'Todos' || d.getFullYear() === parseInt(selectedYear);

            return matchesType && matchesSearch && matchesMonth && matchesYear;
        });
    };

    const groupedTransactions = filterTransactions().reduce((groups, transaction) => {
        const date = transaction.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {} as Record<string, Transaction[]>);

    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const formatDateTitle = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // For future dates logic if needed, but simple Date string is fine
        const day = d.getDate();
        const month = d.toLocaleDateString('pt-BR', { month: 'long' });
        const year = d.getFullYear();

        // Show year if not current year, strictly speaking user asked for flow "today -> future"
        // But the format logic mainly handles "Relative" titles.
        if (d.toDateString() === today.toDateString()) return 'Hoje';
        if (d.toDateString() === yesterday.toDateString()) return 'Ontem';

        return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} ${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() : ''}`;
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Apagar transação?")) return;
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['transactions'] });

            showToast("Transação apagada com sucesso!", "success");
        } catch (err) {
            console.error(err);
            showToast("Erro ao apagar", "error");
        }
    };

    return (
        <div className="flex flex-col w-full font-display text-[#111814] dark:text-white transition-colors duration-200">
            <div className="sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-sm p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <button
                        className="flex items-center justify-center size-10 rounded-full hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark transition-colors text-gray-700 dark:text-gray-200"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold flex-1 text-center pr-10">Todas as Transações</h1>
                </div>
            </div>

            <div className="px-4 py-3">
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-full font-bold text-sm shadow-sm transition-colors ${filterType === 'all' ? 'bg-[#111814] dark:bg-white text-white dark:text-[#111814]' : 'bg-surface-variant-light dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                    >
                        Tudo
                    </button>
                    <button
                        onClick={() => setFilterType('income')}
                        className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-full font-bold text-sm shadow-sm transition-colors ${filterType === 'income' ? 'bg-[#111814] dark:bg-white text-white dark:text-[#111814]' : 'bg-surface-variant-light dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                    >
                        Receitas
                    </button>
                    <button
                        onClick={() => setFilterType('expense')}
                        className={`flex h-9 shrink-0 items-center justify-center px-5 rounded-full font-bold text-sm shadow-sm transition-colors ${filterType === 'expense' ? 'bg-[#111814] dark:bg-white text-white dark:text-[#111814]' : 'bg-surface-variant-light dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                    >
                        Despesas
                    </button>
                </div>

                {/* Date Filters */}
                <div className="flex gap-3 mb-4 overflow-x-auto scrollbar-hide">
                    <div className="relative shrink-0">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-surface-variant-light dark:bg-surface-variant-dark border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-4 pr-8 text-sm font-bold shadow-sm focus:border-primary focus:ring-primary text-gray-700 dark:text-gray-200 outline-none"
                        >
                            <option value="Todos">Mês: Todos</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative shrink-0">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-surface-variant-light dark:bg-surface-variant-dark border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-4 pr-8 text-sm font-bold shadow-sm focus:border-primary focus:ring-primary text-gray-700 dark:text-gray-200 outline-none"
                        >
                            <option value="Todos">Ano: Todos</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y === 'Todos' ? 'Todos' : y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-xl">search</span>
                    <input
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary text-sm shadow-sm placeholder-gray-400 dark:text-white outline-none"
                        placeholder="Buscar transação..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-6 px-4 pt-2">
                {loading ? (
                    <p className="text-center text-gray-500 mt-10">Carregando...</p>
                ) : sortedDates.length === 0 ? (
                    <p className="text-center text-gray-500 mt-10">Nenhuma transação encontrada.</p>
                ) : (
                    sortedDates.map(dateStr => (
                        <div key={dateStr}>
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">{formatDateTitle(dateStr)}</h3>
                            <div className="flex flex-col gap-3">
                                {groupedTransactions[dateStr].map(transaction => {
                                    const style = getCategoryStyle(transaction.category?.name, transaction.type);
                                    return (
                                        <div key={transaction.id} className="relative group flex items-center gap-4 p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-gray-200 dark:hover:border-gray-700">
                                            <div className={`flex items-center justify-center size-12 rounded-full ${style.bg} ${style.text} shrink-0`}>
                                                <span className="material-symbols-outlined">{style.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-base font-bold text-[#111814] dark:text-white truncate">{transaction.description}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {/* Mocking time if not present, or just showing category */}
                                                    {transaction.category?.name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {/* WCAG: emerald-700 sobre white = ~5.8:1 ✅ */}
                                                <p className={`text-base font-bold ${transaction.type === 'income' ? 'text-emerald-700 dark:text-primary' : 'text-[#111814] dark:text-white'}`}>
                                                    {transaction.type === 'expense' ? '- ' : '+ '}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                {/* WCAG: text-red-700 sobre red-100 = ~5.9:1 ✅ */}
                                                <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-lg ${transaction.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'}`}>
                                                    {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                                                </span>
                                            </div>

                                            {/* Action Buttons (Visible on hover/tap) */}
                                            <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-light/95 dark:bg-surface-dark/95 px-2 rounded-r-xl backdrop-blur-sm">
                                                <button
                                                    onClick={() => {
                                                        const txToEdit = { ...transaction };
                                                        if (txToEdit.originalDescription) {
                                                            txToEdit.description = txToEdit.originalDescription;
                                                        }
                                                        navigate('/register', { state: { transaction: txToEdit, type: transaction.type } });
                                                    }}
                                                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(transaction.id)}
                                                    className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                                    title="Apagar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="h-6"></div>
        </div>
    );
};

export default AllTransactions;
