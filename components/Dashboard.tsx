import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuContext } from '../App';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Define styles mapping for dynamic rendering
const colorStyles: Record<string, { bg: string, text: string }> = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-500 dark:text-orange-400' },
  green: { bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary-dark dark:text-primary' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500 dark:text-blue-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-500 dark:text-purple-400' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-500 dark:text-gray-400' }
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  account: string;
  category_id: string;
  category: {
    name: string;
    icon: string;
    color_theme: string;
  } | null;
}

const Dashboard: React.FC = () => {
  const [filter, setFilter] = useState('Geral');
  const { openMenu } = useContext(MenuContext);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();

  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  // Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchTransactions();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session?.user.id)
        .single();

      if (data) {
        setUserName(data.full_name?.split(' ')[0] || 'Usuário');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          type,
          date,
          account,
          category_id,
          category:categories (
            name,
            icon,
            color_theme
          )
        `)
        .eq('user_id', session?.user.id)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        // Keep date raw for passing to Edit screen, format only for display
        const mappedTransactions: Transaction[] = data.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.date, // Keep raw YYYY-MM-DD
          account: t.account,
          category_id: t.category_id,
          category: t.category
        }));
        setTransactions(mappedTransactions);
        calculateTotals(mappedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Note: For real separate totals we should query the DB with aggregation, 
  // but for now creating a sum from recent transactions + simplified logic
  // Ideally we create a separate function to get full totals not just recent limit(20)
  const calculateTotals = async (recentTransactions: Transaction[]) => {
    // Fetch full aggregates
    const { data: incomeData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', session?.user.id)
      .eq('type', 'income');

    const { data: expenseData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', session?.user.id)
      .eq('type', 'expense');

    const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
    const totalExpense = expenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    setIncomeTotal(totalIncome);
    setExpenseTotal(totalExpense);
    setBalance(totalIncome - totalExpense);
  };

  const handleNotification = () => {
    showToast("Você tem 0 novas notificações.", "info");
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300); // Wait for animation
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      navigate('/register', { state: { transaction: selectedTransaction, type: selectedTransaction.type } });
    }
  };

  const handleDelete = async () => {
    if (selectedTransaction && window.confirm("Excluir transação?")) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', selectedTransaction.id);

        if (error) throw error;

        // Update local state
        setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
        calculateTotals(transactions.filter(t => t.id !== selectedTransaction.id));
        fetchTransactions();
        handleCloseModal();
        showToast("Transação excluída com sucesso!", "success");
      } catch (error) {
        console.error('Error deleting:', error);
        showToast('Erro ao excluir transação.', "error");
      }
    }
  };

  // Filtering Logic
  // Adapting to real data: Filter by category Name
  const filteredTransactions = filter === 'Geral'
    ? transactions
    : transactions.filter(t => t.category?.name === filter);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={openMenu}
            className="p-1 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-3xl">menu</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 ring-2 ring-white dark:ring-surface-dark shadow-sm"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                ></div>
              ) : (
                <div className="flex items-center justify-center size-12 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark shadow-sm">
                  <span className="text-white dark:text-[#102217] font-bold text-lg">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark"></div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">Bem-vindo(a),</p>
              <h2 className="text-xl font-extrabold leading-tight text-[#111814] dark:text-white">{userName || '...'}!</h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNotification}
            className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-[28px] icon-filled">notifications</span>
            {/* <span className="absolute top-2 right-2.5 size-2.5 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark"></span> */}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#102217] to-[#1c3326] dark:from-[#1c3326] dark:to-[#102217] p-6 shadow-lg text-white">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 size-32 rounded-full bg-primary/5 blur-xl"></div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                <p className="text-sm font-medium tracking-wide opacity-90">Saldo Atual</p>
              </div>
              <div className="flex items-baseline gap-1">
                <h1 className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</h1>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                onClick={() => navigate('/register', { state: { type: 'expense' } })}
                startIcon="remove_circle"
                className="shadow-md shadow-red-500/20"
              >
                Despesa
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/register', { state: { type: 'income' } })}
                startIcon="add_circle"
                className="shadow-md shadow-primary/20 text-[#102217]"
              >
                Receita
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <Link to="/income" className="flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-green-100 dark:hover:border-green-900/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined text-lg">trending_up</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Receitas</p>
            </div>
            <p className="text-lg font-bold text-[#111814] dark:text-white">{formatCurrency(incomeTotal)}</p>
            {/* Placeholder stats */}
            <p className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 self-start px-1.5 py-0.5 rounded">-- vs mês ant.</p>
          </Link>
          <Link to="/expenses" className="flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-lg">trending_down</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Despesas</p>
            </div>
            <p className="text-lg font-bold text-[#111814] dark:text-white">{formatCurrency(expenseTotal)}</p>
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 self-start px-1.5 py-0.5 rounded">-- vs mês ant.</p>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold leading-tight text-[#111814] dark:text-white">Transações Recentes</h3>
            <Link to="/all-transactions" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">Ver tudo</Link>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilter('Geral')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Geral' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Geral
            </button>
            <button
              onClick={() => setFilter('Veículo')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Veículo' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <span className="material-symbols-outlined text-sm mr-1.5">directions_car</span>
              Veículo
            </button>
            <button
              onClick={() => setFilter('Cartões')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Cartões' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <span className="material-symbols-outlined text-sm mr-1.5">credit_card</span>
              Cartões
            </button>
          </div>

          <div className="flex flex-col gap-3 pb-6">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Carregando...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhuma transação encontrada.
              </div>
            ) : (
              filteredTransactions.map((item) => {
                // Determine style based on category theme, fallback to gray
                const theme = item.category?.color_theme || 'gray';
                const style = colorStyles[theme];
                const icon = item.category?.icon || 'receipt';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleTransactionClick(item)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-card border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className={`flex items-center justify-center size-12 rounded-full shrink-0 ${style.bg} ${style.text}`}>
                      <span className="material-symbols-outlined icon-filled">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#111814] dark:text-white break-words leading-tight">{item.description}</p>
                        {item.category?.name && item.category.name !== 'Outros' && (
                          <span className={`bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide`}>
                            {item.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.type === 'income' ? 'text-primary dark:text-primary' : 'text-[#111814] dark:text-white'}`}>
                        {item.type === 'expense' ? '-' : '+'} {formatCurrency(Number(item.amount))}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5">{item.account || 'Conta'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#102217]/60 backdrop-blur-[2px]"
            onClick={handleCloseModal}
          ></div>
          <div className="relative w-full max-w-[340px] bg-surface-light dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="text-lg font-bold text-[#111814] dark:text-white">Resumo da Transação</h3>
              <button
                onClick={handleCloseModal}
                className="flex items-center justify-center size-8 rounded-full bg-surface-variant-light dark:bg-surface-variant-dark hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center px-6 py-4">
              {/* Dynamic Icon */}
              <div className={`flex items-center justify-center size-16 rounded-full ${colorStyles[selectedTransaction.category?.color_theme || 'gray'].bg
                } ${colorStyles[selectedTransaction.category?.color_theme || 'gray'].text
                } mb-4 shadow-inner`}>
                <span className="material-symbols-outlined text-3xl">
                  {selectedTransaction.category?.icon || 'receipt'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#111814] dark:text-white text-center mb-1">
                {selectedTransaction.description}
              </h2>

              <span className={`px-3 py-1 rounded-full ${selectedTransaction.type === 'expense'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                } text-xs font-bold uppercase tracking-wide mb-4`}>
                {selectedTransaction.type === 'expense' ? 'Despesa' : 'Receita'}
              </span>

              <div className="text-4xl font-bold text-[#111814] dark:text-white tracking-tight mb-8">
                {formatCurrency(Number(selectedTransaction.amount))}
              </div>

              <div className="w-full flex flex-col gap-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-variant-light dark:bg-surface-variant-dark/50">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Data</span>
                  <span className="text-sm font-bold text-[#111814] dark:text-white">
                    {new Date(selectedTransaction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-variant-light dark:bg-surface-variant-dark/50">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoria</span>
                  <div className="flex items-center gap-2">
                    {/* Dot color based on category theme if possible, else gray */}
                    <span className={`size-2 rounded-full ${selectedTransaction.category?.color_theme === 'orange' ? 'bg-orange-500' : 'bg-gray-500'}`}></span>
                    <span className="text-sm font-bold text-[#111814] dark:text-white">
                      {selectedTransaction.category?.name || 'Sem categoria'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-surface-variant-light dark:bg-surface-variant-dark/50">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagamento</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-gray-400">account_balance</span>
                    <span className="text-sm font-bold text-[#111814] dark:text-white">{selectedTransaction.account || 'Conta Corrente'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Excluir
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-dark text-[#102217] font-bold text-sm shadow-lg shadow-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-lg icon-filled">edit</span>
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;