import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ViewExpenses: React.FC = () => {
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState('Outubro');
  const [selectedCategory, setSelectedCategory] = useState('Categoria');
  const [selectedAccount, setSelectedAccount] = useState('Conta');

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const categories = ["Todas", "Alimentação", "Transporte", "Lazer", "Saúde", "Moradia"];
  const accounts = ["Todas", "Conta Corrente", "Cartão Visa", "Crédito Nubank", "Dinheiro"];

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
        <button className="flex items-center justify-center rounded-full size-10 hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark transition-colors">
          <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">search</span>
        </button>
      </div>

      <div className="flex flex-col gap-0 pt-4 px-4 pb-24">
        {/* Filters & Summary */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            
            {/* Month Filter (Active Style) */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-2 bg-[#111814] text-white dark:bg-white dark:text-[#111814] px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-md">
                <span>{selectedMonth}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-variant-dark transition-colors">
                <span>{selectedCategory === 'Todas' ? 'Categoria' : selectedCategory}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              >
                <option value="Categoria" disabled>Categoria</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Account Filter */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-variant-dark transition-colors">
                <span>{selectedAccount === 'Todas' ? 'Conta' : selectedAccount}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <select 
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              >
                <option value="Conta" disabled>Conta</option>
                {accounts.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            
            <div className="w-1"></div>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total de saídas</p>
              <h2 className="text-2xl font-bold text-[#111814] dark:text-white">R$ 3.750,00</h2>
            </div>
            <div className="flex flex-col items-end">
              <div className="size-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 mb-1">
                <span className="material-symbols-outlined">trending_down</span>
              </div>
              <span className="text-[10px] font-medium text-red-500">+5% vs set.</span>
            </div>
          </div>
        </div>

        {/* Transactions Groups */}
        <div className="flex flex-col gap-6">
          
          {/* Group 1: Hoje */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hoje, 14 Out</h3>
              <span className="text-xs font-medium text-red-500 dark:text-red-400">- R$ 474,90</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shrink-0">
                <span className="material-symbols-outlined">shopping_cart</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Supermercado</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Conta Corrente</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-red-600 dark:text-red-400">- R$ 450,00</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Alimentação</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 shrink-0">
                <span className="material-symbols-outlined">directions_car</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Uber</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cartão Visa</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-red-600 dark:text-red-400">- R$ 24,90</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Transporte</span>
              </div>
            </div>
          </div>

          {/* Group 2: 12 Outubro */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">12 Outubro</h3>
              <span className="text-xs font-medium text-red-500 dark:text-red-400">- R$ 200,00</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                <span className="material-symbols-outlined">local_gas_station</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Posto Shell</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Crédito Nubank</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-red-600 dark:text-red-400">- R$ 200,00</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium">Veículo</span>
              </div>
            </div>
          </div>

           {/* Group 3: 10 Outubro */}
           <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">10 Outubro</h3>
              <span className="text-xs font-medium text-red-500 dark:text-red-400">- R$ 55,90</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shrink-0">
                <span className="material-symbols-outlined">movie</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Netflix</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cartão Visa</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-red-600 dark:text-red-400">- R$ 55,90</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Lazer</span>
              </div>
            </div>
          </div>

           {/* Group 4: 05 Outubro */}
           <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">05 Outubro</h3>
              <span className="text-xs font-medium text-red-500 dark:text-red-400">- R$ 120,00</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 shrink-0">
                <span className="material-symbols-outlined">medication</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Farmácia Bem Estar</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Conta Corrente</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-red-600 dark:text-red-400">- R$ 120,00</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Saúde</span>
              </div>
            </div>
          </div>

        </div>
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default ViewExpenses;