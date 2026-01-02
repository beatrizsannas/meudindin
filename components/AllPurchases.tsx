import React from 'react';
import { Link } from 'react-router-dom';

const AllPurchases: React.FC = () => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-[#111814] dark:text-white transition-colors duration-200">
      <header className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <Link to="/wallet" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-2xl">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Todas as Compras</h1>
          <div className="size-10"></div>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-4 space-y-6 pb-24">
        <section className="flex gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_month</span>
            </div>
            <select className="w-full h-12 pl-10 pr-10 bg-white dark:bg-surface-dark text-[#111814] dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-bold shadow-sm cursor-pointer transition-all">
              <option>Janeiro</option>
              <option>Fevereiro</option>
              <option>Março</option>
              <option>Abril</option>
              <option>Maio</option>
              <option>Junho</option>
              <option>Julho</option>
              <option>Agosto</option>
              <option>Setembro</option>
              <option>Outubro</option>
              <option>Novembro</option>
              <option selected>Dezembro</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-2xl">arrow_drop_down</span>
            </div>
          </div>
          <div className="relative w-36 group">
            <select className="w-full h-12 pl-4 pr-10 bg-white dark:bg-surface-dark text-[#111814] dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-bold shadow-sm cursor-pointer transition-all">
              <option>2023</option>
              <option>2024</option>
              <option selected>2025</option>
              <option>2026</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-2xl">arrow_drop_down</span>
            </div>
          </div>
        </section>
        
        <section>
          <div className="group flex w-full items-center rounded-xl bg-white dark:bg-surface-dark border border-transparent focus-within:border-primary/50 shadow-sm transition-all h-12">
            <div className="pl-4 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input className="w-full bg-transparent border-none text-base text-[#111814] dark:text-white placeholder:text-gray-400 focus:ring-0 px-3 h-full rounded-xl outline-none" placeholder="Buscar compra..." type="text"/>
          </div>
        </section>
        
        <section className="space-y-4 pb-20">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dezembro 2025</h3>
            <span className="text-xs font-medium text-gray-400">5 compras</span>
          </div>
          
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex gap-4 items-center">
              <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-cover bg-center ring-2 ring-primary/20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80')"}}>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div>
                  <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">Carlos Silva</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">12/10/2023 • Eletrônicos</p>
                </div>
              </div>
            </div>
          </article>
          
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex gap-4 items-center">
              <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-cover bg-center ring-2 ring-gray-200 dark:ring-gray-700 grayscale" style={{backgroundImage: "url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80')"}}>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div>
                  <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">Mariana Costa</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">05/11/2023 • Vestuário</p>
                </div>
              </div>
            </div>
          </article>
          
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex gap-4 items-center">
              <div className="relative shrink-0 flex items-center justify-center size-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold text-lg ring-2 ring-indigo-200 dark:ring-indigo-800">
                JP
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div>
                  <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">João Pedro</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">15/01/2024 • Streaming</p>
                </div>
              </div>
            </div>
          </article>
          
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex gap-4 items-center">
              <div className="relative shrink-0 flex items-center justify-center size-12 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 font-bold text-lg ring-2 ring-orange-200 dark:ring-orange-800">
                AL
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div>
                  <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">Ana Luiza</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">20/01/2024 • Restaurante</p>
                </div>
              </div>
            </div>
          </article>
          
          <article className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex gap-4 items-center">
              <div className="relative shrink-0">
                <div className="size-12 rounded-full bg-cover bg-center ring-2 ring-primary/20" style={{backgroundImage: "url('https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80')"}}>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div>
                  <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">Carlos Silva</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">02/12/2023 • Uber</p>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default AllPurchases;