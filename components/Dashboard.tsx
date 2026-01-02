import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuContext } from '../App';
import Button from './Button';

// Define styles mapping for dynamic rendering
const colorStyles: Record<string, { bg: string, text: string }> = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-500 dark:text-orange-400' },
  green: { bg: 'bg-primary/10 dark:bg-primary/20', text: 'text-primary-dark dark:text-primary' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500 dark:text-blue-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-500 dark:text-purple-400' },
};

const Dashboard: React.FC = () => {
  const [filter, setFilter] = useState('Geral');
  const { openMenu } = useContext(MenuContext);
  const navigate = useNavigate();

  const handleNotification = () => {
    alert("Você tem 1 nova notificação!");
  };

  // Data source for transactions
  const transactions = [
    {
      id: 1,
      title: "Supermercado",
      date: "Hoje, 14:30",
      amount: "- R$ 450,00",
      account: "Conta Corrente",
      type: "expense",
      category: "Outros",
      icon: "shopping_bag",
      colorTheme: "orange",
    },
    {
      id: 2,
      title: "Salário Mensal",
      date: "Ontem",
      amount: "+ R$ 5.000,00",
      account: "Receita",
      type: "income",
      category: "Receita",
      icon: "attach_money",
      colorTheme: "green",
    },
    {
      id: 3,
      title: "Posto Shell",
      date: "12 Out",
      amount: "- R$ 200,00",
      account: "Crédito Nubank",
      type: "expense",
      category: "Veículo", // Matches filter key
      icon: "local_gas_station",
      colorTheme: "blue",
      badge: "Veículo"
    },
    {
      id: 4,
      title: "Netflix",
      date: "10 Out",
      amount: "- R$ 55,90",
      account: "Cartão Visa",
      type: "expense",
      category: "Cartões", // Matches filter key
      icon: "movie",
      colorTheme: "purple",
    }
  ];

  // Filtering Logic: 'Geral' shows all, otherwise filter by specific category
  const filteredTransactions = filter === 'Geral'
    ? transactions
    : transactions.filter(t => t.category === filter);

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
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 ring-2 ring-white dark:ring-surface-dark shadow-sm"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80")' }}
              >
              </div>
              <div className="absolute bottom-0 right-0 size-3 bg-primary rounded-full border-2 border-background-light dark:border-background-dark"></div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">Bem-vindo(a),</p>
              <h2 className="text-xl font-extrabold leading-tight text-[#111814] dark:text-white">Alex!</h2>
            </div>
          </div>
        </div>

        <button
          onClick={handleNotification}
          className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[#111814] dark:text-white text-[28px] icon-filled">notifications</span>
          <span className="absolute top-2 right-2.5 size-2.5 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark"></span>
        </button>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {/* Balance Card - Updated Style */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#102217] to-[#1c3326] dark:from-[#1c3326] dark:to-[#102217] p-6 shadow-lg text-white">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 size-32 rounded-full bg-primary/5 blur-xl"></div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                <p className="text-sm font-medium tracking-wide opacity-90">Saldo Atual</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-light text-gray-400">R$</span>
                <h1 className="text-4xl font-bold tracking-tight">4.250,00</h1>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                onClick={() => navigate('/register', { state: { type: 'expense' } })}
                startIcon="remove_circle"
                className="shadow-md shadow-red-500/20"
              >
                Despesa
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/register', { state: { type: 'income' } })}
                startIcon="add_circle"
                className="shadow-md shadow-primary/20 text-[#102217]"
              >
                Receita
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <Link to="/income" className="flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-green-100 dark:hover:border-green-900/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined text-lg">trending_up</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Receitas</p>
            </div>
            <p className="text-lg font-bold text-[#111814] dark:text-white">R$ 8.000,00</p>
            <p className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 self-start px-1.5 py-0.5 rounded">+12% vs mês ant.</p>
          </Link>
          <Link to="/expenses" className="flex-1 flex flex-col gap-1 rounded-2xl bg-white dark:bg-surface-dark p-4 shadow-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-900/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-lg">trending_down</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Despesas</p>
            </div>
            <p className="text-lg font-bold text-[#111814] dark:text-white">R$ 3.750,00</p>
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 self-start px-1.5 py-0.5 rounded">+5% vs mês ant.</p>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold leading-tight text-[#111814] dark:text-white">Transações Recentes</h3>
            <button onClick={() => alert("Histórico completo")} className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">Ver tudo</button>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setFilter('Geral')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Geral' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Geral
            </button>
            <button
              onClick={() => setFilter('Veículo')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Veículo' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <span className="material-symbols-outlined text-sm mr-1.5">directions_car</span>
              Veículo
            </button>
            <button
              onClick={() => setFilter('Cartões')}
              className={`flex h-8 shrink-0 items-center justify-center px-5 rounded-full font-bold text-xs shadow-sm transition-all ${filter === 'Cartões' ? 'bg-primary text-[#102217]' : 'bg-white dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <span className="material-symbols-outlined text-sm mr-1.5">credit_card</span>
              Cartões
            </button>
          </div>

          <div className="flex flex-col gap-3 pb-6">
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhuma transação encontrada nesta categoria.
              </div>
            )}

            {filteredTransactions.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-card border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all">
                <div className={`flex items-center justify-center size-12 rounded-full shrink-0 ${colorStyles[item.colorTheme].bg} ${colorStyles[item.colorTheme].text}`}>
                  <span className="material-symbols-outlined icon-filled">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#111814] dark:text-white truncate">{item.title}</p>
                    {item.badge && (
                      <span className={`bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${item.type === 'income' ? 'text-primary dark:text-primary' : 'text-[#111814] dark:text-white'}`}>
                    {item.amount}
                  </p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">{item.account}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;