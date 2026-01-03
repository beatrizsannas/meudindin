import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  type: string;
}

const RegisterCost: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [editId, setEditId] = useState<string | null>(null);

  // Missing state variables restored
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, type');

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

  // Set default category when type changes or categories load
  useEffect(() => {
    // Only set default if we are NOT editing or if the current category is invalid for the type
    // If editing, we want to keep the category from the transaction unless user changes type
    if (availableCategories.length > 0 && !editId) {
      const isValid = availableCategories.find(c => c.id === categoryId);
      if (!isValid) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [transactionType, categories, categoryId, editId]);

  // Check for navigation state (scanned data or type or EDIT)
  useEffect(() => {
    if (location.state) {
      // Handle Edit Mode
      if (location.state.transaction) {
        const t = location.state.transaction;
        setEditId(t.id);
        setAmount(t.amount.toString());
        setDescription(t.description);
        setDate(t.date); // Assuming date is YYYY-MM-DD
        setTransactionType(t.type || 'expense'); // Ensure type is present in transaction object
        setCategoryId(t.category_id);
      }
      // Handle New Mode configuration
      else {
        if (location.state.type) {
          const type = location.state.type as 'expense' | 'income';
          setTransactionType(type);
        }

        if (location.state.scannedData) {
          const data = location.state.scannedData;
          if (data.amount) setAmount(data.amount.toString());
          if (data.date) setDate(data.date);
          if (data.description) setDescription(data.description);

          // Map scanned category to database category by name
          if (data.category && categories.length > 0) {
            const catLower = data.category.toLowerCase();
            // Attempt to find a matching category by name
            const match = categories.find(c => {
              const cName = c.name.toLowerCase();
              if (catLower.includes('food') && cName === 'outros') return true;
              if (catLower.includes('fuel') && cName === 'veículo') return true;
              if (cName === catLower) return true;
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
  }, [location.state, categories]); // Re-run when categories are loaded to handle mapping

  const handleTransactionTypeChange = (type: 'expense' | 'income') => {
    setTransactionType(type);
    // Reset handled by effect
  };

  const handleSave = async () => {
    if (!description || !amount || !categoryId) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        // Update existing
        const { error } = await supabase
          .from('transactions')
          .update({
            description,
            amount: parseFloat(amount),
            type: transactionType,
            category_id: categoryId,
            date,
            account: 'Conta Corrente'
          })
          .eq('id', editId);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: session?.user.id,
            description,
            amount: parseFloat(amount),
            type: transactionType,
            category_id: categoryId,
            date,
            account: 'Conta Corrente'
          });
        if (error) throw error;
      }

      alert("Salvo com sucesso!");
      navigate(-1); // Go back to previous screen (expenses or income list)
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert("Erro ao salvar.");
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
                inputMode="decimal"
                placeholder="0,00"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          {/* Category Selection */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Categoria</span>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
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

        {/* Removed mock history for now or could replace with real fetch later if requested */}
        <div className="flex flex-col gap-4">
          {/* Placeholder for history - can be added later if needed */}
        </div>
      </main>
    </div>
  );
};

export default RegisterCost;