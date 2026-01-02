import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category_id: string;
    categories: {
        name: string;
        icon?: string;
        color_theme?: string;
    } | null;
}

const AllTransactions: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (session?.user) {
            fetchTransactions();
        }
    }, [session]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select(`
          *,
          categories (
            name,
            icon,
            color_theme
          )
        `)
                .eq('user_id', session?.user.id)
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                setTransactions(data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

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
                (t.categories?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
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

    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const formatDateTitle = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hoje';
        if (d.toDateString() === yesterday.toDateString()) return 'Ontem';

        const day = d.getDate();
        const month = d.toLocaleDateString('pt-BR', { month: 'long' });
        return `${day} de ${month.charAt(0).toUpperCase() + month.slice(1)}`;
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Apagar transação?")) return;
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
            alert("Erro ao apagar");
        }
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark font-display text-[#111814] dark:text-white transition-colors duration-200">
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

                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-xl">search</span>
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
                                    const style = getCategoryStyle(transaction.categories?.name, transaction.type);
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
                                                    {transaction.categories?.name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-base font-bold ${transaction.type === 'income' ? 'text-primary dark:text-primary' : 'text-[#111814] dark:text-white'}`}>
                                                    {transaction.type === 'expense' ? '- ' : '+ '}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${transaction.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                                                    {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                                                </span>
                                            </div>

                                            {/* Action Buttons (Visible on hover/tap) */}
                                            <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-light/95 dark:bg-surface-dark/95 px-2 rounded-r-xl backdrop-blur-sm">
                                                <button
                                                    onClick={() => navigate('/register', { state: { transaction, type: transaction.type } })}
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
