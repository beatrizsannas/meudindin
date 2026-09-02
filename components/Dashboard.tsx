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

  const [showBalanceModal, setShowBalanceModal] = useState(false); // Modal do Saldo Global

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
      .slice(0, 10);

  }, [allTransactions]);

  const loading = transactionsLoading || totalsLoading;

  // Derived state
  const userName = profile?.full_name?.split(' ')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url;
  const { balance } = totals; // Keep balance from global totals

  // Calculate Monthly Totals for Dashboard
  const { incomeTotal, expenseTotal, prevIncomeTotal, prevExpenseTotal } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }

    return allTransactions.reduce(
      (acc, t) => {
        if (t.exclude_from_global) return acc; // Skip hidden transactions

        // Parse transaction date (YYYY-MM-DD string)
        const [tYear, tMonth] = t.date.split('-').map(Number);
        const txMonthIndex = tMonth - 1;

        // Check if transaction is in current month/year
        if (tYear === currentYear && txMonthIndex === currentMonth) {
          if (t.type === 'income') {
            acc.incomeTotal += Number(t.amount);
          } else if (t.type === 'expense') {
            acc.expenseTotal += Number(t.amount);
          }
        }
        // Check if transaction is in previous month/year
        else if (tYear === prevYear && txMonthIndex === prevMonth) {
          if (t.type === 'income') {
            acc.prevIncomeTotal += Number(t.amount);
          } else if (t.type === 'expense') {
            acc.prevExpenseTotal += Number(t.amount);
          }
        }
        return acc;
      },
      { incomeTotal: 0, expenseTotal: 0, prevIncomeTotal: 0, prevExpenseTotal: 0 }
    );
  }, [allTransactions]);

  const currentBalance = incomeTotal - expenseTotal;

  const calculatePercentage = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return '0%';
      return '+100%';
    }
    const ratio = ((current - previous) / previous) * 100;
    const sign = ratio > 0 ? '+' : '';
    return `${sign}${ratio.toFixed(0)}%`;
  };

  const incomePercentage = calculatePercentage(incomeTotal, prevIncomeTotal);
  const expensePercentage = calculatePercentage(expenseTotal, prevExpenseTotal);
  const incomeTrendUp = incomeTotal >= prevIncomeTotal;
  const expenseTrendUp = expenseTotal >= prevExpenseTotal;

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

  const globalTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    return allTransactions
      .filter(t => !t.exclude_from_global && t.date <= today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions]);

  // Skeleton screen enquanto os dados do Supabase ainda estão carregando
  if (loading) {
    return (
      <div className="flex flex-col gap-6 pt-2 pb-28 animate-pulse">
        {/* Header skeleton */}
        <div className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
          <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="flex flex-col gap-6 px-6">
          {/* Balance card skeleton */}
          <div className="rounded-xl bg-gradient-to-br from-[#102217] to-[#1c3326] p-6 shadow-lg">
            <div className="flex flex-col gap-4">
              <div className="h-3 w-32 rounded-full bg-white/20" />
              <div className="h-10 w-48 rounded-full bg-white/20" />
              <div className="h-3 w-40 rounded-full bg-white/10" />
              <div className="flex gap-3 mt-2">
                <div className="flex-1 h-11 rounded-xl bg-white/10" />
                <div className="flex-1 h-11 rounded-xl bg-white/10" />
              </div>
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="flex gap-4">
            <div className="flex-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card flex flex-col gap-2">
              <div className="h-3 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card flex flex-col gap-2">
              <div className="h-3 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          {/* Transactions skeleton */}
          <div className="flex flex-col gap-3">
            <div className="h-5 w-40 rounded-full bg-gray-200 dark:bg-gray-700" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-card">
                <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3.5 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
                  {/* WCAG fix: text-[#0a2018] sobre #0df26c = contraste ~8.1:1 ✅ */}
                  <span className="text-[#0a2018] font-bold text-lg">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-background-light dark:border-background-dark"></div>
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
        <div
          onClick={() => setShowBalanceModal(true)}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d2019] via-[#102217] to-[#1a3326] p-6 shadow-xl text-white cursor-pointer hover:shadow-2xl hover:brightness-105 transition-all duration-300 active:scale-[0.98] border border-white/5"
        >
          {/* Decorative blobs */}
          <div className="absolute -right-8 -top-8 size-48 rounded-full bg-primary/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-8 -bottom-8 size-36 rounded-full bg-primary/8 blur-2xl pointer-events-none"></div>
          <div className="absolute right-6 bottom-16 size-20 rounded-full bg-emerald-400/5 blur-xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-7 rounded-lg bg-primary/20">
                  <span className="material-symbols-outlined text-primary text-base icon-filled">account_balance_wallet</span>
                </div>
                {/* WCAG: texto #a8f0c8 sobre #102217 = ~7.8:1 ✅ */}
                <p className="text-xs font-semibold tracking-widest uppercase text-[#a8f0c8]">Saldo Acumulado</p>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <h1 className="text-4xl font-extrabold tracking-tight text-white">{formatCurrency(currentBalance)}</h1>
              </div>
              {/* WCAG fix: removido opacity-60, usando cor com contraste adequado */}
              <p className="text-[11px] text-[#6dbf8f] font-medium">Toque para ver o histórico completo</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                onClick={(e) => { e.stopPropagation(); navigate('/register', { state: { type: 'expense' } }); }}
                startIcon="remove_circle"
                className="shadow-lg shadow-red-900/30 bg-red-500 hover:bg-red-400"
              >
                Despesa
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={(e) => { e.stopPropagation(); navigate('/register', { state: { type: 'income' } }); }}
                startIcon="add_circle"
                className="shadow-lg shadow-primary/30"
              >
                Receita
              </Button>
            </div>
          </div>
        </div>

        {/* Stats — Este Mês */}
        <div className="flex gap-3">
          <Link to="/income" className="flex-1 flex flex-col gap-2 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800/50 group">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200">
                <span className="material-symbols-outlined text-lg icon-filled">trending_up</span>
              </div>
              {/* WCAG: text-gray-600 sobre white = ~5.9:1 ✅ */}
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Receitas</p>
            </div>
            {/* WCAG: text-gray-500 = ~4.6:1 ✅ */}
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Este mês</p>
            <p className="text-lg font-extrabold text-[#111814] dark:text-white">{formatCurrency(incomeTotal)}</p>
            <p className={`text-[11px] font-bold self-start px-2 py-0.5 rounded-lg ${incomeTrendUp ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/15'}`}>
              {incomePercentage} vs mês ant.
            </p>
          </Link>
          <Link to="/expenses" className="flex-1 flex flex-col gap-2 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-800/50 group">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-9 rounded-xl bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-200">
                <span className="material-symbols-outlined text-lg icon-filled">trending_down</span>
              </div>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Despesas</p>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Este mês</p>
            <p className="text-lg font-extrabold text-[#111814] dark:text-white">{formatCurrency(expenseTotal)}</p>
            <p className={`text-[11px] font-bold self-start px-2 py-0.5 rounded-lg ${expenseTrendUp ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/15' : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'}`}>
              {expensePercentage} vs mês ant.
            </p>
          </Link>
        </div>



        {/* Recent Transactions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold leading-tight text-[#111814] dark:text-white">Transações Recentes</h3>
            {/* WCAG: text-emerald-800 sobre emerald-100 = ~7.2:1 ✅ */}
            <Link
              to="/all-transactions"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-all"
            >
              Ver tudo
            </Link>
          </div>

          {/* WCAG: filtro ativo text-[#0a2018] sobre #0df26c = ~8.1:1 ✅ */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {(['Geral', 'Despesas', 'Receitas', 'Veículo Manutenção', 'Veículo Combustível'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex h-8 shrink-0 items-center justify-center px-4 rounded-full font-bold text-xs transition-all duration-200 ${
                  filter === f
                    ? 'bg-primary text-[#0a2018] shadow-md shadow-primary/25 scale-[1.03]'
                    : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
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
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-card border border-gray-100/80 dark:border-gray-800/60 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  >
                    <div className={`flex items-center justify-center size-11 rounded-2xl shrink-0 ${style.bg} ${style.text}`}>
                      <span className="material-symbols-outlined icon-filled text-[20px]">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111814] dark:text-white truncate leading-tight">{displayDescription}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {/* WCAG: text-gray-500 sobre white = ~4.6:1 ✅ */}
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                        <span className="text-gray-300 dark:text-gray-600 text-[11px]">•</span>
                        {/* WCAG: text-gray-500 uppercase = ~4.6:1 ✅ */}
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{displayCategoryName || 'Geral'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {/* WCAG: income usa emerald-700 sobre white = ~5.8:1 ✅ */}
                      <p className={`text-sm font-extrabold ${item.type === 'income' ? 'text-emerald-700 dark:text-primary' : 'text-[#111814] dark:text-white'}`}>
                        {item.type === 'expense' ? '-' : '+'} {formatCurrency(Number(item.amount))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Link para extrato completo — WCAG: texto #3d6b56 sobre branco = ~5.2:1 ✅ */}
          <Link
            to="/settings"
            state={{ openExport: true }}
            className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/15 border border-emerald-200 dark:border-emerald-800/50 text-sm font-bold text-emerald-800 dark:text-emerald-300 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/25 transition-all duration-200 active:scale-[0.98] group"
          >
            <span className="material-symbols-outlined text-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200 icon-filled">summarize</span>
            Acesse aqui seu extrato completo
            <span className="material-symbols-outlined text-base text-emerald-500 dark:text-emerald-500">chevron_right</span>
          </Link>
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

      {/* Modal de Detalhes do Saldo Global */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowBalanceModal(false)}>
          <div
            className="bg-white dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-8 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Drag Handle (Mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <span className="material-symbols-outlined icon-filled">account_balance_wallet</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111814] dark:text-white">Formação do Saldo</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Todas as entradas e saídas do Acumulado</p>
                </div>
              </div>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-[#102217]/50 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-1">Cálculo Total</p>
              <h3 className={`text-3xl font-bold text-center ${balance < 0 ? 'text-red-500' : 'text-[#111814] dark:text-white'}`}>
                {formatCurrency(currentBalance)}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {globalTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Nenhuma transação encontrada no saldo acumulado.</p>
                </div>
              ) : (
                globalTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center bg-white dark:bg-surface-dark p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-bold text-[#111814] dark:text-white truncate">{t.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {t.type === 'income' ? 'Receita' : 'Despesa'}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowBalanceModal(false)}
                className="w-full bg-primary text-[#102217] py-3.5 rounded-xl font-bold font-display shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

export default Dashboard;