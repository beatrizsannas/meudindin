import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { MenuContext } from '../App';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string; // deduced from description
  dateObj: Date;
}

const ThirdPartyCards: React.FC = () => {
  const { openMenu } = useContext(MenuContext);
  const { session } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchVehicleExpenses();
    }
  }, [session]);

  const fetchVehicleExpenses = async () => {
    try {
      setLoading(true);
      // Fetch transactions where category name is 'Veículo'
      // Supabase query with inner join filter
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          date,
          category!inner(name)
        `)
        .eq('user_id', session?.user.id)
        .eq('category.name', 'Veículo')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedData: Transaction[] = data.map((t: any) => {
          const desc = t.description.toLowerCase();
          let type = 'maintenance';
          if (desc.includes('abastecimento') || desc.includes('gas') || desc.includes('fuel') || desc.includes('posto')) {
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
      console.error('Error fetching vehicle expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const filteredExpenses = expenses.filter(e => {
    const d = e.dateObj;
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Stats Logic (Deduced)
  const fuelTotal = filteredExpenses.filter(e => e.type === 'fuel').reduce((acc, curr) => acc + curr.amount, 0);
  const maintenanceTotal = filteredExpenses.filter(e => e.type === 'maintenance').reduce((acc, curr) => acc + curr.amount, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={openMenu}
            className="p-1 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-3xl">menu</span>
          </button>
          <h2 className="text-xl font-extrabold leading-tight text-[#111814] dark:text-white">Veículo</h2>
        </div>
        <Link to="/register" state={{ type: 'expense' }} className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-symbols-outlined text-3xl">add_circle</span>
        </Link>
      </div>

      <div className="px-6 flex flex-col gap-6 pb-28">
        {/* Navigation/Filter */}
        <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-2 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
          <button
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(y => y - 1);
              } else {
                setSelectedMonth(m => m - 1);
              }
            }}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-[#111814] dark:text-white">{months[selectedMonth]}</span>
            <span className="text-xs text-gray-500 font-medium">{selectedYear}</span>
          </div>
          <button
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(y => y + 1);
              } else {
                setSelectedMonth(m => m + 1);
              }
            }}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Cards (Fuel / Maintenance) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/30">
            <div className="size-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-2">
              <span className="material-symbols-outlined">local_gas_station</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Combustível</p>
            <p className="text-lg font-bold text-[#111814] dark:text-white">{formatCurrency(fuelTotal)}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30">
            <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-2">
              <span className="material-symbols-outlined">car_repair</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Manutenção</p>
            <p className="text-lg font-bold text-[#111814] dark:text-white">{formatCurrency(maintenanceTotal)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#111814] dark:text-white">Histórico</h3>
            <span className="text-sm font-bold text-gray-500">Total: {formatCurrency(totalAmount)}</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Carregando...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhum registro encontrado.</div>
          ) : (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${expense.type === 'fuel' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                  <span className="material-symbols-outlined icon-filled">
                    {expense.type === 'fuel' ? 'local_gas_station' : 'car_repair'}
                  </span>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-bold text-[#111814] dark:text-white">{expense.description}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{expense.date}</p>
                </div>
                <span className="font-bold text-[#111814] dark:text-white">{formatCurrency(expense.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyCards;