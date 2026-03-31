import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import ImovelExportModal from './ImovelExportModal';

interface Property {
  id: string;
  name: string;
  address: string | null;
  contract_value?: number | null;
}

interface Payment {
  id: string;
  category: CategoryKey;
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
}

type CategoryKey = 'entrada' | 'fgts' | 'construtora' | 'evolucao_obra' | 'financiamento' | 'outros';

const CATEGORIES: { key: CategoryKey; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'entrada',       label: 'Entrada',          icon: 'home',            color: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-100 dark:bg-blue-900/20' },
  { key: 'fgts',          label: 'FGTS',             icon: 'account_balance', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  { key: 'construtora',   label: 'Construtora',      icon: 'construction',    color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-100 dark:bg-orange-900/20' },
  { key: 'evolucao_obra', label: 'Evolução de Obra', icon: 'trending_up',     color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-100 dark:bg-purple-900/20' },
  { key: 'financiamento', label: 'Financiamento',    icon: 'credit_card',     color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-100 dark:bg-rose-900/20' },
  { key: 'outros',        label: 'Outros',           icon: 'more_horiz',      color: 'text-gray-600 dark:text-gray-400',      bg: 'bg-gray-100 dark:bg-gray-800' },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const ImovelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();

  const property: Property = location.state?.property ?? { id, name: 'Imóvel', address: null };

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<CategoryKey | 'all'>('all');

  // Add payment modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selCategory, setSelCategory] = useState<CategoryKey>('construtora');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit
  const [editTarget, setEditTarget] = useState<Payment | null>(null);

  // Export
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => { fetchPayments(); }, [id]);

  const fetchPayments = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_payments')
        .select('*')
        .eq('property_id', id)
        .order('date', { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (e: any) {
      showToast('Erro ao carregar pagamentos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const map: Record<CategoryKey, number> = {
      entrada: 0, fgts: 0, construtora: 0, evolucao_obra: 0, financiamento: 0, outros: 0,
    };
    payments.forEach(p => { map[p.category] = (map[p.category] || 0) + p.amount; });
    return map;
  }, [payments]);

  const grandTotal = useMemo(() => {
    return (Object.keys(totals) as CategoryKey[]).reduce((sum, k) => sum + totals[k], 0);
  }, [totals]);

  const filteredPayments = useMemo(() =>
    filterCat === 'all' ? payments : payments.filter(p => p.category === filterCat),
    [payments, filterCat]
  );

  const openAdd = () => {
    setEditTarget(null);
    setSelCategory('construtora');
    setAmount('');
    setDesc('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsAddOpen(true);
  };

  const openEdit = (p: Payment) => {
    setEditTarget(p);
    setSelCategory(p.category);
    setAmount(p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setDesc(p.description || '');
    setDate(p.date);
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!amount) { showToast('Informe o valor.', 'warning'); return; }
    const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) { showToast('Valor inválido.', 'warning'); return; }

    setSaving(true);
    try {
      const payload = {
        property_id: id,
        user_id: session!.user.id,
        category: selCategory,
        description: desc.trim() || null,
        amount: numericAmount,
        date,
      };

      if (editTarget) {
        const { error } = await supabase.from('property_payments').update(payload).eq('id', editTarget.id);
        if (error) throw error;
        showToast('Pagamento atualizado!', 'success');
      } else {
        const { error } = await supabase.from('property_payments').insert(payload);
        if (error) throw error;
        showToast('Pagamento registrado!', 'success');
      }

      setIsAddOpen(false);
      fetchPayments();
    } catch (e: any) {
      showToast('Erro: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('property_payments').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      showToast('Pagamento excluído.', 'success');
      setDeleteTarget(null);
      fetchPayments();
    } catch (e: any) {
      showToast('Erro ao excluir.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getCatMeta = (key: CategoryKey) => CATEGORIES.find(c => c.key === key)!;

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#111814] dark:text-white leading-tight">{property.name}</h1>
            {property.address && <p className="text-xs text-gray-500 dark:text-gray-400">{property.address}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-surface-dark text-gray-600 dark:text-gray-300 hover:scale-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-[#111814] shadow-lg hover:scale-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined font-bold">add</span>
          </button>
        </div>
      </header>

      <main className="px-6 pt-4 flex flex-col gap-6">

        {/* Grand Total Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a3a6c] to-[#102a52] dark:from-[#162b4d] dark:to-[#0d1f3a] p-5 shadow-lg text-white">
          <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Total Investido</p>
          <p className="text-4xl font-extrabold tracking-tight">{formatCurrency(grandTotal)}</p>
          {property.contract_value != null && (
            <p className="text-xs text-blue-300 mt-2 font-medium">
              Valor do contrato: {formatCurrency(property.contract_value)}
            </p>
          )}
        </div>

        {/* Category Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilterCat(filterCat === cat.key ? 'all' : cat.key)}
              className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left ${
                filterCat === cat.key
                  ? 'border-primary shadow-md shadow-primary/10'
                  : 'border-gray-100 dark:border-white/5 bg-surface-light dark:bg-surface-dark'
              }`}
            >
              <div className={`size-9 rounded-xl flex items-center justify-center ${cat.bg}`}>
                <span className={`material-symbols-outlined text-[20px] ${cat.color}`}>{cat.icon}</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{cat.label}</p>
              <p className="text-base font-extrabold text-[#111814] dark:text-white">{formatCurrency(totals[cat.key])}</p>
            </button>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          <button
            onClick={() => setFilterCat('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filterCat === 'all' ? 'bg-primary text-[#003314]' : 'bg-surface-light dark:bg-surface-dark text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilterCat(filterCat === cat.key ? 'all' : cat.key)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filterCat === cat.key ? 'bg-primary text-[#003314]' : 'bg-surface-light dark:bg-surface-dark text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Payments List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-[#111814] dark:text-white">
              {filterCat === 'all' ? 'Todos os pagamentos' : getCatMeta(filterCat).label}
            </h3>
            <span className="text-xs text-gray-500">{filteredPayments.length} registro(s)</span>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-8">Carregando...</p>
          ) : filteredPayments.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum pagamento registrado.</p>
          ) : (
            filteredPayments.map(p => {
              const cat = getCatMeta(p.category);
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-white/5">
                  <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${cat.bg}`}>
                    <span className={`material-symbols-outlined text-[20px] ${cat.color}`}>{cat.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#111814] dark:text-white text-sm">{cat.label}</p>
                    {p.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-extrabold text-[#111814] dark:text-white text-sm whitespace-nowrap">{formatCurrency(p.amount)}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add/Edit Payment Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setIsAddOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-white dark:bg-[#1c2e24] rounded-t-3xl shadow-2xl border-t border-gray-100 dark:border-gray-800 p-6 pb-32 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editTarget ? 'Editar Pagamento' : 'Novo Pagamento'}
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Category */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Categoria</span>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setSelCategory(cat.key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        selCategory === cat.key
                          ? 'border-primary bg-primary/10 text-[#111814] dark:text-white'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[18px] ${cat.color}`}>{cat.icon}</span>
                      <span className="text-xs font-bold">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Valor *</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl text-gray-400">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setAmount((Number(v) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                    }}
                    placeholder="0,00"
                    className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-surface-dark text-2xl font-bold border-none rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-[#111814] dark:text-white"
                  />
                </div>
              </label>

              {/* Date */}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Data *</span>
                <div className="relative flex items-center bg-gray-50 dark:bg-surface-dark rounded-xl overflow-hidden">
                  <div className="flex-1 px-4 py-3 pointer-events-none">
                    <p className="font-bold text-[#111814] dark:text-white text-base capitalize">
                      {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Selecione a data'}
                    </p>
                  </div>
                  <span className="pr-4 pointer-events-none text-primary">
                    <span className="material-symbols-outlined text-xl">calendar_month</span>
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </label>

              {/* Description */}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Descrição (opcional)</span>
                <input
                  className="w-full h-12 bg-gray-50 dark:bg-surface-dark text-[#111814] dark:text-white placeholder:text-gray-400 border-none rounded-xl px-4 font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Ex: Parcela 12/48"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 bg-primary hover:bg-primary-dark active:scale-[0.98] text-[#111814] font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span className="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? 'Salvando...' : (editTarget ? 'Salvar Alterações' : 'Registrar Pagamento')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        isDestructive
        title="Excluir Pagamento"
        description="Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      <ImovelExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        property={property}
        payments={payments}
      />
    </div>
  );
};

export default ImovelDetail;
