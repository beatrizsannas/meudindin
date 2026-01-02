import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  account: string;
  category_id: string;
  categories: {
    name: string;
  }
}

interface Category {
  id: string;
  name: string;
}

const ViewExpenses: React.FC = () => {
  const { session } = useAuth();

  // States
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [selectedCategory, setSelectedCategory] = useState('Categoria');
  const [selectedAccount, setSelectedAccount] = useState('Conta');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const accounts = ["Todas", "Conta Corrente", "Cartão Visa", "Crédito Nubank", "Dinheiro"];

  // Helper to map category names to icons/colors
  const getCategoryStyle = (catName: string = '') => {
    const name = catName.toLowerCase();
    if (name.includes('alimentação') || name.includes('supermercado') || name.includes('acompanhamento')) return { icon: 'shopping_cart', colorClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-100 dark:bg-orange-900/20' };
    if (name.includes('transporte') || name.includes('uber') || name.includes('veículo') || name.includes('gasolina')) return { icon: 'directions_car', colorClass: 'text-yellow-600 dark:text-yellow-400', bgClass: 'bg-yellow-100 dark:bg-yellow-900/20' };
    if (name.includes('lazer') || name.includes('netflix') || name.includes('cinema')) return { icon: 'movie', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-100 dark:bg-purple-900/20' };
    if (name.includes('saúde') || name.includes('farmácia')) return { icon: 'medication', colorClass: 'text-pink-600 dark:text-pink-400', bgClass: 'bg-pink-100 dark:bg-pink-900/20' };
    if (name.includes('veículo') || name.includes('posto')) return { icon: 'local_gas_station', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-900/20' };

    // Default
    return { icon: 'category', colorClass: 'text-gray-600 dark:text-gray-400', bgClass: 'bg-gray-100 dark:bg-gray-800' };
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTransactions();
    }
  }, [session, selectedMonthIndex, selectedCategory, selectedAccount]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name').eq('type', 'expense');
      if (data) setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Calculate start and end date of selected month
      const year = new Date().getFullYear(); // Assuming current year for simplicity or add year selector
      const startDate = new Date(year, selectedMonthIndex, 1).toISOString().split('T')[0];
      const endDate = new Date(year, selectedMonthIndex + 1, 0).toISOString().split('T')[0];

      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (name)
        `)
        .eq('user_id', session?.user.id)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (selectedAccount !== 'Conta' && selectedAccount !== 'Todas') {
        query = query.eq('account', selectedAccount);
      }

      // Category filter needs client-side filtering or exact ID match. 
      // If selectedCategory is name, we can filter transaction.categories.name or filter after fetch.
      // Database join filtering requires inner join syntax in supabase which is tricky with empty relations.
      // Let's filter by ID if we mapped names to IDs, but here we just have names in select.
      // We'll filter client-side for simplicity unless data is huge.

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = (data as any[]).map(item => ({
        ...item,
        categories: item.categories || { name: 'Sem Categoria' } // Handle null category
      }));

      if (selectedCategory !== 'Categoria' && selectedCategory !== 'Todas') {
        filteredData = filteredData.filter(t => t.categories?.name === selectedCategory);
      }

      setTransactions(filteredData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by Date for UI
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Sorting dates desc
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const formatDateTitle = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00'); // Prevent timezone shift
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const isToday = d.toDateString() === today.toDateString();

    const day = d.getDate();
    const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

    if (isToday) return `Hoje, ${day} ${month}`;
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
  const navigate = React.useRef(null as any); // UseRef workaround if needed, or better just use useNavigate
  const routerNavigate = React.useMemo(() => {
    // react-router-dom hook usage inside component body
    return null;
  }, []);
  // Actually, let's just use the hook standard way.
  // The file doesn't have useNavigate imported yet.

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apagar despesa?")) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao apagar");
    }
  };

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark font-display min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="cursor-pointer mr-1 p-2 -ml-2 rounded-full hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark text-[#111814] dark:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold text-[#111814] dark:text-white">Ver Despesas</h1>
        </div>
      </div>

      <div className="flex flex-col gap-0 pt-4 px-4 pb-24">
        {/* Filters & Summary */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">

            {/* Month Filter */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-2 bg-[#111814] text-white dark:bg-white dark:text-[#111814] px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-md">
                <span>{months[selectedMonthIndex]}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <select
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-variant-dark transition-colors">
                <span>{selectedCategory}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              >
                <option value="Categoria">Categoria</option>
                <option value="Todas">Todas</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="w-1"></div>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total de saídas</p>
              <h2 className="text-2xl font-bold text-[#111814] dark:text-white">{formatCurrency(totalAmount)}</h2>
            </div>
            <div className="flex flex-col items-end">
              <div className="size-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 mb-1">
                <span className="material-symbols-outlined">trending_down</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Groups */}
        <div className="flex flex-col gap-6">
          {loading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : sortedDates.length === 0 ? (
            <p className="text-center text-gray-500">Nenhuma despesa encontrada.</p>
          ) : (
            sortedDates.map(dateStr => (
              <div key={dateStr} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{formatDateTitle(dateStr)}</h3>
                  <span className="text-xs font-medium text-red-500 dark:text-red-400">
                    - {formatCurrency(groupedTransactions[dateStr].reduce((acc, t) => acc + t.amount, 0))}
                  </span>
                </div>

                {groupedTransactions[dateStr].map(transaction => {
                  const style = getCategoryStyle(transaction.categories?.name);
                  return (
                    <div key={transaction.id} className="relative group flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
                      <div className={`flex items-center justify-center size-12 rounded-full ${style.bgClass} ${style.colorClass} shrink-0`}>
                        <span className="material-symbols-outlined">{style.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-[#111814] dark:text-white truncate">{transaction.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.account || 'Conta'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-red-600 dark:text-red-400">- {formatCurrency(transaction.amount)}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                          {transaction.categories?.name}
                        </span>
                      </div>

                      {/* Action Buttons (Visible on hover/tap) */}
                      <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-light/90 dark:bg-surface-dark/90 px-2 rounded-r-xl">
                        <Link
                          to="/register"
                          state={{ transaction, type: 'expense' }}
                          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default ViewExpenses;