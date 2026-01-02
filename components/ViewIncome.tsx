import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuContext } from '../App';
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

const ViewIncome: React.FC = () => {
  const { openMenu } = useContext(MenuContext);
  const { session } = useAuth();
  const navigate = useNavigate();

  // Filter States
  const [selectedRange, setSelectedRange] = useState('Este Mês');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to map income categories to icons/colors
  const getCategoryStyle = (catName: string = '') => {
    const name = catName.toLowerCase();
    if (name.includes('salário') || name.includes('emprego')) return { icon: 'work', colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-900/20' };
    if (name.includes('freelance') || name.includes('extra') || name.includes('projeto')) return { icon: 'laptop_mac', colorClass: 'text-teal-600 dark:text-teal-400', bgClass: 'bg-teal-100 dark:bg-teal-900/20' };
    if (name.includes('venda') || name.includes('olx')) return { icon: 'sell', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-900/20' };
    if (name.includes('investimento') || name.includes('fii') || name.includes('dividendo')) return { icon: 'trending_up', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-100 dark:bg-purple-900/20' };

    // Default
    return { icon: 'attach_money', colorClass: 'text-gray-600 dark:text-gray-400', bgClass: 'bg-gray-100 dark:bg-gray-800' };
  };

  useEffect(() => {
    if (session?.user) {
      fetchTransactions();
    }
  }, [session, selectedRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const today = new Date();
      let startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      let endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      if (selectedRange === 'Mês Passado') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      } else if (selectedRange === 'Últimos 3 Meses') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
        // End date remains end of current month
      } else if (selectedRange === '2023') { // Example year
        // Ideally dynamic or just ignore for simplicity in prototype
        startDate = '2023-01-01';
        endDate = '2023-12-31';
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name)
        `)
        .eq('user_id', session?.user.id)
        .eq('type', 'income')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      const mappedData = (data as any[]).map(item => ({
        ...item,
        categories: item.categories || { name: 'Receita' }
      }));

      setTransactions(mappedData);
    } catch (error) {
      console.error('Error fetching income:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }); // e.g., 05 Out
  };

  const handleNewIncome = () => {
    navigate('/register', { state: { type: 'income' } });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apagar receita?")) return;
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
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark font-display">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-sm p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="cursor-pointer mr-1 p-2 -ml-2 rounded-full hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark text-[#111814] dark:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-[#111814] dark:text-white">Receitas</h2>
        </div>
        <button
          onClick={openMenu}
          className="cursor-pointer flex items-center justify-center rounded-full size-10 hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark transition-colors relative"
        >
          <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">menu</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-2 pb-24">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#102217] to-[#0e3b25] dark:from-[#1c3326] dark:to-[#102217] p-6 shadow-lg text-white">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 size-32 rounded-full bg-primary/5 blur-xl"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-primary">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <p className="text-sm font-medium tracking-wide opacity-90">Total em {selectedRange}</p>
                </div>
                {/* <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">+12%</span> */}
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                {/* <span className="text-sm font-light text-gray-400">R$</span> */}
                <h1 className="text-4xl font-bold tracking-tight">{formatCurrency(totalIncome)}</h1>
              </div>
            </div>
            <button
              onClick={handleNewIncome}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-[#102217] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl icon-filled">add</span>
              <span>Nova Receita</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          <div className="shrink-0 relative">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="appearance-none bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-4 pr-10 text-sm font-bold shadow-sm focus:border-primary focus:ring-primary text-gray-700 dark:text-white"
            >
              <option>Este Mês</option>
              <option>Mês Passado</option>
              <option>Últimos 3 Meses</option>
              {/* <option>2023</option> */}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-500 pointer-events-none text-lg">calendar_month</span>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold leading-tight text-[#111814] dark:text-white">Histórico</h3>
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>Ordenado por data</span>
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-center text-gray-500">Carregando...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500">Nenhuma receita encontrada para este período.</p>
            ) : (
              transactions.map(transaction => {
                const style = getCategoryStyle(transaction.categories?.name);
                return (
                  <div key={transaction.id} className="relative group flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
                    <div className={`flex items-center justify-center size-12 rounded-full ${style.bgClass} ${style.colorClass} shrink-0`}>
                      <span className="material-symbols-outlined icon-filled">{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-[#111814] dark:text-white truncate">{transaction.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-green-600 dark:text-green-400">+ {formatCurrency(transaction.amount)}</p>
                      <p className="text-xs font-medium text-gray-400">{transaction.categories?.name}</p>
                    </div>

                    {/* Action Buttons (Visible on hover/tap) */}
                    <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-light/90 dark:bg-surface-dark/90 px-2 rounded-r-xl">
                      <button
                        onClick={() => navigate('/register', { state: { transaction, type: 'income' } })}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default ViewIncome;