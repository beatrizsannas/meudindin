import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from './Button';

const RegisterCost: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  // Changed default category to match the first item of the new list
  const [category, setCategory] = useState('financing');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Check for navigation state (scanned data or type)
  useEffect(() => {
    if (location.state) {
      if (location.state.type) {
        const type = location.state.type as 'expense' | 'income';
        setTransactionType(type);
        // Set default category based on type if not overwritten by scanned data
        if (!location.state.scannedData) {
          if (type === 'expense') setCategory('financing');
          else setCategory('salary');
        }
      }

      if (location.state.scannedData) {
        const data = location.state.scannedData;
        if (data.amount) setAmount(data.amount.toString());
        if (data.date) setDate(data.date);
        if (data.description) setDescription(data.description);

        // Basic category mapping logic based on AI suggestion
        if (data.category) {
          const catLower = data.category.toLowerCase();
          // Mapped old logic to new categories: 'others' is a safe fallback
          if (catLower.includes('fuel') || catLower.includes('gas')) setCategory('others');
          else if (catLower.includes('food')) setCategory('others');
          else if (catLower.includes('subscription')) setCategory('fixed');
          else setCategory('others'); // default fallback
        }
      }
    }
  }, [location.state]);

  const handleTransactionTypeChange = (type: 'expense' | 'income') => {
    setTransactionType(type);
    // Reset category to the first option of the new type to avoid inconsistency
    if (type === 'expense') {
      setCategory('financing');
    } else {
      setCategory('salary');
    }
  };

  const handleSave = () => {
    if (window.confirm("Confirmar o registro desta transação?")) {
      alert("Transação salva com sucesso!");
      navigate('/');
    }
  };

  const getCategories = () => {
    if (transactionType === 'expense') {
      return [
        { id: 'financing', label: 'Financiamentos' },
        { id: 'others', label: 'Outros' },
        { id: 'fixed', label: 'Fixas' },
        { id: 'credit_card', label: 'Cartão de crédito' },
      ];
    } else {
      return [
        { id: 'salary', label: 'Salário' },
        { id: 'bonus', label: 'Bônus' },
        { id: 'extras', label: 'Extras' },
      ];
    }
  };

  const categories = getCategories();

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-light dark:bg-surface-dark shadow-sm px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex size-12 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white">arrow_back</span>
          </Link>
          <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Registrar {transactionType === 'expense' ? 'Despesa' : 'Receita'}
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
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 shrink-0 rounded-full border border-gray-200 dark:border-white/5 bg-background-light dark:bg-background-dark text-sm font-medium transition-colors ${category === cat.id ? 'bg-primary text-[#003314] border-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            fullWidth
            className="h-12 text-[#003314] shadow-lg shadow-primary/20 mt-2"
            startIcon="check"
          >
            Adicionar {transactionType === 'expense' ? 'Despesa' : 'Receita'}
          </Button>
        </div>

        {/* History & Filters Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#111814] dark:text-white text-lg font-bold">Histórico Recente</h3>
            <div className="flex gap-2">
              <button className="flex items-center justify-center size-8 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              </button>
              <button className="flex items-center justify-center size-8 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-3 pb-8">
            {/* Item 1 */}
            <div className="flex items-center bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined">restaurant</span>
              </div>
              <div className="ml-3 flex flex-col flex-1">
                <span className="text-[#111814] dark:text-white text-sm font-bold">Jantar - Outback</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Outros • 12 Out</span>
              </div>
              <span className="text-[#111814] dark:text-white text-sm font-bold">- R$ 120,00</span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined">credit_card</span>
              </div>
              <div className="ml-3 flex flex-col flex-1">
                <span className="text-[#111814] dark:text-white text-sm font-bold">Fatura Nubank</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Cartão de crédito • 10 Out</span>
              </div>
              <span className="text-[#111814] dark:text-white text-sm font-bold">- R$ 1.250,00</span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined">local_gas_station</span>
              </div>
              <div className="ml-3 flex flex-col flex-1">
                <span className="text-[#111814] dark:text-white text-sm font-bold">Posto Shell</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Outros • 08 Out</span>
              </div>
              <span className="text-[#111814] dark:text-white text-sm font-bold">- R$ 250,00</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterCost;