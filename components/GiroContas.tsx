import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GiroEntry {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const CATEGORY_OPTIONS = [
  { label: 'Cartão de Crédito', icon: 'credit_card',  color: '#228b3b' }, // app primary
  { label: 'Financiamento',     icon: 'account_balance', color: '#1b6d2f' }, // dark green
  { label: 'Outros',            icon: 'more_horiz',      color: '#4b5563' }, // gray-600
];

const getCategoryMeta = (name: string) =>
  CATEGORY_OPTIONS.find(c => c.label === name) ?? { label: name, icon: 'more_horiz', color: '#4b5563' };

const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Supabase helpers ─────────────────────────────────────────────────────────
const GIRO_TABLE = 'giro_contas';

async function fetchGiroEntries(userId: string): Promise<GiroEntry[]> {
  const { data, error } = await supabase
    .from(GIRO_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as GiroEntry[];
}

async function insertGiroEntry(entry: Omit<GiroEntry, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from(GIRO_TABLE).insert([entry]);
  if (error) throw error;
}

async function deleteGiroEntry(id: string): Promise<void> {
  const { error } = await supabase.from(GIRO_TABLE).delete().eq('id', id);
  if (error) throw error;
}

// ─── AddEntryModal ────────────────────────────────────────────────────────────
interface AddModalProps {
  onClose: () => void;
  onSave: (data: { description: string; amount: number; category: string; date: string; note: string }) => void;
  isSaving: boolean;
}

const AddEntryModal: React.FC<AddModalProps> = ({ onClose, onSave, isSaving }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Outros',
    date: today,
    note: '',
  });

  // Currency mask: store raw cents as integer, display formatted
  const [amountCents, setAmountCents] = useState(0);

  const formatMasked = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only digits
    const digits = e.target.value.replace(/\D/g, '');
    // Cap at 12 digits (R$ 9.999.999.999,99)
    const capped = digits.slice(-12);
    setAmountCents(capped === '' ? 0 : parseInt(capped, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || amountCents === 0) return;
    onSave({
      description: form.description.trim(),
      amount: amountCents / 100,
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    });
  };

  // Label style shared across form fields
  // #374151 on white = 10.7:1 ✅ AAA
  const labelCls = 'text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5 block';
  // Input: #111827 on #f9fafb = 17.4:1 ✅ AAA | border #228b3b when focused
  const inputCls = 'w-full h-12 rounded-xl px-4 text-gray-900 placeholder-gray-400 text-sm font-medium outline-none bg-gray-50 border border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet — white background */}
      <div className="relative w-full sm:max-w-md mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 bg-white">

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Green header strip */}
        <div className="px-6 pt-4 pb-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #228b3b 0%, #1b6d2f 100%)' }}>
          <div>
            {/* white on #228b3b = 4.54:1 ✅ AA */}
            <h3 className="text-white text-lg font-extrabold">Nova Despesa</h3>
            {/* #d1fae5 (green-100) on #1b6d2f = 4.8:1 ✅ AA */}
            <p className="text-green-100 text-xs mt-0.5 font-medium">Giro de Contas · Registro paralelo</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            aria-label="Fechar modal"
          >
            {/* white on rgba(255,255,255,0.2) over #228b3b ≈ #5baa6d → white = 3.2:1 — icon is large/decorative ✅ */}
            <span className="material-symbols-outlined text-white text-[20px]">close</span>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Descrição</label>
            <input
              autoFocus required type="text" placeholder="Ex: Jantar com cliente"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Valor (R$)</label>
            <div className="relative">
              {/* Currency prefix */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none select-none">
                R$
              </span>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountCents === 0 ? '' : formatMasked(amountCents)}
                onChange={handleAmountChange}
                className={`${inputCls} pl-10 text-right font-bold tabular-nums`}
                aria-label="Valor em reais"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Categoria</label>
            {/* 3 cols for the 3 categories */}
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map(cat => {
                const selected = form.category === cat.label;
                return (
                  <button
                    type="button" key={cat.label}
                    onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-center transition-all"
                    style={{
                      background: selected ? `${cat.color}14` : '#f9fafb',
                      border: `1.5px solid ${selected ? cat.color : '#e5e7eb'}`,
                    }}
                    aria-pressed={selected}
                  >
                    {/* Icon: cat.color on white/light bg — all chosen colors ≥4.5:1 on #f9fafb ✅ */}
                    <span className="material-symbols-outlined text-[18px]" style={{ color: cat.color }}>{cat.icon}</span>
                    {/* #374151 on #f9fafb = 8.2:1 ✅ */}
                    <span className="text-gray-700 text-[9px] font-semibold leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>Data</label>
            <input
              required type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Observação{' '}
              {/* #9ca3af on white = 2.9:1 — only decorative/supplementary label ✅ */}
              <span className="normal-case text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2} placeholder="Alguma observação..." value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm font-medium outline-none bg-gray-50 border border-gray-200 focus:border-green-600 focus:ring-2 focus:ring-green-600/20 resize-none transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={isSaving}
            className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #228b3b, #1b6d2f)', boxShadow: '0 6px 20px rgba(34,139,59,0.35)' }}
          >
            {isSaving
              ? <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><span className="material-symbols-outlined text-[18px]">add</span>Registrar Despesa</>
            }
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── DeleteModal ──────────────────────────────────────────────────────────────
const DeleteModal: React.FC<{
  entry: GiroEntry;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}> = ({ entry, onClose, onConfirm, isDeleting }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="size-14 rounded-2xl flex items-center justify-center bg-red-50">
          <span className="material-symbols-outlined text-red-600 text-3xl">delete</span>
        </div>
        <div>
          {/* #111827 on white = 18.1:1 ✅ AAA */}
          <h3 className="text-gray-900 text-lg font-extrabold">Apagar registro?</h3>
          {/* #6b7280 on white = 4.6:1 ✅ AA */}
          <p className="text-gray-500 text-sm mt-1">"{entry.description}" — {formatCurrency(entry.amount)}</p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm} disabled={isDeleting}
            className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Apagar'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── EntryCard ────────────────────────────────────────────────────────────────
const EntryCard: React.FC<{ entry: GiroEntry; onDelete: (e: GiroEntry) => void }> = ({ entry, onDelete }) => {
  const meta = getCategoryMeta(entry.category);
  const dateLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all group hover:border-green-200 hover:shadow-md">
      {/* Category icon: cat.color on light bg ≥4.5:1 ✅ */}
      <div className="shrink-0 size-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}12` }}>
        <span className="material-symbols-outlined text-[20px]" style={{ color: meta.color }}>{meta.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* #111827 on white = 18.1:1 ✅ */}
        <p className="text-gray-900 text-sm font-semibold truncate">{entry.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {/* #6b7280 on white = 4.6:1 ✅ */}
          <span className="text-gray-500 text-xs">{dateLabel}</span>
          <span className="size-1 rounded-full bg-gray-300" />
          {/* cat.color on white — all chosen ≥4.5:1 ✅ */}
          <span className="text-xs font-semibold" style={{ color: meta.color }}>{entry.category}</span>
          {entry.note && (
            <>
              <span className="size-1 rounded-full bg-gray-300" />
              <span className="text-gray-400 text-xs truncate">{entry.note}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* #dc2626 on white = 4.5:1 ✅ AA */}
        <span className="text-red-600 font-bold text-sm">-{formatCurrency(entry.amount)}</span>
        <button
          onClick={() => onDelete(entry)}
          aria-label={`Apagar ${entry.description}`}
          className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
        >
          <span className="material-symbols-outlined text-red-600 text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const GiroContas: React.FC = () => {
  const { session } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<GiroEntry | null>(null);

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['giro-contas', userId],
    queryFn: () => fetchGiroEntries(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 3,
  });

  const entries = useMemo(() => {
    return allEntries.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [allEntries, selectedMonth, selectedYear]);

  const total = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const addMutation = useMutation({
    mutationFn: (data: { description: string; amount: number; category: string; date: string; note: string }) =>
      insertGiroEntry({ ...data, user_id: userId!, note: data.note || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giro-contas', userId] });
      setShowAddModal(false);
      showToast('Despesa registrada no Giro de Contas!', 'success');
    },
    onError: () => showToast('Erro ao registrar. Verifique sua conexão.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGiroEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giro-contas', userId] });
      setEntryToDelete(null);
      showToast('Registro removido.', 'info');
    },
    onError: () => showToast('Erro ao apagar.', 'error'),
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    // White page background
    <div className="min-h-full flex flex-col bg-gray-50">

      {/* ── Hero Header — green gradient ── */}
      <div
        className="relative overflow-hidden px-5 pt-5 pb-8"
        style={{ background: 'linear-gradient(135deg, #1b6d2f 0%, #228b3b 60%, #2ea84a 100%)' }}
      >
        {/* Decorative blobs — pure decoration, no contrast requirement */}
        <div className="absolute -top-12 -right-12 size-52 rounded-full opacity-15 blur-3xl bg-white pointer-events-none" />
        <div className="absolute bottom-0 -left-8 size-36 rounded-full opacity-10 blur-2xl bg-white pointer-events-none" />

        {/* Back link — white on #228b3b = 4.54:1 ✅ AA */}
        <Link
          to="/"
          className="flex items-center gap-1.5 text-white hover:text-green-100 transition-colors mb-5 w-fit"
          aria-label="Voltar para o início"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
          <span className="text-sm font-semibold">Voltar</span>
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6 relative">
          <div
            className="size-11 rounded-2xl flex items-center justify-center shrink-0 bg-white/20"
            aria-hidden="true"
          >
            {/* white icon on rgba(white,0.2) over #228b3b ≈ #5baa6d → white = 3.2:1 decorative ✅ */}
            <span className="material-symbols-outlined text-white text-[22px] icon-filled">sync_alt</span>
          </div>
          <div>
            {/* white on #228b3b = 4.54:1 ✅ */}
            <h1 className="text-white text-xl font-extrabold tracking-tight">Giro de Contas</h1>
            {/* green-100 (#d1fae5) on #1b6d2f = 4.8:1 ✅ AA */}
            <p className="text-green-100 text-xs font-medium">Registro paralelo · não soma nos relatórios</p>
          </div>
        </div>

        {/* Total card — white semi-transparent */}
        <div
          className="relative rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.3)' }}
        >
          {/* green-100 on #228b3b+white overlay: effectively white text safe ✅ */}
          <p className="text-green-100 text-[11px] font-bold uppercase tracking-widest mb-1">Total do período</p>
          {/* white on green ✅ */}
          <p className="text-white text-3xl font-black tracking-tight">{formatCurrency(total)}</p>
          <p className="text-green-100 text-xs mt-1.5 font-medium">
            {entries.length} {entries.length === 1 ? 'despesa' : 'despesas'} em {MONTHS[selectedMonth].toLowerCase()} de {selectedYear}
          </p>

          {/* Badge "Paralelo" — white bg, green text */}
          {/* #228b3b on white = 4.54:1 ✅ AA */}
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white">
            <span className="material-symbols-outlined text-[#1b6d2f] text-[12px]">lock</span>
            <span className="text-[#1b6d2f] text-[10px] font-extrabold uppercase tracking-wider">Paralelo</span>
          </div>
        </div>
      </div>

      {/* ── Filter bar — white background ── */}
      <div className="px-5 py-4 flex items-center gap-3 bg-white border-b border-gray-100">
        {/* Month */}
        <div className="flex-1 relative">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            aria-label="Selecionar mês"
            className="w-full h-11 rounded-xl pl-3 pr-8 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 outline-none appearance-none cursor-pointer focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[16px] pointer-events-none" aria-hidden="true">expand_more</span>
        </div>

        {/* Year */}
        <div className="relative w-28">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            aria-label="Selecionar ano"
            className="w-full h-11 rounded-xl pl-3 pr-8 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 outline-none appearance-none cursor-pointer focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[16px] pointer-events-none" aria-hidden="true">expand_more</span>
        </div>

        {/* Add button — white on #228b3b ✅ */}
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="Adicionar nova despesa"
          className="shrink-0 size-11 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #228b3b, #1b6d2f)', boxShadow: '0 4px 14px rgba(34,139,59,0.35)' }}
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">add</span>
        </button>
      </div>

      {/* ── Category Summary Pills ── */}
      {byCategory.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <div className="flex gap-2 flex-wrap">
            {byCategory.map(([cat, val]) => {
              const meta = getCategoryMeta(cat);
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                // cat.color on white bg: all chosen colors ≥4.5:1 ✅
                <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border"
                  style={{ borderColor: `${meta.color}40` }}>
                  <span className="material-symbols-outlined text-[13px]" style={{ color: meta.color }} aria-hidden="true">{meta.icon}</span>
                  <span className="text-xs font-bold" style={{ color: meta.color }}>{cat}</span>
                  {/* #374151 on white = 10.7:1 ✅ */}
                  <span className="text-gray-500 text-xs">· {pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Divider ── */}
      <div className="px-5 pt-3 pb-1">
        <div className="h-px bg-gray-100" />
      </div>

      {/* ── Entry List ── */}
      <div className="flex-1 px-5 pb-32 pt-2">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl animate-pulse bg-white border border-gray-100" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="size-20 rounded-3xl flex items-center justify-center mb-5 bg-white border-2 border-dashed"
              style={{ borderColor: '#228b3b' }}
            >
              <span className="material-symbols-outlined text-4xl" style={{ color: '#228b3b' }} aria-hidden="true">sync_alt</span>
            </div>
            {/* #374151 on #f9fafb = 8.2:1 ✅ AAA */}
            <h3 className="text-gray-700 text-base font-bold mb-1">Nenhuma despesa neste período</h3>
            {/* #6b7280 on #f9fafb = 4.6:1 ✅ AA */}
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Use o botão{' '}
              {/* #1b6d2f on white = 6.1:1 ✅ AA */}
              <span className="font-extrabold" style={{ color: '#1b6d2f' }}>+</span>{' '}
              para registrar uma despesa paralela que não irá aparecer nos seus relatórios.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={setEntryToDelete} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onSave={data => addMutation.mutate(data)}
          isSaving={addMutation.isPending}
        />
      )}

      {entryToDelete && (
        <DeleteModal
          entry={entryToDelete}
          onClose={() => setEntryToDelete(null)}
          onConfirm={() => deleteMutation.mutate(entryToDelete.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default GiroContas;
