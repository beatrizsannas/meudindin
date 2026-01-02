import React from 'react';
import { Link } from 'react-router-dom';

const ReceivablesDetails: React.FC = () => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-[#111814] dark:text-white transition-colors duration-200">
      <header className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <Link to="/wallet" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-2xl">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Detalhes a Receber</h1>
          <div className="size-10"></div>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-4 space-y-6 pb-24">
        <section className="flex flex-col items-center justify-center space-y-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-white/5">
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Dezembro 2025</span>
          </div>
        </section>
        
        <section>
          <div className="w-full bg-[#111814] dark:bg-surface-dark rounded-2xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1">
              <span className="text-gray-400 text-sm font-medium">Total Previsto no Mês</span>
              <h2 className="text-4xl font-extrabold text-white tracking-tight">R$ 1.250,00</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-md font-bold">12 Transações</span>
                <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-1 rounded-md">2 Pendentes</span>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <div className="group flex w-full items-center rounded-xl bg-white dark:bg-surface-dark border border-transparent focus-within:border-primary/50 shadow-sm transition-all h-12">
            <div className="pl-4 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input className="w-full bg-transparent border-none text-base text-[#111814] dark:text-white placeholder:text-gray-400 focus:ring-0 px-3 h-full rounded-xl outline-none" placeholder="Buscar lançamento..." type="text"/>
          </div>
        </section>
        
        <section className="space-y-4 pb-10">
          {/* Item 1 */}
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
            <div className="flex gap-4 mb-3">
              <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-cover bg-center ring-2 ring-primary/20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80')"}}>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">Carlos Silva</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">iPhone 14 Pro</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[#111814] dark:text-white font-bold text-lg">R$ 450,00</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">Pendente</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background-light dark:bg-black/20 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-end text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Parcela 3 de 10</span>
                  <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{width: '30%'}}></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Vencimento</span>
                  <p className="text-xs font-bold text-[#111814] dark:text-white">10/12/2025</p>
                </div>
              </div>
            </div>
          </article>
          
          {/* Item 2 */}
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
            <div className="flex gap-4 mb-3">
              <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-cover bg-center ring-2 ring-primary/20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80')"}}>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">Mariana Costa</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Notebook Dell</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[#111814] dark:text-white font-bold text-lg">R$ 300,00</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Recebido</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background-light dark:bg-black/20 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-end text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Parcela 5 de 12</span>
                  <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width: '41%'}}></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Recebido em</span>
                  <p className="text-xs font-bold text-[#111814] dark:text-white">05/12/2025</p>
                </div>
              </div>
            </div>
          </article>
          
          {/* Item 3 */}
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
            <div className="flex gap-4 mb-3">
              <div className="relative shrink-0 flex items-center justify-center size-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold text-lg ring-2 ring-indigo-200 dark:ring-indigo-800">
                JP
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">João Pedro</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Jantar Outback</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[#111814] dark:text-white font-bold text-lg">R$ 89,90</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Recebido</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background-light dark:bg-black/20 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-end text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Parcela 1 de 1</span>
                  <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Recebido em</span>
                  <p className="text-xs font-bold text-[#111814] dark:text-white">01/12/2025</p>
                </div>
              </div>
            </div>
          </article>
          
          {/* Item 4 */}
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
            <div className="flex gap-4 mb-3">
              <div className="relative shrink-0 flex items-center justify-center size-12 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 font-bold text-lg ring-2 ring-pink-200 dark:ring-pink-800">
                LM
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">Luiza Martins</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Uber Viagem</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[#111814] dark:text-white font-bold text-lg">R$ 410,10</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">Pendente</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background-light dark:bg-black/20 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-end text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Parcela 1 de 1</span>
                  <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-300 dark:bg-white/10 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Vencimento</span>
                  <p className="text-xs font-bold text-[#111814] dark:text-white">20/12/2025</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default ReceivablesDetails;