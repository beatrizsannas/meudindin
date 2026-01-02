import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

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

  // Form State
  const [amount, setAmount] = useState('');
  const [categoryType, setCategoryType] = useState<'fuel' | 'maintenance'>('fuel');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Data State
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    const init = async () => {
      if (session?.user) {
        const id = await fetchCategoryReturningId();
        if (id) {
          fetchExpenses(id);
        }
      }
    };
    init();
  }, [session]);

  const fetchCategoryReturningId = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Veículo') // Assuming Veículo exists as the main category
        .single();

      if (error) {
        // Fallback: try 'Veiculo' without accent
        const { data: data2 } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Veiculo')
          .single();
        if (data2) {
          setCategoryId(data2.id);
          return data2.id;
        }
        throw error;
      }

      if (data) {
        setCategoryId(data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    }
    return null;
  };

  // Kept for compatibility if used elsewhere, but init uses the returning one
  const fetchCategory = fetchCategoryReturningId;

  const fetchExpenses = async (catId: string | null = categoryId) => {
    if (!catId) return;

    try {
      // split logic for month filter to optimize if needed, but client-side filter is fine for small lists
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          date
        `)
        .eq('user_id', session?.user.id)
        .eq('category_id', catId)
        .order('date', { ascending: false })
        .limit(50); // Limit to recent

      if (error) throw error;

      if (data) {
        const mappedData: Transaction[] = data.map((t: any) => {
          const desc = t.description.toLowerCase();
          let type: 'fuel' | 'maintenance' = 'maintenance';
          // Deduction logic matches previous implementation
          if (desc.includes('abastecimento') || desc.includes('gas') || desc.includes('fuel') || desc.includes('posto') || desc.includes('combustível')) {
            type = 'fuel';
          }
          return {
            id: t.id,
            description: t.description,
            amount: Number(t.amount),
            date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
            dateObj: new Date(t.date),
            type
          };
        });
        setExpenses(mappedData);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleSave = async () => {
    if (!amount || !description || !categoryId) {
      alert("Por favor, preencha o valor e descrição.");
      return;
    }

    setLoading(true);
    try {
      // Smart Description: If user selects Fuel but doesn't type a fuel-like word, we could append it? 
      // Or just trust the user. For "Veículo" category, we need to ensure we can identify it later as Fuel vs Maintenance.
      // Let's prepend [Combustível] or [Manutenção] if not present, or rely on deduction logic.
      // For best UX, let's just save. Dindin's deduction logic is quite broad.

      // OPTIONAL: Prepend type for better deduction if needed
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
          amount: parseFloat(amount),
          type: 'expense',
          category_id: categoryId,
          date: date,
          description: finalDescription,
          account: 'Conta Corrente'
        });

      if (error) throw error;

      alert("Despesa salva com sucesso!");
      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      fetchExpenses(); // Refresh list

    } catch (error: any) {
      console.error("Error saving:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredHistory = expenses.filter(e => {
    const d = e.dateObj;
    // Note: JS Month is 0-indexed, user selectors usually 0-indexed or mapped strings
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalAmount = filteredHistory.reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display transition-colors duration-200">
      <div className="sticky top-0 z-10 flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-white/5 shadow-sm">
        <Link to="/" className="text-text-main dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Registrar Custos</h2>
      </div>

      <main className="flex-1 flex flex-col px-4 py-6 gap-6 max-w-md mx-auto w-full pb-28">

        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <label className="text-text-main dark:text-white text-sm font-bold ml-1">Valor da Despesa</label>
          <div className="flex w-full items-center rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm border border-transparent focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden h-20">
            <div className="pl-5 pr-2 text-primary font-bold text-2xl flex items-center justify-center">R$</div>
            <input
              className="flex-1 bg-transparent border-none text-text-main dark:text-white text-3xl font-extrabold focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 h-full w-full outline-none leading-none"
              inputMode="decimal"
              placeholder="0,00"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Category Radio */}
        <div className="flex flex-col gap-2">
          <label className="text-text-main dark:text-white text-sm font-bold ml-1">Categoria</label>
          <div className="flex p-1 bg-gray-200 dark:bg-white/5 rounded-xl">
            <label className="flex-1 cursor-pointer">
              <input
                className="peer sr-only"
                name="category"
                type="radio"
                value="fuel"
                checked={categoryType === 'fuel'}
                onChange={() => setCategoryType('fuel')}
              />
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-text-secondary dark:text-gray-400 font-medium transition-all peer-checked:bg-surface-light dark:peer-checked:bg-surface-dark peer-checked:text-text-main dark:peer-checked:text-primary peer-checked:shadow-sm">
                <span className="material-symbols-outlined text-[20px]">local_gas_station</span>
                <span>Combustível</span>
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                className="peer sr-only"
                name="category"
                type="radio"
                value="maintenance"
                checked={categoryType === 'maintenance'}
                onChange={() => setCategoryType('maintenance')}
              />
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-text-secondary dark:text-gray-400 font-medium transition-all peer-checked:bg-surface-light dark:peer-checked:bg-surface-dark peer-checked:text-text-main dark:peer-checked:text-primary peer-checked:shadow-sm">
                <span className="material-symbols-outlined text-[20px]">build</span>
                <span>Manutenção</span>
              </div>
            </label>
          </div>
        </div>

        {/* Date & Description */}
        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-text-main dark:text-white text-sm font-bold ml-1">Data</span>
            <div className="relative flex items-center">
              <input
                className="w-full h-14 bg-surface-light dark:bg-surface-dark text-text-main dark:text-white border-none rounded-xl focus:ring-2 focus:ring-primary/50 px-4 font-medium"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <span className="absolute right-4 text-text-secondary pointer-events-none material-symbols-outlined">calendar_today</span>
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
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full h-14 mt-4 bg-primary hover:bg-primary-dark active:scale-[0.98] text-text-main font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full h-12 appearance-none bg-surface-light dark:bg-surface-dark border-none rounded-xl pl-4 pr-10 text-text-main dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary/50 shadow-sm outline-none"
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
            </div>
            <div className="relative w-32">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-12 appearance-none bg-surface-light dark:bg-surface-dark border-none rounded-xl pl-4 pr-10 text-text-main dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary/50 shadow-sm outline-none"
              >
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
            Referente a {months[selectedMonth]}/{selectedYear}
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
      </main>
    </div>
  );
};

export default ThirdPartyCards;