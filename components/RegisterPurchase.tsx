import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const RegisterPurchase: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showToast } = useToast();

  // State
  const [amount, setAmount] = useState('');
  const [personName, setPersonName] = useState('');

  const [itemName, setItemName] = useState('');
  const [cardUsed, setCardUsed] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStart, setPaymentStart] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.purchase) {
      const p = location.state.purchase;
      setIsEditing(true);
      setEditId(p.id);
      setAmount(p.amount.toString());
      setPersonName(p.person_name);
      setItemName(p.item_name || '');
      setCardUsed('');
      setDate(p.purchase_date);
      setPaymentStart(p.start_payment_date);
      setInstallments(p.installments_total);
    }
  }, [location.state]);

  const handleIncrement = () => {
    if (installments < 99) setInstallments(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (installments > 1) setInstallments(prev => prev - 1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !personName) {
      showToast("Por favor, preencha o valor e o nome da pessoa.", "warning");
      return;
    }

    const finalItemName = itemName || `Compra no ${cardUsed || 'Cartão'} `;
    const totalAmount = parseFloat(amount.toString().replace(',', '.')); // ensure clean float

    setLoading(true);
    try {
      if (isEditing && editId) {
        const { error } = await supabase
          .from('third_party_purchases')
          .update({
            person_name: personName,
            item_name: finalItemName,
            amount: totalAmount,
            installments_total: installments,
            purchase_date: date,
            start_payment_date: paymentStart,
            // We usually don't reset installments_paid on simple edit unless requested
          })
          .eq('id', editId);

        if (error) throw error;
        showToast("Compra atualizada com sucesso!", "success");
      } else {
        const { error } = await supabase
          .from('third_party_purchases')
          .insert({
            user_id: session?.user.id,
            person_name: personName,
            item_name: finalItemName,
            amount: totalAmount,
            installments_total: installments,
            installments_paid: 0,
            purchase_date: date,
            start_payment_date: paymentStart,
            is_paid: false
          });

        if (error) throw error;
        showToast("Compra registrada com sucesso!", "success");
      }

      navigate('/wallet');
    } catch (error) {
      console.error('Error saving purchase:', error);
      showToast("Erro ao salvar compra.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-background-dark font-display min-h-full transition-colors duration-200">
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden shadow-2xl">
        <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <Link to="/wallet" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[#111814] dark:text-white text-[24px]">arrow_back</span>
            </Link>
            <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-[#111814] dark:text-white">
              {isEditing ? 'Editar Compra' : 'Registrar Compra'}
            </h1>
            <div className="size-10"></div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 space-y-6 pb-20">
          <section className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide" htmlFor="amount">Valor da Compra</label>
            <div className="relative flex items-center justify-center w-full">
              <span className="text-3xl font-bold text-gray-400 mr-2 mt-1">R$</span>
              <input
                autoFocus
                className="text-5xl font-extrabold text-[#111814] dark:text-white bg-transparent border-none text-center p-0 w-full max-w-[240px] focus:ring-0 placeholder-gray-200 dark:placeholder-white/10 caret-primary"
                id="amount"
                placeholder="0,00"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </section>

          <form className="space-y-5" onSubmit={handleSave}>
            {/* Person Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Nome da Pessoa</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">person</span>
                </div>
                <input
                  className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="Ex: Carlos Silva"
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                />
              </div>
            </div>

            {/* Added Item Name to match Logic requirements, retaining style */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">O que foi comprado?</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">shopping_bag</span>
                </div>
                <input
                  className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="Ex: iPhone 14"
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Data da Compra</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[20px]">calendar_today</span>
                  </div>
                  <input
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-2 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm sm:text-sm sm:leading-6 transition-all"
                    style={{ colorScheme: 'light dark' }}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-2 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm sm:text-sm sm:leading-6 transition-all"
                    style={{ colorScheme: 'light dark' }}
                    type="date"
                    value={paymentStart}
                    onChange={(e) => setPaymentStart(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Quantidade de Parcelas</label>
              <div className="bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/10 rounded-xl p-1.5 flex items-center justify-between shadow-sm px-2">
                <button
                  className="w-12 h-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 text-[#111814] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all"
                  type="button"
                  onClick={handleDecrement}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>remove</span>
                </button>
                <div className="flex-1 px-4 flex items-center justify-center gap-2">
                  <input
                    className="w-auto max-w-[3rem] bg-transparent border-0 text-center font-bold text-lg text-[#111814] dark:text-white focus:ring-0 p-0 pointer-events-none"
                    max="99"
                    min="1"
                    type="number"
                    value={installments}
                    readOnly
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">
                    {installments === 1 ? 'Vez' : 'Vezes'}
                  </span>
                </div>
                <button
                  className="w-12 h-10 flex items-center justify-center rounded-lg bg-primary text-[#102217] shadow-sm hover:brightness-110 active:scale-95 transition-all"
                  type="button"
                  onClick={handleIncrement}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#111814] dark:text-gray-300 ml-1">Cartão Utilizado</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>credit_card</span>
                </div>
                <input
                  className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-[#111814] dark:text-white bg-white dark:bg-surface-dark ring-1 ring-inset ring-gray-200 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="Ex: Nubank, Inter..."
                  type="text"
                  value={cardUsed}
                  onChange={(e) => setCardUsed(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 pb-4 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-primary hover:brightness-110 active:scale-[0.98] text-[#102217] rounded-xl py-4 px-6 font-bold text-base shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined transition-transform group-hover:-translate-y-0.5" style={{ fontSize: '22px' }}>check_circle</span>
                {loading ? 'Salvando...' : 'Salvar Compra'}
              </button>
              <Link
                to="/wallet"
                className="flex items-center justify-center w-full bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-[0.98] rounded-xl py-4 px-6 font-semibold text-base transition-all"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default RegisterPurchase;