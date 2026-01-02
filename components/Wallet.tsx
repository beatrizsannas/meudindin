import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Purchase {
  id: number;
  name: string;
  item: string; // e.g. "iPhone 14 Pro", "Compra"
  date: string;
  fullDate: string; // for display in list
  amount: number;
  installmentsCurrent: number;
  installmentsTotal: number;
  startDate: string;
  avatar: string;
  isPaid: boolean;
  avatarColor?: string; // class for bg color if no image
  initials?: string;
}

const Wallet: React.FC = () => {
  // Initial Mock Data state
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: 1,
      name: 'Carlos Silva',
      item: 'iPhone 14 Pro',
      date: '12/10/2023',
      fullDate: 'Compra: 12/10/2023',
      amount: 450.00,
      installmentsCurrent: 3,
      installmentsTotal: 10,
      startDate: 'Nov/23',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
      isPaid: false
    },
    {
      id: 2,
      name: 'Mariana Costa',
      item: 'Notebook Dell',
      date: '05/11/2023',
      fullDate: 'Compra: 05/11/2023',
      amount: 1200.00,
      installmentsCurrent: 12,
      installmentsTotal: 12,
      startDate: 'Dez/23',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
      isPaid: true
    },
    {
      id: 3,
      name: 'João Pedro',
      item: 'Jantar Outback',
      date: '15/01/2024',
      fullDate: 'Compra: 15/01/2024',
      amount: 89.90,
      installmentsCurrent: 1,
      installmentsTotal: 1,
      startDate: 'Fev/24',
      avatar: '',
      initials: 'JP',
      avatarColor: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-800',
      isPaid: false
    }
  ]);

  const handleTogglePaid = (id: number) => {
    setPurchases(prev => prev.map(p => 
      p.id === id ? { ...p, isPaid: !p.isPaid } : p
    ));
  };

  const handleEdit = (name: string) => {
    alert(`Editar registro de: ${name}`);
  };

  const handleDelete = (name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o registro de ${name}?`)) {
      alert("Registro excluído (simulação).");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-4 shadow-sm transition-all">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-2xl">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-[#111814] dark:text-white">Cartão de Terceiros</h1>
          <Link to="/wallet/register" className="flex size-10 items-center justify-center rounded-full bg-primary text-[#102217] shadow-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-2xl">add</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6 pb-32">
        {/* Date Selectors */}
        <section className="flex gap-3">
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_month</span>
                </div>
                <select className="w-full h-12 pl-10 pr-10 bg-white dark:bg-surface-dark text-[#111814] dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/50 appearance-none bg-none text-sm font-bold shadow-sm cursor-pointer transition-all">
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
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[24px]">arrow_drop_down</span>
                </div>
            </div>
            <div className="relative w-36 group">
                <select className="w-full h-12 pl-4 pr-10 bg-white dark:bg-surface-dark text-[#111814] dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/50 appearance-none bg-none text-sm font-bold shadow-sm cursor-pointer transition-all">
                    <option>2023</option>
                    <option>2024</option>
                    <option selected>2025</option>
                    <option>2026</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[24px]">arrow_drop_down</span>
                </div>
            </div>
        </section>

        {/* Total Receivable Stats - Wrapped in Link */}
        <section>
          <Link to="/wallet/details">
            <div className="w-full bg-[#111814] dark:bg-surface-dark rounded-2xl p-5 shadow-lg relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
              <div className="relative z-10 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400 text-sm font-medium">Total a Receber</span>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">R$ 1.250,00</h2>
                </div>
                <div className="bg-primary/20 p-2 rounded-lg border border-white/5">
                  <span className="material-symbols-outlined text-primary text-[28px] icon-filled">account_balance_wallet</span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Search Bar */}
        <section>
          <div className="group flex w-full items-center rounded-xl bg-white dark:bg-surface-dark border border-transparent focus-within:border-primary/50 shadow-sm transition-all h-12">
            <div className="pl-4 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input 
              className="w-full bg-transparent border-none text-base text-[#111814] dark:text-white placeholder:text-gray-400 focus:ring-0 px-3 h-full rounded-xl outline-none" 
              placeholder="Buscar por nome..." 
              type="text" 
            />
          </div>
        </section>

        {/* Purchases List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-[#111814] dark:text-white">Compras Recentes</h3>
            <Link to="/wallet/all" className="text-xs font-bold text-primary cursor-pointer hover:underline">Ver todas</Link>
          </div>

          {purchases.map((item) => (
            <article key={item.id} className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
              <div className="flex gap-4 mb-3">
                <div className="relative shrink-0">
                  {item.avatar ? (
                    <div 
                      className="size-14 rounded-full bg-cover bg-center ring-2 ring-primary/20" 
                      style={{backgroundImage: `url('${item.avatar}')`}}
                    ></div>
                  ) : (
                    <div className={`flex items-center justify-center size-14 rounded-full font-bold text-xl ring-2 ${item.avatarColor}`}>
                      {item.initials}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">{item.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.fullDate}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`block font-bold text-lg ${item.isPaid ? 'text-primary' : 'text-primary'}`}>
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {item.isPaid ? (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Pago</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">Pendente</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Installment & Actions Container */}
              <div className="bg-background-light dark:bg-black/20 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex justify-between items-end text-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Parcelas ({item.installmentsCurrent}/{item.installmentsTotal})</span>
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500" 
                        style={{width: `${(item.installmentsCurrent / item.installmentsTotal) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-[#111814] dark:text-gray-200">Início: {item.startDate}</span>
                  </div>
                </div>

                <div className="h-px w-full bg-gray-200 dark:bg-white/10 my-1"></div>

                <div className="flex items-center justify-between gap-3 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={item.isPaid} 
                        onChange={() => handleTogglePaid(item.id)}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 checked:bg-primary checked:border-primary transition-all"
                      />
                      <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" style={{fontSize: '14px'}}>check</span>
                    </div>
                    <span className={`text-xs font-semibold transition-colors select-none ${item.isPaid ? 'text-primary' : 'text-gray-500 group-hover/check:text-primary'}`}>
                      {item.isPaid ? 'Pago' : 'Marcar como Pago'}
                    </span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleEdit(item.name)}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#111814] dark:hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{fontSize: '18px'}}>edit</span>
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(item.name)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete</span>
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

        </section>
      </main>
    </div>
  );
};

export default Wallet;