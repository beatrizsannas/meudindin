import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuContext } from '../App';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUserProfile } from '../hooks/useProfile';
import { useTransactions, useTransactionTotals, Transaction } from '../hooks/useTransactions';
import { useCreditCards } from '../hooks/useCreditCards';
import { useNotifications } from '../hooks/useNotifications';
import { useQueryClient } from '@tanstack/react-query';

// Define styles mapping for dynamic rendering
const colorStyles: Record<string, { bg: string, text: string }> = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-500 dark:text-orange-400' },
  green: { bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary-dark dark:text-primary' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500 dark:text-blue-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-500 dark:text-purple-400' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-500 dark:text-gray-400' }
};

const Dashboard: React.FC = () => {
  const [filter, setFilter] = useState('Geral');
  const { openMenu } = useContext(MenuContext);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // React Query Hooks
  const { data: profile } = useUserProfile(session?.user?.id);
  const { data: allTransactions = [], isLoading: transactionsLoading } = useTransactions(session?.user?.id);
  const { data: totals = { income: 0, expense: 0, balance: 0 }, isLoading: totalsLoading } = useTransactionTotals(session?.user?.id);
  const { cards } = useCreditCards(session?.user?.id); // Fetch cards for notifications

  // Filter for Dashboard: Recent 20, not hidden
  // Filter for Dashboard: Recent 20, not hidden, grouped installments
  const transactions = useMemo(() => {
    const installmentRegex = /^(.*?) \((\d+)\/(\d+)\)$/;
    const groups = new Map<string, { total: number, date: string, item: Transaction, baseDesc: string, count: number }>();
    const singles: Transaction[] = [];

    // Helper to get time
    const getTime = (d: string) => new Date(d).getTime();

    // Safety check for future dates: Hide transactions > today (e.g. cloned next month)
    const now = new Date();
    // Use local date to avoid timezone issues (toISOString uses UTC)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    allTransactions.forEach(t => {
      // Exclude excluded global
      if (t.exclude_from_global) return;

      const match = t.description.match(installmentRegex);
      if (match) {
        const baseDesc = match[1];
        // Key: baseDesc + created_at (identifies the batch)
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
      originalDescription: g.item.description, // Keep the raw description for editing
      amount: g.total,
      date: g.date,
      installmentCount: g.count
    }));

    return [...singles, ...groupedList]
      .filter(t => t.date <= todayStr) // Apply filter here: Hides future Singles (Cloned) and future Groups (Scheduled)
      .sort((a, b) => {
        const diffDate = getTime(b.date) - getTime(a.date);
        if (diffDate !== 0) return diffDate;
        return (b.created_at || '').localeCompare(a.created_at || '');
      })
      .slice(0, 20);

  }, [allTransactions]);

  const loading = transactionsLoading || totalsLoading;

  // Derived state
  const userName = profile?.full_name?.split(' ')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url;
  const { balance } = totals; // Keep balance from global totals

  // Calculate Monthly Totals for Dashboard
  const { incomeTotal, expenseTotal } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return allTransactions.reduce(
      (acc, t) => {
        if (t.exclude_from_global) return acc; // Skip hidden transactions

        // Parse transaction date (YYYY-MM-DD string)
        const [tYear, tMonth] = t.date.split('-').map(Number);

        // Check if transaction is in current month/year
        // specific check: tMonth is 1-indexed in date string, currentMonth is 0-indexed
        if (tYear === currentYear && (tMonth - 1) === currentMonth) {
          if (t.type === 'income') {
            acc.incomeTotal += Number(t.amount);
          } else if (t.type === 'expense') {
            acc.expenseTotal += Number(t.amount);
          }
        }
        return acc;
      },
      { incomeTotal: 0, expenseTotal: 0 }
    );
  }, [allTransactions]);

  // Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate notifications
  const { notifications, unreadCount } = useNotifications(session?.user?.id);

  const handleNotification = () => {
    navigate('/notifications');
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTransaction(null), 300); // Wait for animation
  };

  const handleDelete = async () => {
    if (selectedTransaction && window.confirm("Excluir transação?")) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', selectedTransaction.id);

        if (error) throw error;

        // Update local state (optimistic or just wait for refetch)
        // Invalidating queries will trigger refetch
        await queryClient.invalidateQueries({ queryKey: ['transactions'] });

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
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'Geral') return true;
    if (filter === 'Despesas') return t.type === 'expense';
    if (filter === 'Receitas') return t.type === 'income';

    // Vehicle Filters
    if (filter === 'Veículo Manutenção' || filter === 'Veículo Combustível') {
      // Must be vehicle category
      if (t.category?.name !== 'Veículo' && t.category?.name !== 'Veiculo') return false;

      const descLower = t.description.toLowerCase();
      const isFuel = descLower.match(/combustível|abastecimento|gas|fuel|posto/) || t.description.startsWith('Combustível:');

      if (filter === 'Veículo Combustível') return !!isFuel;
      if (filter === 'Veículo Manutenção') return !isFuel; // Default to maintenance if not fuel
    }

    // Fallback for any other valid category names
    return t.category?.name === filter;
  });

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
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 size-2.5 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark animate-pulse"></span>
            )}
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
                <p className="text-sm font-medium tracking-wide opacity-90">Saldo Acumulado</p>
              </div>
              <div className="flex items-baseline gap-1">
                <h1 className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</h1>
              </div>
              <p className="text-[11px] text-primary/60 font-medium">Total histórico de todas as entradas e saídas</p>
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

        {/* Stats — Este Mês */}
        <div className="flex gap-4">
          <Link to="/income" className="flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-green-100 dark:hover:border-green-900/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center size-8 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined text-lg">trending_up</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Receitas</p>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium -mt-0.5 mb-1">Este mês</p>
            <p className="text-lg font-bold text-[#111814] dark:text-white">{formatCurrency(incomeTotal)}</p>
            <p className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 self-start px-1.5 py-0.5 rounded">-- vs mês ant.</p>
          </Link>
          <Link to="/expenses" className="flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center size-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-lg">trending_down</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Despesas</p>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium -mt-0.5 mb-1">Este mês</p>
            <p className="text-lg font-bold text-[#111814] dark:text-white">{formatCurrency(expenseTotal)}</p>
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 self-start px-1.5 py-0.5 rounded">-- vs mês ant.</p>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold leading-tight text-[#111814] dark:text-white">Transações Recentes</h3>
            <Link
              to="/all-transactions"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:brightness-110 transition-all"
            >
              Ver tudo
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilter('Geral')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Geral' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Geral
            </button>
            <button
              onClick={() => setFilter('Despesas')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Despesas' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Despesas
            </button>
            <button
              onClick={() => setFilter('Receitas')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Receitas' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Receitas
            </button>
            <button
              onClick={() => setFilter('Veículo Manutenção')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Veículo Manutenção' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Veículo Manutenção
            </button>
            <button
              onClick={() => setFilter('Veículo Combustível')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Veículo Combustível' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Veículo Combustível
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
                let theme = item.category?.color_theme || 'gray';
                let icon = item.category?.icon || 'receipt';
                let displayDescription = item.description;
                let displayCategoryName = item.category?.name || 'Sem categoria';

                // Handle Vehicle Subtypes Display
                if (item.category?.name === 'Veículo' || item.category?.name === 'Veiculo') {
                  const descLower = item.description.toLowerCase();
                  // Check type based on keywords
                  const isFuel = descLower.match(/combustível|abastecimento|gas|fuel|posto/) || displayDescription.startsWith('Combustível:');
                  const isMaintenance = descLower.match(/manutenção|reparo|oficina|óleo|pneu/) || displayDescription.startsWith('Manutenção:');

                  if (isFuel) {
                    displayCategoryName = 'Veículo Combustível';
                    icon = 'local_gas_station';
                    // Strip prefix if present
                    if (displayDescription.startsWith('Combustível: ')) {
                      displayDescription = displayDescription.replace('Combustível: ', '');
                    }
                  } else if (isMaintenance) {
                    displayCategoryName = 'Veículo Manutenção';
                    icon = 'build';
                    // Strip prefix if present
                    if (displayDescription.startsWith('Manutenção: ')) {
                      displayDescription = displayDescription.replace('Manutenção: ', '');
                    }
                  }
                }

                // If specific filter selected, ensure consistent category name theme if needed
                if (displayCategoryName === 'Veículo Combustível') {
                  // theme = 'orange'; // Optional: Override theme per subtype
                }

                const style = colorStyles[theme];

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
                        <p className="text-sm font-bold text-[#111814] dark:text-white break-words leading-tight">{displayDescription}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400 font-medium">
                          {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.type === 'income' ? 'text-primary dark:text-primary' : 'text-[#111814] dark:text-white'}`}>
                        {item.type === 'expense' ? '-' : '+'} {formatCurrency(Number(item.amount))}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5 text-right uppercase">{displayCategoryName || 'Geral'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {
        isModalOpen && selectedTransaction && (
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
                      {new Date(selectedTransaction.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'numeric', year: 'numeric' })}
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



                  {/* Installment Info if applicable */}
                  {selectedTransaction.installmentCount && selectedTransaction.installmentCount > 1 && (
                    <div className="flex justify-between items-center p-3 rounded-xl bg-surface-variant-light dark:bg-surface-variant-dark/50">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Parcelamento</span>
                      <span className="text-sm font-bold text-[#111814] dark:text-white">
                        {selectedTransaction.installmentCount} Vezes
                      </span>
                    </div>
                  )}
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
                  onClick={() => {
                    const txToEdit = { ...selectedTransaction };
                    // If it's a grouped installment, restore the original description so Regex doesn't break on save
                    if (txToEdit.originalDescription) {
                      txToEdit.description = txToEdit.originalDescription;
                    }
                    navigate('/register', { state: { transaction: txToEdit, type: txToEdit.type } });
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-dark text-[#102217] font-bold text-sm shadow-lg shadow-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg icon-filled">edit</span>
                  Editar
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
};

export default Dashboard;