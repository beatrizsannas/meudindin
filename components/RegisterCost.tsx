import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

interface Category {
  id: string;
  name: string;
  type: string;
}

const RegisterCost: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [editId, setEditId] = useState<string | null>(null);
  const [excludeFromGlobal, setExcludeFromGlobal] = useState<boolean>(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');

  // Amount is a string to handle masked input: "1.234,56"
  const [amount, setAmount] = useState('');

  // New state for Compras/Installments
  const [installments, setInstallments] = useState(1);
  const [paymentStartDate, setPaymentStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInstallment, setIsInstallment] = useState(false);
  const [isScanner, setIsScanner] = useState(false);

  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [session]);

  // Masking Function
  const formatCurrency = (value: string) => {
    // 1. Remove all non-digits
    const numericValue = value.replace(/\D/g, '');

    // 2. Handle empty case
    if (!numericValue) return '';

    // 3. Convert to float (cents -> dollars/reais)
    const floatValue = parseFloat(numericValue) / 100;

    // 4. Format to BRL locale
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(formatCurrency(val));
  };

  // Helper to parse "1.234,56" back to 1234.56
  const parseCurrency = (strVal: string) => {
    if (!strVal) return 0;
    // Remove "R$", trim, remove dots (thousands), replace comma with dot
    const clean = strVal.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, type, icon, color_theme');

      if (error) throw error;
      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Filter categories by current transaction type
  const availableCategories = categories.filter(c => c.type === transactionType);

  // Detect if selected category is "Compras"
  // No longer auto-detect Compras
  /* 
  useEffect(() => {
    const cat = categories.find(c => c.id === categoryId);
    setIsCompras(cat?.name.toLowerCase() === 'compras');
  }, [categoryId, categories]);
  */

  // Set default category
  useEffect(() => {
    if (availableCategories.length > 0 && !editId) {
      const isValid = availableCategories.find(c => c.id === categoryId);
      if (!isValid) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [transactionType, categories, categoryId, editId]);

  // Check for navigation state
  useEffect(() => {
    if (location.state) {
      if (location.state.transaction) {
        const t = location.state.transaction;
        setEditId(t.id);
        // Format initial value for edit
        setAmount(t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setDescription(t.description);
        setDate(t.date);
        setTransactionType(t.type || 'expense');
        setCategoryId(t.category_id);
        // ✅ Preserve exclude_from_global so it doesn't get reset to false on save
        setExcludeFromGlobal(t.exclude_from_global ?? false);
      }
      else {
        if (location.state.type) {
          setTransactionType(location.state.type as 'expense' | 'income');
        }
        if (location.state.scannedData) {
          setIsScanner(true);
          const data = location.state.scannedData;
          if (data.amount) {
            // Handle scanned amount which might be string or number
            // Force parse to float then format
            const parsed = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
            setAmount(parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          }
          if (data.date) setDate(data.date);
          if (data.description) setDescription(data.description);
          if (data.category && categories.length > 0) {
            const catLower = data.category.toLowerCase();
            const match = categories.find(c => {
              if (c.name.toLowerCase() === catLower) return true;
              return false;
            });
            if (match) {
              setTransactionType(match.type as 'expense' | 'income');
              setCategoryId(match.id);
            }
          }
        }
      }
    }
  }, [location.state, categories]);

  const handleTransactionTypeChange = (type: 'expense' | 'income') => {
    setTransactionType(type);
  };

  const handleSave = async () => {
    // 0. Verify Session
    if (!session?.user?.id) {
      showToast("Sessão inválida. Por favor faça login novamente.", "error");
      return;
    }

    const finalCategoryId = categoryId;
    // No more creation of temp categories here logic removed

    const valueToSave = parseCurrency(amount);

    if (!description || !amount || !finalCategoryId) {
      showToast("Por favor, preencha todos os campos.", "warning");
      return;
    }

    if (valueToSave <= 0) {
      showToast("O valor deve ser maior que zero.", "warning");
      return;
    }

    if (isInstallment && (installments < 1 || !paymentStartDate)) {
      showToast("Por favor, verifique as parcelas e data de pagamento.", "warning");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        // Update existing — preserve all original fields including exclude_from_global
        const { error } = await supabase
          .from('transactions')
          .update({
            description,
            amount: valueToSave,
            type: transactionType,
            category_id: finalCategoryId,
            date,
            account: 'Conta Corrente',
            // ✅ CRITICAL: preserve this field — if missing, defaults to false
            // which wrongly includes previously excluded transactions in global totals
            exclude_from_global: excludeFromGlobal
          })
          .eq('id', editId);
        if (error) throw error;
        showToast(transactionType === 'expense' ? "Despesa atualizada com sucesso!" : "Receita atualizada com sucesso!", "success");

      } else {
        // Create New
        if (isInstallment && installments > 1) {
          const totalVal = valueToSave;
          const installmentVal = totalVal / installments;
          const transactionsToInsert = [];

          for (let i = 0; i < installments; i++) {
            // Robust month calculation handling end-of-month overflow
            const [y, m, d] = paymentStartDate.split('-').map(Number); // YYYY, MM, DD
            // Date.UTC months are 0-indexed (MM-1). parts[1] is 1-indexed.
            const targetMonthIndex = (m - 1) + i;

            const dateObj = new Date(Date.UTC(y, targetMonthIndex, d));

            // Check for overflow (e.g. Jan 31 -> Feb 28/Mar 3 mismatch)
            if (dateObj.getUTCDate() !== d) {
              // If day mismatch, it means we overflowed. Set to 0 (last day of prev month)
              // This gives us Feb 28 for Jan 31 + 1 month
              dateObj.setUTCDate(0);
            }

            const isoDate = dateObj.toISOString().split('T')[0];

            transactionsToInsert.push({
              user_id: session?.user.id,
              description: `${description} (${i + 1}/${installments})`,
              amount: installmentVal,
              type: transactionType,
              category_id: finalCategoryId,
              date: isoDate,
              account: 'Conta Corrente'
            });
          }

          const { error } = await supabase.from('transactions').insert(transactionsToInsert);
          if (error) throw error;
        } else {
          // Single
          const { error } = await supabase
            .from('transactions')
            .insert({
              user_id: session?.user.id,
              description,
              amount: valueToSave,
              type: transactionType,
              category_id: finalCategoryId,
              date,
              account: 'Conta Corrente'
            });
          if (error) throw error;
        }
        showToast(transactionType === 'expense' ? "Despesa cadastrada com sucesso!" : "Receita cadastrada com sucesso!", "success");
      }

      await queryClient.invalidateQueries({ queryKey: ['transactions'] });

      navigate(-1);
    } catch (error) {
      console.error('Error saving transaction:', error);
      showToast("Erro ao salvar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-light dark:bg-surface-dark shadow-sm px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex size-12 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white">arrow_back</span>
          </button>
          <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            {editId ? 'Editar' : 'Registrar'} {transactionType === 'expense' ? 'Despesa' : 'Receita'}
          </h2>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-6 pb-32">
        {/* Transaction Type Toggle */}
        <div className="w-full">
          <div className="flex h-12 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-[#25382e] p-1">
            <button
              onClick={() => handleTransactionTypeChange('expense')}
              className={`flex h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-sm font-bold leading-normal transition-all ${transactionType === 'expense' ? 'bg-primary text-[#003314] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className="truncate">Despesa</span>
            </button>
            <button
              onClick={() => handleTransactionTypeChange('income')}
              className={`flex h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-sm font-bold leading-normal transition-all ${transactionType === 'income' ? 'bg-primary text-[#003314] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className="truncate">Receita</span>
            </button>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5 flex flex-col gap-5">
          {/* Amount Input (Large) */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 dark:text-gray-400 text-sm font-medium">Valor</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-primary font-bold text-xl">R$</span>
              <input
                className="w-full bg-background-light dark:bg-background-dark rounded-lg h-16 pl-12 pr-4 text-2xl font-bold text-[#111814] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 border-none focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                inputMode="numeric"
                placeholder="0,00"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                autoFocus
              />
            </div>
          </div>

          {/* Date and Description */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Increased min-width to prevent date clipping */}
            <label className="flex flex-col min-w-[170px] flex-1 gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Data</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-[20px] pointer-events-none">calendar_today</span>
                <input
                  className="w-full bg-background-light dark:bg-background-dark rounded-lg h-12 pl-10 pr-2 text-base font-normal text-[#111814] dark:text-white border-none focus:ring-1 focus:ring-primary placeholder:text-gray-400 outline-none"
                  type="date"
                  style={{ colorScheme: 'light dark' }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </label>
            <label className="flex flex-col flex-[2] gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Descrição</span>
              <input
                className="w-full bg-background-light dark:bg-background-dark rounded-lg h-12 px-4 text-base font-normal text-[#111814] dark:text-white border-none focus:ring-1 focus:ring-primary placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
                placeholder={transactionType === 'expense' ? "Ex: Jantar, Gasolina" : "Ex: Adiantamento, Bônus"}
                value={description}
                maxLength={30}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          {/* Category Selection */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Categoria</span>
            <div className="flex flex-wrap gap-2 pb-1">
              {availableCategories.length === 0 ? (
                <p className="text-sm text-gray-400">Carregando categorias...</p>
              ) : (
                availableCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-4 py-2 shrink-0 rounded-full border border-gray-200 dark:border-white/5 bg-background-light dark:bg-background-dark text-sm font-medium transition-colors ${categoryId === cat.id ? 'bg-primary text-[#003314] border-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Transaction Type Specific Fields */}
          {transactionType === 'expense' && (
            <div className={`flex items-center justify-between py-2 ${isScanner ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Parcelar?</span>
                {isScanner && <span className="text-xs text-red-400">Indisponível via Scanner</span>}
              </div>
              <button
                disabled={isScanner}
                onClick={() => setIsInstallment(!isInstallment)}
                className={`w-12 h-6 rounded-full relative transition-colors ${isInstallment ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isInstallment ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          )}

          {/* Installments Extra Fields */}
          {isInstallment && (
            <div className="flex flex-col gap-4 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex flex-col flex-1 gap-2">
                  <span className="text-text-secondary dark:text-[#8faeb5] text-sm font-medium">Início Pagamento</span>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-[#8faeb5] text-xl pointer-events-none">event_upcoming</span>
                    <input
                      className="w-full bg-background-light dark:bg-background-dark rounded-lg h-12 pl-10 pr-4 text-base font-normal text-text-main dark:text-[#f0f5f2] border-none focus:ring-1 focus:ring-primary placeholder:text-text-secondary/50 appearance-none"
                      type="date"
                      style={{ colorScheme: 'light dark' }}
                      value={paymentStartDate}
                      onChange={(e) => setPaymentStartDate(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-text-secondary dark:text-[#8faeb5] text-sm font-medium">Quantidade de Parcelas</span>
                <div className="flex items-center justify-between bg-background-light dark:bg-background-dark rounded-lg p-2 border border-transparent focus-within:ring-1 focus-within:ring-primary">
                  <button
                    onClick={() => setInstallments(prev => Math.max(1, prev - 1))}
                    className="size-10 flex items-center justify-center rounded-md bg-surface-light dark:bg-surface-dark text-text-main dark:text-[#f0f5f2] shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-text-main dark:text-[#f0f5f2]">{installments}</span>
                    <span className="text-[10px] font-bold text-text-secondary dark:text-[#8faeb5] tracking-widest uppercase">Vez{installments > 1 ? 'es' : ''}</span>
                  </div>
                  <button
                    onClick={() => setInstallments(prev => Math.min(60, prev + 1))}
                    className="size-10 flex items-center justify-center rounded-md bg-primary text-[#003314] shadow-sm hover:bg-[#0be062] transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            fullWidth
            disabled={loading}
            className="h-12 text-[#003314] shadow-lg shadow-primary/20 mt-2"
            startIcon={loading ? undefined : "check"}
          >
            {loading ? 'Salvando...' : `Adicionar ${transactionType === 'expense' ? 'Despesa' : 'Receita'}`}
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Placeholder for history - can be added later if needed */}
        </div>
      </main >
    </div >
  );
};

export default RegisterCost;