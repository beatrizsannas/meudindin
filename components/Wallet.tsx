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
  avatar?: string; // Optional if we want to add avatars later
}

const Wallet: React.FC = () => {
  const { openMenu } = useContext(MenuContext);
  const { session } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleMarkAsPaid = async (id: string, currentPaidCount: number, total: number) => {
    // Logic: Increment installments_paid. If it reaches total, is_paid = true.
    const newPaidCount = currentPaidCount + 1;
    const isFullyPaid = newPaidCount >= total;

    if (newPaidCount > total) return; // Already fully paid

    try {
      const { error } = await supabase
        .from('third_party_purchases')
        .update({
          installments_paid: newPaidCount,
          is_paid: isFullyPaid
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPurchases(prev => prev.map(p =>
        p.id === id
          ? { ...p, installments_paid: newPaidCount, is_paid: isFullyPaid }
          : p
      ));
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar este registro?")) return;

    try {
      const { error } = await supabase
        .from('third_party_purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPurchases(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Erro ao apagar.');
    }
  };


  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Helper to calculate installment details for the selected month
  const getInstallmentDetails = (purchase: Purchase) => {
    // Calculate month difference: (SelectedYear - StartYear) * 12 + (SelectedMonth - StartMonth)
    const [y, m] = purchase.start_payment_date.split('-');
    const startYear = parseInt(y);
    const startMonth = parseInt(m) - 1; // 0-indexed

    const diffMonths = (selectedYear - startYear) * 12 + (selectedMonth - startMonth);
    const installmentNumber = diffMonths + 1; // 1st installment is at diff 0

    const isValid = installmentNumber >= 1 && installmentNumber <= purchase.installments_total;

    // Check if this specific installment is paid
    const isPaid = installmentNumber <= purchase.installments_paid;

    const installmentValue = purchase.amount / purchase.installments_total;

    return { isValid, installmentNumber, isPaid, installmentValue };
  };

  // Filter purchases that have an active installment in this month
  const activePurchases = purchases.map(p => {
    const details = getInstallmentDetails(p);
    return { ...p, ...details };
  }).filter(p => p.isValid);

  const totalReceivable = activePurchases
    .filter(p => !p.isPaid)
    .reduce((sum, p) => sum + p.installmentValue, 0);

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
          <h2 className="text-xl font-extrabold leading-tight text-[#111814] dark:text-white">Carteiras</h2>
        </div>
        <Link to="/register-purchase" className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-symbols-outlined text-3xl">add_circle</span>
        </Link>
      </div>

      <div className="px-6 flex flex-col gap-6 pb-28">
        {/* Filter */}
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

        {/* Total Card */}
        <div className="bg-gradient-to-br from-[#102217] to-[#1c3326] dark:from-[#1c3326] dark:to-[#102217] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 size-32 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <p className="text-sm font-medium text-primary mb-1">Total a Receber ({months[selectedMonth]})</p>
          <h1 className="text-3xl font-bold tracking-tight">{formatCurrency(totalReceivable)}</h1>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-[#111814] dark:text-white">Compras Parceladas</h3>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Carregando...</div>
          ) : activePurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhuma parcela para este mês.</div>
          ) : (
            activePurchases.map((purchase) => (
              <div key={purchase.id} className={`bg-white dark:bg-surface-dark p-4 rounded-2xl border ${purchase.isPaid ? 'border-green-100 dark:border-green-900/30' : 'border-gray-100 dark:border-white/5'} shadow-card transition-all relative overflow-hidden group`}>
                {purchase.isPaid && (
                  <div className="absolute top-0 right-0 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                    PAGO
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`size-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${purchase.isPaid ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
                      {purchase.person_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#111814] dark:text-white leading-tight">{purchase.person_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{purchase.item_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          {purchase.installmentNumber} / {purchase.installments_total}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(purchase.start_payment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-[#111814] dark:text-white">{formatCurrency(purchase.installmentValue)}</span>

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="size-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Apagar"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      {!purchase.isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(purchase.id, purchase.installments_paid, purchase.installments_total)}
                          className="size-8 flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/10 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="Marcar como Pago"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;