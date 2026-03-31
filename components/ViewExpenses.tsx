import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import DeleteFixedModal from './DeleteFixedModal';

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
  is_fixed?: boolean;
  fixed_group_id?: string | null;
}

interface Category {
  id: string;
  name: string;
}

const ViewExpenses: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // States
  const [selectedYear, setSelectedYear] = useState<number | 'Todos'>(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [selectedCategory, setSelectedCategory] = useState('Categoria');
  const [selectedAccount, setSelectedAccount] = useState('Conta');
  // React Query
  const queryClient = useQueryClient();
  const { data: allTransactions = [], isLoading: transactionsLoading } = useTransactions(session?.user?.id);
  const loading = transactionsLoading;

  // Clone / Selection Logic
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cloning, setCloning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteFixedModal, setShowDeleteFixedModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

        // Handle overflow (e.g. Jan 31 -> Feb 28)
        if (nextMonthDate.getDate() !== originalDate.getDate()) {
          nextMonthDate.setDate(0); // Last day of previous month
        }

        return {
          user_id: session?.user.id,
          description: t.description,
          amount: t.amount,
          type: 'expense',
          category_id: t.category_id,
          date: nextMonthDate.toISOString().split('T')[0],
          account: t.account,
          exclude_from_global: false // assuming default
        };
      });

      const { error } = await supabase.from('transactions').insert(newTransactions);
      if (error) throw error;

      const count = newTransactions.length;
      const suffix = count === 1 ? 'despesa clonada' : 'despesas clonadas';
      showToast(`${count} ${suffix} com sucesso!`, "success");

      setIsSelectionMode(false);
      setSelectedIds(new Set());
      setShowConfirmModal(false);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });

    } catch (error) {
      console.error(error);
      showToast("Erro ao clonar despesas.", "error");
    } finally {
      setCloning(false);
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const accounts = ["Todas", "Conta Corrente", "Cartão Visa", "Crédito Nubank", "Dinheiro"];

  // Helper to map category names to icons/colors
  const getCategoryStyle = (catName: string = '') => {
    const name = catName?.toLowerCase() || '';
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name').eq('type', 'expense');
      if (data) setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Derive filtered transactions
  const transactions = allTransactions.filter(t => {
    // Basic Layout Filters
    if (t.type !== 'expense') return false;
    if (t.exclude_from_global) return false;

    // 1. Year Filter
    const d = new Date(t.date + 'T12:00:00');
    const year = d.getFullYear();
    if (selectedYear !== 'Todos' && year !== selectedYear) return false;

    // 2. Month Filter
    if (selectedYear !== 'Todos' && selectedMonthIndex !== -1) {
      if (d.getMonth() !== selectedMonthIndex) return false;
    }

    // 3. Account Filter
    if (selectedAccount !== 'Conta' && selectedAccount !== 'Todas') {
      if (t.account !== selectedAccount) return false;
    }

    // 4. Category Filter
    if (selectedCategory !== 'Categoria' && selectedCategory !== 'Todas') {
      if (t.category?.name !== selectedCategory) return false;
    }

    return true;
  });

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
    const year = d.getFullYear();

    if (isToday) return `Hoje, ${day} ${month}`;

    // Show year if distinct from selected or current
    if (selectedYear === 'Todos' || selectedYear !== year) {
      return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    }
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteTarget(transaction);
    if (transaction.is_fixed) {
      setShowDeleteFixedModal(true);
    } else {
      setShowDeleteModal(true);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast("Despesa apagada com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao apagar despesa!", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setShowDeleteFixedModal(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteAllFuture = async () => {
    if (!deleteTarget || !deleteTarget.fixed_group_id) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('fixed_group_id', deleteTarget.fixed_group_id)
        .gte('date', deleteTarget.date);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast("Despesas fixas apagadas com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao apagar despesas!", "error");
    } finally {
      setDeleting(false);
      setShowDeleteFixedModal(false);
      setDeleteTarget(null);
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
        </div>
      </div>

      <div className="flex flex-col gap-0 pt-4 px-4 pb-24">
        {/* Filters & Summary */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">

            {/* Year Filter */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-2 bg-[#111814] text-white dark:bg-white dark:text-[#111814] px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-md">
                <span>{selectedYear}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedYear(val === 'Todos' ? 'Todos' : Number(val));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              >
                <option value="Todos">Todos</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            {selectedYear !== 'Todos' && (
              <div className="relative shrink-0">
                <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-variant-dark transition-colors">
                  <span>{selectedMonthIndex === -1 ? 'Todos os Meses' : months[selectedMonthIndex]}</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
                <select
                  value={selectedMonthIndex}
                  onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                >
                  <option value={-1}>Todos os Meses</option>
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            )}

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
            <div className="flex flex-col items-end gap-2">
              <div className="size-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400">
                <span className="material-symbols-outlined">trending_down</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/register', { state: { type: 'expense' } })}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm shadow-md shadow-red-500/20"
          >
            <span className="material-symbols-outlined text-xl icon-filled">add</span>
            <span>Nova Despesa</span>
          </button>
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
                  const style = getCategoryStyle(transaction.category?.name);
                  return (
                    <div key={transaction.id} className="relative group flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
                      <div className={`flex items-center justify-center size-12 rounded-full ${style.bgClass} ${style.colorClass} shrink-0`}>
                        <span className="material-symbols-outlined">{style.icon}</span>
                      </div>



                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-bold text-[#111814] dark:text-white truncate ${isSelectionMode && isInstallment(transaction.description) ? 'opacity-50' : ''}`}>
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.account || 'Conta'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-base font-bold text-red-600 dark:text-red-400">- {formatCurrency(transaction.amount)}</p>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                            {transaction.category?.name}
                          </span>
                          {(transaction as Transaction).is_fixed && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>repeat</span>
                              Fixa
                            </span>
                          )}
                        </div>

                        {/* Action Buttons (Below Category) */}
                        <div className="flex items-center gap-1 mt-2">
                          {isSelectionMode && (
                            <button
                              onClick={() => !isInstallment(transaction.description) && toggleSelect(transaction.id)}
                              disabled={isInstallment(transaction.description)}
                              className={`size-[30px] flex items-center justify-center rounded-full transition-colors border ${selectedIds.has(transaction.id)
                                ? 'bg-primary border-primary text-[#102217]'
                                : 'bg-transparent border-gray-300 dark:border-gray-600 text-transparent'
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                              {selectedIds.has(transaction.id) && <span className="material-symbols-outlined text-[18px]">check</span>}
                            </button>
                          )}

                          <Link
                            to="/register"
                            state={{ transaction, type: 'expense' }}
                            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(transaction as Transaction)}
                            className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
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

      {/* Delete Confirmation Modal (normal expense) */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={handleDeleteSingle}
        isLoading={deleting}
        isDestructive
        title="Apagar Despesa"
        description="Tem certeza que deseja apagar esta despesa? Esta ação não pode ser desfeita."
        confirmText="Apagar"
        cancelText="Cancelar"
      />

      {/* Delete Fixed Expense Modal */}
      <DeleteFixedModal
        isOpen={showDeleteFixedModal}
        onClose={() => { setShowDeleteFixedModal(false); setDeleteTarget(null); }}
        onDeleteSingle={handleDeleteSingle}
        onDeleteAll={handleDeleteAllFuture}
        isLoading={deleting}
      />

      {/* Confirmation Modal (clone) */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleClone}
        isLoading={cloning}
        title="Clonar Despesas"
        description={`Deseja clonar ${selectedIds.size} ${selectedIds.size === 1 ? 'despesa' : 'despesas'} para o mês seguinte?`}
        confirmText="Clonar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default ViewExpenses;