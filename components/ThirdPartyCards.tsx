import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTransactions } from '../hooks/useTransactions';
import { useQueryClient } from '@tanstack/react-query';

// Types
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'fuel' | 'maintenance'; // Deduced for UI
  dateObj: Date;
}

const ThirdPartyCards: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Form State
  const [amount, setAmount] = useState('');
  const [categoryType, setCategoryType] = useState<'fuel' | 'maintenance'>('fuel');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [includeInExpenses, setIncludeInExpenses] = useState(true);
  const [loading, setLoading] = useState(false);

  // Data State
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // React Query
  const { data: allTransactions = [] } = useTransactions(session?.user?.id);

  // Filter State - Default to 'Todos'
  const [selectedMonth, setSelectedMonth] = useState<number | 'Todos'>('Todos');
  const [selectedYear, setSelectedYear] = useState<number | 'Todos'>('Todos');

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    if (session?.user) {
      fetchCategoryId();
    }
  }, [session]);

  const fetchCategoryId = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .or('name.eq.Veículo,name.eq.Veiculo')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    }
  };

  const expenses = useMemo(() => {
    if (!categoryId) return [];

    return allTransactions
      .filter(t => t.category_id === categoryId)
      .map(t => {
        const descLower = t.description.toLowerCase();
        let type: 'fuel' | 'maintenance' = 'maintenance';

        if (descLower.match(/gas|fuel|abastecimento|posto/) || t.description.startsWith('Combustível:')) {
          type = 'fuel';
        }

        let displayDescription = t.description;
        if (displayDescription.startsWith('Combustível: ')) {
          displayDescription = displayDescription.replace('Combustível: ', '');
        } else if (displayDescription.startsWith('Manutenção: ')) {
          displayDescription = displayDescription.replace('Manutenção: ', '');
        }

        return {
          id: t.id,
          description: displayDescription,
          amount: t.amount,
          date: t.date.split('-').reverse().join('/'),
          dateObj: new Date(t.date + 'T12:00:00'),
          type: type
        } as Transaction;
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [allTransactions, categoryId]);

  const handleSave = async () => {
    if (!amount || !description || !categoryId) {
      showToast("Por favor, preencha o valor e descrição.", "warning");
      return;
    }

    setLoading(true);
    try {
      let finalDescription = description;
      if (categoryType === 'fuel' && !description.toLowerCase().match(/gas|fuel|abastecimento|posto/)) {
        finalDescription = `Combustível: ${description}`;
      } else if (categoryType === 'maintenance' && !description.toLowerCase().match(/manutenção|reparo|óleo|pneu/)) {
        finalDescription = `Manutenção: ${description}`;
      }

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: session?.user.id,
          amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
          type: 'expense',
          category_id: categoryId,
          date: date,
          description: finalDescription,
          account: 'Conta Corrente',
          exclude_from_global: !includeInExpenses
        });

      if (error) throw error;

      showToast("Despesa salva com sucesso!", "success");
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIncludeInExpenses(true);

      // Update cache
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });

    } catch (error: any) {
      console.error("Error saving:", error);
      showToast("Erro ao salvar compra: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredHistory = expenses.filter(e => {
    const d = e.dateObj;
    const matchMonth = selectedMonth === 'Todos' || d.getMonth() === selectedMonth;
    const matchYear = selectedYear === 'Todos' || d.getFullYear() === selectedYear;
    return matchMonth && matchYear;
  });

  const totalAmount = filteredHistory.reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 pb-24">
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[#111814] dark:text-white">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-[#111814] dark:text-white">Registrar Custos</h1>
      </header>

      <main className="flex flex-col px-6 gap-6">

        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <label className="text-text-main dark:text-white text-sm font-bold ml-1">Valor da Despesa</label>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-2xl transition-colors ${amount ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}>R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const formatted = (Number(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                setAmount(formatted);
              }}
              placeholder="0,00"
              className={`w-full h-20 pl-14 pr-4 bg-surface-light dark:bg-surface-dark text-4xl font-bold border-none rounded-2xl focus:ring-0 outline-none transition-colors ${amount ? 'text-[#111814] dark:text-white placeholder:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}
            />
          </div>
        </div>

        {/* Category Type Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-text-main dark:text-white text-sm font-bold ml-1">Categoria</label>
          <div className="flex bg-gray-100 dark:bg-surface-dark/50 p-1 rounded-xl">
            <button
              onClick={() => setCategoryType('fuel')}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg font-bold text-sm transition-all ${categoryType === 'fuel'
                ? 'bg-white text-[#111814] shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">local_gas_station</span>
              Combustível
            </button>
            <button
              onClick={() => setCategoryType('maintenance')}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg font-bold text-sm transition-all ${categoryType === 'maintenance'
                ? 'bg-white text-[#111814] shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">build</span>
              Manutenção
            </button>
          </div>
        </div>

        {/* Date & Description */}
        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-text-main dark:text-white text-sm font-bold ml-1">Data</span>
            <div className="relative flex items-center">
              <input
                className="w-full h-14 bg-surface-light dark:bg-surface-dark text-text-main dark:text-white border-none rounded-xl focus:ring-0 px-4 font-bold text-lg [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <span className="absolute right-4 pointer-events-none text-primary dark:text-primary">
                <span className="material-symbols-outlined text-2xl">calendar_month</span>
              </span>
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-text-main dark:text-white text-sm font-bold ml-1">Descrição</span>
            <input
              className="w-full h-14 bg-surface-light dark:bg-surface-dark text-text-main dark:text-white placeholder:text-text-secondary/50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 px-4 font-medium"
              placeholder="Ex: Gasolina Posto Ipiranga"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {/* Include in Expenses Toggle */}
          <label className="flex items-center gap-3 p-1 rounded-xl cursor-pointer mt-1">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={includeInExpenses}
                onChange={(e) => setIncludeInExpenses(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </div>
            <span className="text-sm font-bold text-text-main dark:text-white">Somar nas despesas gerais</span>
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full h-14 mt-2 bg-primary hover:bg-primary-dark active:scale-[0.98] text-text-main font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'save'}</span>
          {loading ? 'Salvando...' : 'Salvar Despesa'}
        </button>

        <div className="h-px w-full bg-gray-200 dark:bg-white/10 mt-2"></div>

        {/* History Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-text-main dark:text-white text-sm font-bold ml-1">Filtrar Histórico</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))}
                className="w-full h-12 appearance-none bg-surface-light dark:bg-surface-dark border-none rounded-xl pl-4 pr-10 text-text-main dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary/50 shadow-sm outline-none bg-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                <option value="Todos">Todos</option>
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
            </div>
            <div className="relative w-32">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))}
                className="w-full h-12 appearance-none bg-surface-light dark:bg-surface-dark border-none rounded-xl pl-4 pr-10 text-text-main dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary/50 shadow-sm outline-none bg-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              >
                <option value="Todos">Todos</option>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
            </div>
          </div>
        </div>

        {/* Total Card */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-md border-l-4 border-l-primary border-y border-r border-gray-100 dark:border-white/5 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-text-secondary text-sm">payments</span>
            <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Valor Total Gasto</span>
          </div>
          <span className="text-4xl font-extrabold text-text-main dark:text-white tracking-tight">{formatCurrency(totalAmount)}</span>
          <div className="mt-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {selectedMonth === 'Todos' || selectedYear === 'Todos' ? 'Todo o Período' : `Referente a ${months[selectedMonth]}/${selectedYear}`}
          </div>
        </div>

        {/* List */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-text-main dark:text-white text-lg font-bold">Últimos Gastos</h3>
            {/* <button className="text-sm text-primary font-bold hover:underline">Ver tudo</button> */}
          </div>
          <div className="flex flex-col gap-3">
            {filteredHistory.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">Nenhum gasto neste período.</p>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="flex items-center p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-white/5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.type === 'fuel' ? 'bg-primary/10 text-primary-dark dark:text-primary' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                    <span className="material-symbols-outlined">{item.type === 'fuel' ? 'local_gas_station' : 'build'}</span>
                  </div>
                  <div className="ml-4 flex flex-col flex-1 min-w-0">
                    <p className="text-text-main dark:text-white text-base font-bold truncate">{item.description}</p>
                    <p className="text-text-secondary text-xs font-medium">{item.date}</p>
                  </div>
                  <p className="text-text-main dark:text-white text-base font-bold whitespace-nowrap">- {formatCurrency(item.amount)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="h-4 w-full"></div>
      </main >
    </div >
  );
};

export default ThirdPartyCards;