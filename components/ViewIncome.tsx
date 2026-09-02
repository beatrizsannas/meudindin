import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuContext } from '../App';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';

import { useTransactions } from '../hooks/useTransactions';
import { useQueryClient } from '@tanstack/react-query';

interface Transaction {
  id: string; // ID is string in hook
  description: string;
  amount: number;
  date: string;
  account: string;
  category_id: string;
  category: {
    name: string;
  } | null;
}

const ViewIncome: React.FC = () => {
  const { openMenu } = useContext(MenuContext);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Filter States
  const [selectedRange, setSelectedRange] = useState('Este Mês');
  // React Query
  const queryClient = useQueryClient();
  const { data: allTransactions = [], isLoading: transactionsLoading } = useTransactions(session?.user?.id);
  const loading = transactionsLoading;

  // Selection & Cloning Logic
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cloning, setCloning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const isInstallment = (description: string) => {
    // Regex to match (X/Y) pattern
    return /\(\d+\/\d+\)/.test(description);
  };

  const handleClone = async () => {
    // Only proceed (Modal takes care of confirmation)
    setCloning(true);
    try {
      const itemsToClone = allTransactions.filter(t => selectedIds.has(t.id));
      const newTransactions = itemsToClone.map(t => {
        const originalDate = new Date(t.date + 'T12:00:00');
        // Add 1 month
        const nextMonthDate = new Date(originalDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

        // Handle overflow
        if (nextMonthDate.getDate() !== originalDate.getDate()) {
          nextMonthDate.setDate(0);
        }

        return {
          user_id: session?.user.id,
          description: t.description,
          amount: t.amount,
          type: 'income',
          category_id: t.category_id,
          date: nextMonthDate.toISOString().split('T')[0],
          account: t.account,
          exclude_from_global: false
        };
      });

      const { error } = await supabase.from('transactions').insert(newTransactions);
      if (error) throw error;

      const count = newTransactions.length;
      const suffix = count === 1 ? 'receita clonada' : 'receitas clonadas';
      showToast(`${count} ${suffix} com sucesso!`, "success");

      setIsSelectionMode(false);
      setSelectedIds(new Set());
      setShowConfirmModal(false);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });

    } catch (error) {
      console.error(error);
      showToast("Erro ao clonar receitas.", "error");
    } finally {
      setCloning(false);
    }
  };

  // Filter transactions
  const transactions = allTransactions.filter(t => {
    if (t.type !== 'income') return false;
    if (t.exclude_from_global) return false;

    // Date Filtering
    const tDate = new Date(t.date + 'T12:00:00');
    const today = new Date();

    // Define range
    let start, end;
    if (selectedRange === 'Este Mês') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    } else if (selectedRange === 'Mês Seguinte') {
      start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      end = new Date(today.getFullYear(), today.getMonth() + 2, 0, 23, 59, 59);
    } else if (selectedRange === 'Mês Passado') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
    } else if (selectedRange === 'Últimos 3 Meses') {
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    } else {
      return true; // Show all if unknown
    }

    return tDate >= start && tDate <= end;
  });

  // Helper to map income categories to icons/colors
  const getCategoryStyle = (catName: string = '') => {
    const name = catName?.toLowerCase() || '';
    if (name.includes('salário') || name.includes('emprego')) return { icon: 'work', colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-900/20' };
    if (name.includes('freelance') || name.includes('extra') || name.includes('projeto')) return { icon: 'laptop_mac', colorClass: 'text-teal-600 dark:text-teal-400', bgClass: 'bg-teal-100 dark:bg-teal-900/20' };
    if (name.includes('venda') || name.includes('olx')) return { icon: 'sell', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-900/20' };
    if (name.includes('investimento') || name.includes('fii') || name.includes('dividendo')) return { icon: 'trending_up', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-100 dark:bg-purple-900/20' };

    // Default
    return { icon: 'attach_money', colorClass: 'text-gray-600 dark:text-gray-400', bgClass: 'bg-gray-100 dark:bg-gray-800' };
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apagar receita?")) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['transactions'] });

      showToast("Receita apagada com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao apagar receita!", "error");
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
        <div className="flex items-center gap-2">
          {isSelectionMode && selectedIds.size > 0 && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={cloning}
              className="text-sm font-bold text-[#111814] bg-primary px-3 py-1.5 rounded-full shadow-sm hover:brightness-110 transition-all flex items-center gap-1"
            >
              {cloning ? '...' : 'Clonar'}
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          )}
          <button
            onClick={toggleSelectionMode}
            className={`text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${isSelectionMode
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              }`}
          >
            {isSelectionMode ? 'Cancelar' : 'Selecionar'}
          </button>
          <button
            onClick={openMenu}
            className="cursor-pointer flex items-center justify-center rounded-full size-10 hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark transition-colors relative"
          >
            <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">menu</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-2 pb-24">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#102217] to-[#0e3b25] dark:from-[#1c3326] dark:to-[#102217] p-6 shadow-lg text-white">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 size-32 rounded-full bg-primary/5 blur-xl"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a8f0c8]">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  {/* WCAG: #a8f0c8 sobre #102217 = ~7.8:1 ✅ */}
                  <p className="text-xs font-semibold tracking-widest uppercase">Total em {selectedRange}</p>
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
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-[#0a2018] font-bold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-md shadow-primary/20"
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
              <option>Mês Seguinte</option>
              <option>Mês Passado</option>
              <option>Últimos 3 Meses</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg">calendar_month</span>
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
                const style = getCategoryStyle(transaction.category?.name);
                return (
                  <div key={transaction.id} className="relative group flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
                    <div className={`flex items-center justify-center size-12 rounded-full ${style.bgClass} ${style.colorClass} shrink-0`}>
                      <span className="material-symbols-outlined icon-filled">{style.icon}</span>
                    </div>



                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-bold text-[#111814] dark:text-white truncate ${isSelectionMode && isInstallment(transaction.description) ? 'opacity-50' : ''}`}>{transaction.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</p>
                    </div>
                    <div className="text-right">
                      {/* WCAG: emerald-700 sobre white = ~5.8:1 ✅ */}
                      <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">+ {formatCurrency(transaction.amount)}</p>
                      {/* WCAG: text-gray-500 = ~4.6:1 ✅ */}
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{transaction.category?.name}</p>
                    </div>

                    {/* Action Buttons (Visible on hover/tap) */}
                    <div className={`absolute right-2 top-0 bottom-0 flex items-center gap-1 ${isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity bg-surface-light/90 dark:bg-surface-dark/90 px-2 rounded-r-xl`}>
                      {isSelectionMode && (
                        <button
                          onClick={() => !isInstallment(transaction.description) && toggleSelect(transaction.id)}
                          disabled={isInstallment(transaction.description)}
                          className={`size-[30px] flex items-center justify-center rounded-full transition-colors border ${selectedIds.has(transaction.id)
                            ? 'bg-primary border-primary text-[#0a2018]'
                            : 'bg-transparent border-gray-300 dark:border-gray-600 text-transparent'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {selectedIds.has(transaction.id) && <span className="material-symbols-outlined text-[18px]">check</span>}
                        </button>
                      )}
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleClone}
        isLoading={cloning}
        title="Clonar Receitas"
        description={`Deseja clonar ${selectedIds.size} ${selectedIds.size === 1 ? 'receita' : 'receitas'} para o mês seguinte?`}
        confirmText="Clonar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default ViewIncome;