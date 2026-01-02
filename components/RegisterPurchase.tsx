import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const RegisterPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form States
  const [amount, setAmount] = useState('');
  const [personName, setPersonName] = useState('');
  const [itemName, setItemName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStart, setPaymentStart] = useState(new Date().toISOString().split('T')[0]);

  const handleIncrement = () => {
    if (installments < 99) setInstallments(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (installments > 1) setInstallments(prev => prev - 1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !personName || !itemName) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const totalAmount = parseFloat(amount);
    const installmentValue = totalAmount / installments;
    // const lastPaymentDate = ... (calculation logic if needed for display)

    const message = `Confirmar registro?\n\n` +
      `Item: ${itemName}\n` +
      `Pessoa: ${personName}\n` +
      `Total: R$ ${totalAmount.toFixed(2)}\n` +
      `Parcelas: ${installments}x de R$ ${installmentValue.toFixed(2)}`;

    if (window.confirm(message)) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('third_party_purchases')
          .insert({
            user_id: session?.user.id,
            person_name: personName,
            item_name: itemName,
            amount: totalAmount,
            installments_total: installments,
            installments_paid: 0,
            purchase_date: purchaseDate,
            start_payment_date: paymentStart,
            is_paid: false
          });

        if (error) throw error;

        alert("Compra registrada com sucesso!");
        navigate('/wallet');
      } catch (error) {
        console.error('Error saving purchase:', error);
        alert("Erro ao salvar compra.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <Link to="/wallet" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-2xl">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-[#111814] dark:text-white">Registrar Compra</h1>
          <div className="size-10"></div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 pb-32">
        {/* Amount Card */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-card border border-transparent flex flex-col items-center justify-center gap-2 relative overflow-hidden group transition-colors">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          <label htmlFor="amount" className="text-sm font-bold text-gray-400 uppercase tracking-wide">Valor da Compra</label>
          <div className="relative flex items-center justify-center w-full">
            <span className="text-3xl font-bold text-gray-400 mr-2 mt-1">R$</span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-5xl font-extrabold text-[#111814] dark:text-white bg-transparent border-none text-center p-0 w-full max-w-[240px] focus:ring-0 placeholder-gray-200 dark:placeholder-white/10 caret-primary"
            />
          </div>
        </section>

        <form className="space-y-5" onSubmit={handleSave}>
          {/* Item Name (New Field) */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">O que foi comprado?</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">shopping_bag</span>
              </div>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex: iPhone 14, Jantar"
                className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 sm:text-sm sm:leading-6 transition-all"
              />
            </div>
          </div>

          {/* Person Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Nome da Pessoa</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">person</span>
              </div>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 sm:text-sm sm:leading-6 transition-all"
              />
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Data da Compra</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">calendar_today</span>
                </div>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{ colorScheme: 'light dark' }}
                  className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-2 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm sm:text-sm sm:leading-6 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Início Pagamento</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">event_upcoming</span>
                </div>
                <input
                  type="date"
                  value={paymentStart}
                  onChange={(e) => setPaymentStart(e.target.value)}
                  style={{ colorScheme: 'light dark' }}
                  className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-2 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm sm:text-sm sm:leading-6 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Installments */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Quantidade de Parcelas</label>
            <div className="bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/5 rounded-xl p-1.5 flex items-center shadow-sm">
              <button
                type="button"
                onClick={handleDecrement}
                className="size-12 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 text-[#111814] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">remove</span>
              </button>
              <div className="flex-1 px-4 text-center">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={installments}
                  readOnly
                  className="w-full bg-transparent border-0 text-center font-bold text-lg text-[#111814] dark:text-white focus:ring-0 p-0 pointer-events-none"
                />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block -mt-1">
                  {installments === 1 ? 'VEZ' : 'VEZES'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleIncrement}
                className="size-12 flex items-center justify-center rounded-lg bg-primary text-[#102217] shadow-sm hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button type="submit" disabled={loading} className="group w-full bg-primary hover:brightness-110 active:scale-[0.98] text-[#102217] rounded-xl py-4 px-6 font-bold text-base shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined transition-transform group-hover:-translate-y-0.5 text-[22px]">check_circle</span>
              {loading ? 'Salvando...' : 'Salvar Compra'}
            </button>
            <Link to="/wallet" className="flex w-full items-center justify-center bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-[0.98] rounded-xl py-4 px-6 font-bold text-base transition-all">
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default RegisterPurchase;