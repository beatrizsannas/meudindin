import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const VehicleScreen: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'fuel' | 'maintenance'>('fuel');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState('Outubro');
  const [selectedYear, setSelectedYear] = useState('2023');

  // Mock Data
  const expenses = [
    { id: 1, title: 'Abastecimento Shell', date: '12 Out, 2023', amount: 250.00, type: 'fuel', month: 'Outubro', year: '2023' },
    { id: 2, title: 'Troca de Óleo', date: '05 Out, 2023', amount: 180.00, type: 'maintenance', month: 'Outubro', year: '2023' },
    { id: 3, title: 'Gasolina Aditivada', date: '28 Set, 2023', amount: 50.00, type: 'fuel', month: 'Setembro', year: '2023' },
    { id: 4, title: 'Alinhamento e Balanceamento', date: '15 Ago, 2023', amount: 120.00, type: 'maintenance', month: 'Agosto', year: '2023' },
  ];

  const handleSave = () => {
    alert("Despesa salva com sucesso!");
    setAmount('');
    setDescription('');
  };

  // Filter Logic
  const filteredExpenses = expenses.filter(item => {
    const yearMatch = item.year === selectedYear;
    const monthMatch = selectedMonth === 'Todas' ? true : item.month === selectedMonth;
    return yearMatch && monthMatch;
  });

  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const months = [
    "Todas", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark font-display group/design-root transition-colors duration-200 min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-white/5 shadow-sm">
        <Link to="/" className="text-[#111814] dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Registrar Custos
        </h2>
      </div>

      <main className="flex flex-col px-4 py-6 gap-6 max-w-md mx-auto w-full pb-32">
        
        {/* Amount Input - Height 20 (80px) */}
        <div className="flex flex-col gap-2">
          <label className="text-[#111814] dark:text-white text-sm font-bold ml-1">Valor da Despesa</label>
          <div className="flex w-full items-center rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm border border-transparent focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden h-20">
            <div className="pl-5 pr-2 text-primary font-bold text-2xl flex items-center justify-center">R$</div>
            <input 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent border-none text-[#111814] dark:text-white text-3xl font-extrabold focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 h-full w-full outline-none leading-none" 
              inputMode="decimal" 
              placeholder="0,00" 
              type="number"
            />
          </div>
        </div>

        {/* Category Selector - Custom Styling mimicking the HTML provided */}
        <div className="flex flex-col gap-2">
          <label className="text-[#111814] dark:text-white text-sm font-bold ml-1">Categoria</label>
          <div className="flex p-1 bg-gray-200 dark:bg-white/5 rounded-xl">
            <label className="flex-1 cursor-pointer" onClick={() => setCategory('fuel')}>
              <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                category === 'fuel' 
                ? 'bg-surface-light dark:bg-surface-dark text-[#111814] dark:text-primary shadow-sm' 
                : 'text-text-secondary dark:text-gray-400 hover:text-gray-600'
              }`}>
                <span className="material-symbols-outlined text-[20px]">local_gas_station</span>
                <span>Combustível</span>
              </div>
            </label>
            <label className="flex-1 cursor-pointer" onClick={() => setCategory('maintenance')}>
              <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                category === 'maintenance' 
                ? 'bg-surface-light dark:bg-surface-dark text-[#111814] dark:text-primary shadow-sm' 
                : 'text-text-secondary dark:text-gray-400 hover:text-gray-600'
              }`}>
                <span className="material-symbols-outlined text-[20px]">build</span>
                <span>Manutenção</span>
              </div>
            </label>
          </div>
        </div>

        {/* Date and Description Inputs - Height 14 (56px) */}
        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[#111814] dark:text-white text-sm font-bold ml-1">Data</span>
            <div className="relative flex items-center">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-14 bg-surface-light dark:bg-surface-dark text-[#111814] dark:text-white border-none rounded-xl focus:ring-2 focus:ring-primary/50 px-4 font-medium appearance-none"
                style={{colorScheme: 'light dark'}}
              />
              <span className="absolute right-4 text-text-secondary pointer-events-none material-symbols-outlined">calendar_today</span>
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[#111814] dark:text-white text-sm font-bold ml-1">Descrição</span>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Gasolina Posto Ipiranga"
              className="w-full h-14 bg-surface-light dark:bg-surface-dark text-[#111814] dark:text-white placeholder:text-text-secondary/50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 px-4 font-medium"
            />
          </label>
        </div>

        {/* Save Button - Pill Shaped (rounded-full) */}
        <button 
          onClick={handleSave}
          className="w-full h-14 mt-4 bg-primary hover:bg-primary-dark active:scale-[0.98] text-[#052e16] font-bold text-lg rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-2xl icon-filled">save</span>
          Salvar Despesa
        </button>

        <div className="h-px w-full bg-gray-200 dark:bg-white/10 mt-2"></div>

        {/* History Filter - Height 12 (48px) */}
        <div className="flex flex-col gap-2">
          <label className="text-[#111814] dark:text-white text-sm font-bold ml-1">Filtrar Histórico</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-12 appearance-none bg-surface-light dark:bg-surface-dark border-none rounded-xl pl-4 pr-10 text-[#111814] dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary/50 shadow-sm outline-none bg-none cursor-pointer"
              >
                <option value="Todas">Todas as despesas</option>
                {months.slice(1).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
            </div>
            <div className="relative w-32">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full h-12 appearance-none bg-surface-light dark:bg-surface-dark border-none rounded-xl pl-4 pr-10 text-[#111814] dark:text-white font-bold text-sm focus:ring-2 focus:ring-primary/50 shadow-sm outline-none bg-none cursor-pointer"
              >
                <option>2023</option>
                <option>2024</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
            </div>
          </div>
        </div>

        {/* Summary Card with Left Border */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-md border-l-4 border-l-primary border-y border-r border-gray-100 dark:border-white/5 relative">
            <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-text-secondary text-sm">payments</span>
                <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Valor Total Gasto</span>
            </div>
            <span className="text-4xl font-extrabold text-[#111814] dark:text-white tracking-tight">
              R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <div className="mt-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {selectedMonth === 'Todas' ? `Histórico de ${selectedYear}` : `Referente a ${selectedMonth}/${selectedYear}`}
            </div>
        </div>

        {/* Recent List */}
        <div className="mt-2">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[#111814] dark:text-white text-lg font-bold">Últimos Gastos</h3>
                <button onClick={() => alert("Ver lista completa")} className="text-sm text-primary font-bold hover:underline">Ver tudo</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">Nenhuma despesa encontrada.</div>
              ) : (
                filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-white/5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      expense.type === 'fuel' 
                        ? 'bg-primary/10 text-primary-dark dark:text-primary' 
                        : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                    }`}>
                        <span className="material-symbols-outlined">
                          {expense.type === 'fuel' ? 'local_gas_station' : 'build'}
                        </span>
                    </div>
                    <div className="ml-4 flex flex-col flex-1">
                        <p className="text-[#111814] dark:text-white text-base font-bold truncate">{expense.title}</p>
                        <p className="text-text-secondary text-xs font-medium">{expense.date}</p>
                    </div>
                    <p className="text-[#111814] dark:text-white text-base font-bold whitespace-nowrap">
                      - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              )}
            </div>
        </div>
        
        <div className="h-8 w-full"></div> 
      </main>
    </div>
  );
};

export default VehicleScreen;