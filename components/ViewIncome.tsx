import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { MenuContext } from '../App';

const ViewIncome: React.FC = () => {
  const { openMenu } = useContext(MenuContext);

  return (
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark font-display">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-sm p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="cursor-pointer mr-1 p-2 -ml-2 rounded-full hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark text-[#111814] dark:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-[#111814] dark:text-white">Receitas</h2>
        </div>
        <button 
          onClick={openMenu}
          className="cursor-pointer flex items-center justify-center rounded-full size-10 hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark transition-colors relative"
        >
          <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">menu</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-2 pb-24">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#102217] to-[#0e3b25] dark:from-[#1c3326] dark:to-[#102217] p-6 shadow-lg text-white">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 size-32 rounded-full bg-primary/5 blur-xl"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-primary">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <p className="text-sm font-medium tracking-wide opacity-90">Total em Outubro</p>
                </div>
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">+12%</span>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm font-light text-gray-400">R$</span>
                <h1 className="text-4xl font-bold tracking-tight">8.000,00</h1>
              </div>
            </div>
            <button 
              onClick={() => alert("Nova Receita")}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-[#102217] font-bold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl icon-filled">add</span>
              <span>Nova Receita</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          <div className="shrink-0 relative">
            <select className="appearance-none bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-4 pr-10 text-sm font-bold shadow-sm focus:border-primary focus:ring-primary text-gray-700 dark:text-white">
              <option>Este Mês</option>
              <option>Mês Passado</option>
              <option>Últimos 3 Meses</option>
              <option>2023</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-500 pointer-events-none text-lg">calendar_month</span>
          </div>
          <div className="shrink-0 relative">
            <select className="appearance-none bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-4 pr-10 text-sm font-bold shadow-sm focus:border-primary focus:ring-primary text-gray-700 dark:text-white">
              <option>Todas as Fontes</option>
              <option>Salário</option>
              <option>Freelance</option>
              <option>Investimentos</option>
              <option>Vendas</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-500 pointer-events-none text-lg">filter_list</span>
          </div>
          <button className="shrink-0 flex items-center justify-center size-9 rounded-full bg-surface-variant-light dark:bg-surface-variant-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <span className="material-symbols-outlined text-lg">sort</span>
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold leading-tight text-[#111814] dark:text-white">Histórico</h3>
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>Ordenado por data</span>
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Item 1 */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 shrink-0">
                <span className="material-symbols-outlined icon-filled">work</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Salário Mensal</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">05 Out, 09:00</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-green-600 dark:text-green-400">+ R$ 5.000,00</p>
                <p className="text-xs font-medium text-gray-400">Emprego Principal</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 shrink-0">
                <span className="material-symbols-outlined">laptop_mac</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-[#111814] dark:text-white truncate">Projeto Web</p>
                  <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[10px] px-1.5 py-0.5 rounded font-medium">Extra</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">12 Out, 14:30</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-green-600 dark:text-green-400">+ R$ 2.450,00</p>
                <p className="text-xs font-medium text-gray-400">Freelance</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                <span className="material-symbols-outlined">sell</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Venda Monitor</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">15 Out, 18:20</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-green-600 dark:text-green-400">+ R$ 450,00</p>
                <p className="text-xs font-medium text-gray-400">OLX</p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm">
              <div className="flex items-center justify-center size-12 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shrink-0">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#111814] dark:text-white truncate">Dividendos FIIs</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">18 Out, 10:00</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-green-600 dark:text-green-400">+ R$ 85,40</p>
                <p className="text-xs font-medium text-gray-400">Investimentos</p>
              </div>
            </div>

            {/* Item 5 (Pendente) */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm opacity-60">
              <div className="flex items-center justify-center size-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 shrink-0">
                <span className="material-symbols-outlined">hourglass_top</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-[#111814] dark:text-white truncate">Reembolso</p>
                  <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 text-[10px] px-1.5 py-0.5 rounded font-medium">Pendente</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">20 Out</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-gray-400 dark:text-gray-500">+ R$ 14,50</p>
                <p className="text-xs font-medium text-gray-400">Empresa</p>
              </div>
            </div>

          </div>
        </div>
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default ViewIncome;