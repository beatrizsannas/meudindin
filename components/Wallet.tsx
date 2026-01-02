import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { MenuContext } from '../App';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Purchase {
  id: string;
  person_name: string;
  item_name: string;
  amount: number;
  installments_total: number;
  installments_paid: number;
  start_payment_date: string;
  is_paid: boolean;
  avatar_url?: string; // Add avatar support if DB allows, otherwise use initials
}

const Wallet: React.FC = () => {
  const { openMenu } = useContext(MenuContext);
  const { session } = useAuth();
  const navigate = React.useRef(null); // Just for consistent hook usage if needed later

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed lists for selectors
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const years = [2023, 2024, 2025, 2026];

  useEffect(() => {
    if (session?.user) {
      fetchPurchases();
    }
  }, [session]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('third_party_purchases')
        .select('*');

      if (error) throw error;
      if (data) {
        setPurchases(data);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (id: string, currentPaid: number, total: number, isCurrentlyPaid: boolean) => {
    // If checking (marking as paid)
    // For single installment logic in the UI, this usually implies marking THIS month's installment as paid?
    // Or marking the whole thing? The HTML shows "Marcar como Pago" (Mark as Paid) and "Pago" (Paid) badge.
    // The previous logic was: increment paid count.

    // Let's stick to the previous logic: if clicked, we increment/pay.
    // However, the UI uses a checkbox. If user unchecks, we should probably revert?
    // Complexity: Managing "paid" state per installment vs global "is_paid".
    // For now, let's assume the Checkbox completes the payment for the CURRENT installment.

    // Simplified logic for this specific design which seems to track "Recente" vs "Pendente" vs "Pago".
    // If we follow the "installments" logic strictly:
    // If not full, increment. If full, set is_paid.
    // But the checkbox implies a toggle. 
    // Let's make the checkbox toggle the `is_paid` status of the WHOLE purchase for simplicity 
    // OR if we want to be granular, we just increment.
    // Given the UI shows "Parcelas (3/10)", the checkbox likely marks the *current* month as handled, 
    // but our DB schema might just have `installments_paid`.

    // Let's implement: Click checkbox -> Advances payment by 1.
    // But what if they uncheck?
    // Let's keep it simple: The checkbox reflects if the item is FULLY paid?
    // Or maybe just "Mark this month as paid".
    // Let's assume the user wants to mark the WHOLE thing as paid if they click the big checkbox? 
    // Actually, looking at the design "Marcar como Pago", it probably means "Mark this month's installment".

    // Let's stick to: Click -> Increment `installments_paid`.
    if (currentPaid >= total) return;

    const newPaidCount = currentPaid + 1;
    const isFullyPaid = newPaidCount >= total;

    try {
      const { error } = await supabase
        .from('third_party_purchases')
        .update({
          installments_paid: newPaidCount,
          is_paid: isFullyPaid
        })
        .eq('id', id);

      if (error) throw error;

      setPurchases(prev => prev.map(p =>
        p.id === id
          ? { ...p, installments_paid: newPaidCount, is_paid: isFullyPaid }
          : p
      ));
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar?")) return;
    try {
      const { error } = await supabase.from('third_party_purchases').delete().eq('id', id);
      if (error) throw error;
      setPurchases(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("Erro ao apagar");
    }
  };

  const getInstallmentDetails = (purchase: Purchase) => {
    // Determine the installment number based on Start Date vs Selected Date
    const [y, m] = purchase.start_payment_date.split('-');
    const startYear = parseInt(y);
    const startMonth = parseInt(m) - 1;

    // Difference in months
    const diffMonths = (selectedYear - startYear) * 12 + (selectedMonth - startMonth);
    const installmentNumber = diffMonths + 1;

    // Show if it's within the range [1, total]
    const isValid = installmentNumber >= 1 && installmentNumber <= purchase.installments_total;

    // A purchase is "Paid" for THIS view if the currently displayed installment number 
    // is less than or equal to the number of installments already paid.
    // e.g. Paid 3. Current month is installment 3. So 3 <= 3 -> Paid.
    // e.g. Paid 3. Current month is installment 4. So 4 <= 3 -> False (Pending).
    const isPaidThisMonth = installmentNumber <= purchase.installments_paid;

    // If the WHOLE purchase is marked is_paid in DB, then it is paid.
    const isFullyPaid = purchase.is_paid;

    const installmentValue = purchase.amount / purchase.installments_total;
    const progressPercent = (purchase.installments_paid / purchase.installments_total) * 100;

    return { isValid, installmentNumber, isPaidThisMonth, isFullyPaid, installmentValue, progressPercent };
  };

  const activePurchases = purchases
    .map(p => ({ ...p, ...getInstallmentDetails(p) }))
    .filter(p => p.isValid) // Only show active installments for this month
    .filter(p => p.person_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.item_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalReceivable = activePurchases
    .filter(p => !p.isPaidThisMonth && !p.isFullyPaid)
    .reduce((acc, curr) => acc + curr.installmentValue, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden shadow-2xl bg-background-light dark:bg-background-dark font-display text-[#111814] dark:text-white transition-colors duration-200">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-[24px]">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Compra de Terceiros</h1>
          <Link to="/wallet/register" className="flex size-10 items-center justify-center rounded-full bg-primary text-[#102217] shadow-lg hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6 pb-28">
        {/* Filters */}
        <section className="flex gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_month</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full h-12 pl-10 pr-10 bg-white dark:bg-surface-dark text-[#111814] dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-bold shadow-sm cursor-pointer transition-all outline-none"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[24px]">arrow_drop_down</span>
            </div>
          </div>
          <div className="relative w-36 group">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full h-12 pl-4 pr-10 bg-white dark:bg-surface-dark text-[#111814] dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-bold shadow-sm cursor-pointer transition-all outline-none"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[24px]">arrow_drop_down</span>
            </div>
          </div>
        </section>

        {/* Total Card */}
        <section>
          <div className="w-full bg-[#111814] dark:bg-surface-dark rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
            <div className="relative z-10 flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-sm font-medium">Total a Receber</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(totalReceivable)}</h2>
              </div>
              <div className="bg-primary/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary text-[28px]">account_balance_wallet</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section>
          <div className="group flex w-full items-center rounded-xl bg-white dark:bg-surface-dark border border-transparent focus-within:border-primary/50 shadow-sm transition-all h-12">
            <div className="pl-4 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none text-base text-[#111814] dark:text-white placeholder:text-gray-400 focus:ring-0 px-3 h-full rounded-xl outline-none"
              placeholder="Buscar por nome..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-[#111814] dark:text-white">Compras Recentes</h3>
            {/* <span className="text-xs font-medium text-primary cursor-pointer hover:underline">Ver todas</span> */}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : activePurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhuma compra para este mês.</div>
          ) : (
            activePurchases.map((item) => (
              <article key={item.id} className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden transition-all">
                <div className="flex gap-4 mb-3">
                  <div className="relative shrink-0">
                    <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 text-primary-dark dark:text-primary font-bold text-xl">
                      {item.person_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex justify-between items-start w-full">
                      <div className="overflow-hidden">
                        <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight truncate">{item.person_name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.item_name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="block text-primary font-bold text-lg">{formatCurrency(item.installmentValue)}</span>
                        {item.isPaidThisMonth || item.isFullyPaid ? (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-block mt-1">Pago</span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded inline-block mt-1">Pendente</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress & Actions */}
                <div className="bg-background-light dark:bg-black/20 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex flex-col w-full pr-4">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Parcelas ({item.installments_paid}/{item.installments_total})</span>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(item.progressPercent, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-[#111814] dark:text-gray-200">
                        {item.installmentNumber}/{item.installments_total}
                      </span>
                    </div>
                  </div>
                  <div className="h-px w-full bg-gray-200 dark:bg-white/10 my-1"></div>

                  <div className="flex items-center justify-between gap-3 mt-1">
                    <label className={`flex items-center gap-2 cursor-pointer group/check ${item.isPaidThisMonth ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isPaidThisMonth}
                          onChange={() => handleTogglePaid(item.id, item.installments_paid, item.installments_total, item.isPaidThisMonth)}
                          className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 checked:bg-primary checked:border-primary transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[14px]">check</span>
                      </div>
                      <span className={`text-xs font-semibold transition-colors select-none ${item.isPaidThisMonth ? 'text-primary' : 'text-gray-500 group-hover/check:text-primary'}`}>
                        {item.isPaidThisMonth ? 'Pago' : 'Marcar como Pago'}
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { /* Edit logic if needed */ }}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#111814] dark:hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        <span className="hidden sm:inline">Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {/* Nav is in App.tsx typically, but HTML had it. We stick to App.tsx's BottomNav for global consistency. */}
    </div>
  );
};

export default Wallet;