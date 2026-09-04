import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuContext } from '../App';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';
import ConfirmModal from './ConfirmModal';

export interface RescheduleHistoryItem {
  previous_date: string; // YYYY-MM-DD
  previous_time: string; // HH:mm
  new_date: string; // YYYY-MM-DD
  new_time: string; // HH:mm
  reason?: string;
  rescheduled_at: string;
}

export interface Commitment {
  id: string;
  user_id?: string;
  type: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  original_date?: string | null;
  original_time?: string | null;
  reschedule_history?: RescheduleHistoryItem[] | null;
  location: string | null;
  notes: string | null;
  status: 'pending' | 'completed';
  created_at: string;
}

const APPOINTMENT_TYPES = [
  { value: 'Médico', label: 'Médico', icon: 'medical_services' },
  { value: 'Detran', label: 'Detran', icon: 'directions_car' },
  { value: 'Depilação', label: 'Depilação', icon: 'spa' },
  { value: 'Dentista', label: 'Dentista', icon: 'dentistry' },
  { value: 'Trabalho', label: 'Trabalho', icon: 'work' },
  { value: 'Estudo', label: 'Estudo', icon: 'school' },
  { value: 'Banco', label: 'Banco / Finanças', icon: 'account_balance' },
  { value: 'Outro', label: 'Outro', icon: 'event' },
];

const getTypeIcon = (type: string) => {
  const match = APPOINTMENT_TYPES.find(t => t.value.toLowerCase() === type.toLowerCase());
  return match ? match.icon : 'event';
};

const MONTHS = [
  { value: 'all', label: 'Todos os meses' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: 'all', label: 'Todos os anos' },
  ...Array.from({ length: 6 }, (_, i) => {
    const y = CURRENT_YEAR - 2 + i; // ex: 2024 a 2029
    return { value: String(y), label: String(y) };
  }),
];

const Commitments: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const { openMenu } = useContext(MenuContext);

  const userId = session?.user?.id || 'guest';
  const storageKey = `meudindin_commitments_${userId}`;

  // Initialize from localStorage immediately to eliminate initial loading delay/flicker
  const [commitments, setCommitments] = useState<Commitment[]>(() => {
    try {
      const saved = localStorage.getItem(`meudindin_commitments_${session?.user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Commitment | null>(null);
  const [type, setType] = useState('Médico');
  const [customType, setCustomType] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // View Details Modal State (Consultar sem editar)
  const [viewTarget, setViewTarget] = useState<Commitment | null>(null);

  // Reschedule Modal State (Reagendar)
  const [rescheduleTarget, setRescheduleTarget] = useState<Commitment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Commitment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // History Filter State
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(() => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    return currentMonth;
  });
  const [filterYear, setFilterYear] = useState(() => String(CURRENT_YEAR));

  // Fetch commitments from Supabase with graceful localStorage cache
  const fetchCommitments = async () => {
    setLoading(true);
    try {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('commitments')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: true });

        if (!error && data) {
          setCommitments(data);
          localStorage.setItem(storageKey, JSON.stringify(data));
          return;
        }
      }

      // Fallback to localStorage if offline
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCommitments(JSON.parse(saved));
      } else {
        setCommitments([]);
      }
    } catch {
      const saved = localStorage.getItem(storageKey);
      setCommitments(saved ? JSON.parse(saved) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCommitments(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    fetchCommitments();
  }, [session?.user?.id]);

  // Current month summary count
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${year}-${month}`;
  }, []);

  const currentMonthCount = useMemo(() => {
    return commitments.filter(c => c.date.startsWith(currentMonthStr)).length;
  }, [commitments, currentMonthStr]);

  const currentMonthName = useMemo(() => {
    const monthObj = MONTHS.find(m => m.value === currentMonthStr.split('-')[1]);
    return monthObj ? monthObj.label : 'este mês';
  }, [currentMonthStr]);

  // Upcoming: only PENDING commitments, ordered nearest to farthest
  const upcomingCommitments = useMemo(() => {
    return commitments
      .filter(c => c.status === 'pending')
      .sort((a, b) => {
        const dateTimeA = `${a.date}T${a.time}`;
        const dateTimeB = `${b.date}T${b.time}`;
        return dateTimeA.localeCompare(dateTimeB);
      });
  }, [commitments]);

  // History: only COMPLETED commitments, filtered by type, month and year
  const historyCommitments = useMemo(() => {
    return commitments
      .filter(c => {
        if (c.status !== 'completed') return false; // Somente concluídos no histórico
        const matchesType = filterType === 'all' || c.type.toLowerCase() === filterType.toLowerCase();
        const matchesMonth = filterMonth === 'all' || c.date.split('-')[1] === filterMonth;
        const matchesYear = filterYear === 'all' || c.date.split('-')[0] === filterYear;
        return matchesType && matchesMonth && matchesYear;
      })
      .sort((a, b) => {
        const dateTimeA = `${a.date}T${a.time}`;
        const dateTimeB = `${b.date}T${b.time}`;
        return dateTimeB.localeCompare(dateTimeA);
      });
  }, [commitments, filterType, filterMonth, filterYear]);

  const openAddModal = () => {
    setEditTarget(null);
    setType('Médico');
    setCustomType('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('09:00');
    setLocation('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Commitment) => {
    setEditTarget(item);
    const known = APPOINTMENT_TYPES.some(t => t.value.toLowerCase() === item.type.toLowerCase() && t.value !== 'Outro');
    if (known) {
      setType(item.type);
      setCustomType('');
    } else {
      setType('Outro');
      setCustomType(item.type);
    }
    setDate(item.date);
    setTime(item.time);
    setLocation(item.location || '');
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const openViewModal = (item: Commitment) => {
    setViewTarget(item);
  };

  const openRescheduleModal = (item: Commitment) => {
    setRescheduleTarget(item);
    setRescheduleDate(item.date);
    setRescheduleTime(item.time);
    setRescheduleReason('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      showToast('Por favor, preencha data e hora.', 'warning');
      return;
    }

    const finalType = type === 'Outro' && customType.trim() ? customType.trim() : type;
    setSaving(true);

    const payload = {
      user_id: session?.user?.id || userId,
      type: finalType,
      date,
      time,
      location: location.trim() || null,
      notes: notes.trim() || null,
      status: editTarget ? editTarget.status : 'pending',
      original_date: editTarget ? (editTarget.original_date || editTarget.date) : date,
      original_time: editTarget ? (editTarget.original_time || editTarget.time) : time,
      reschedule_history: editTarget ? (editTarget.reschedule_history || []) : [],
    };

    try {
      if (session?.user?.id) {
        if (editTarget) {
          const { error } = await supabase
            .from('commitments')
            .update(payload)
            .eq('id', editTarget.id);
          if (error && error.code !== 'PGRST205') {
            // Se der erro de coluna não existente, tenta sem as colunas novas
            await supabase
              .from('commitments')
              .update({
                type: finalType,
                date,
                time,
                location: location.trim() || null,
                notes: notes.trim() || null,
              })
              .eq('id', editTarget.id);
          }
        } else {
          const { error } = await supabase
            .from('commitments')
            .insert([payload]);
          if (error && error.code !== 'PGRST205') {
            await supabase
              .from('commitments')
              .insert([{
                user_id: session.user.id,
                type: finalType,
                date,
                time,
                location: location.trim() || null,
                notes: notes.trim() || null,
                status: 'pending',
              }]);
          }
        }
      }

      // Update local state and storage
      if (editTarget) {
        const updated = commitments.map(c =>
          c.id === editTarget.id ? { ...c, ...payload, id: c.id, created_at: c.created_at } : c
        );
        setCommitments(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        showToast('Compromisso atualizado!', 'success');
      } else {
        const newCommitment: Commitment = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
          ...payload,
          created_at: new Date().toISOString(),
        };
        const updated = [newCommitment, ...commitments];
        setCommitments(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        showToast('Compromisso cadastrado!', 'success');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Erro ao salvar: ' + (err?.message || 'Tente novamente'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    if (!rescheduleDate || !rescheduleTime) {
      showToast('Por favor, informe a nova data e horário.', 'warning');
      return;
    }

    if (rescheduleDate === rescheduleTarget.date && rescheduleTime === rescheduleTarget.time) {
      showToast('A nova data/hora deve ser diferente da atual.', 'warning');
      return;
    }

    setRescheduling(true);

    const historyEntry: RescheduleHistoryItem = {
      previous_date: rescheduleTarget.date,
      previous_time: rescheduleTarget.time,
      new_date: rescheduleDate,
      new_time: rescheduleTime,
      reason: rescheduleReason.trim() || undefined,
      rescheduled_at: new Date().toISOString(),
    };

    const updatedHistory = [...(rescheduleTarget.reschedule_history || []), historyEntry];
    const originalDate = rescheduleTarget.original_date || rescheduleTarget.date;
    const originalTime = rescheduleTarget.original_time || rescheduleTarget.time;

    const updatedCommitment: Commitment = {
      ...rescheduleTarget,
      date: rescheduleDate,
      time: rescheduleTime,
      original_date: originalDate,
      original_time: originalTime,
      reschedule_history: updatedHistory,
    };

    try {
      if (session?.user?.id) {
        const { error } = await supabase
          .from('commitments')
          .update({
            date: rescheduleDate,
            time: rescheduleTime,
            original_date: originalDate,
            original_time: originalTime,
            reschedule_history: updatedHistory,
          })
          .eq('id', rescheduleTarget.id);

        if (error && error.code !== 'PGRST205') {
          // Fallback caso a coluna ainda não exista no Supabase
          await supabase
            .from('commitments')
            .update({
              date: rescheduleDate,
              time: rescheduleTime,
            })
            .eq('id', rescheduleTarget.id);
        }
      }

      const updatedList = commitments.map(c =>
        c.id === rescheduleTarget.id ? updatedCommitment : c
      );
      setCommitments(updatedList);
      localStorage.setItem(storageKey, JSON.stringify(updatedList));

      showToast('Compromisso reagendado com sucesso!', 'success');
      setRescheduleTarget(null);
    } catch {
      showToast('Erro ao reagendar compromisso.', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (session?.user?.id) {
        const { error } = await supabase
          .from('commitments')
          .delete()
          .eq('id', deleteTarget.id);
        if (error && error.code !== 'PGRST205') throw error;
      }

      const updated = commitments.filter(c => c.id !== deleteTarget.id);
      setCommitments(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      showToast('Compromisso excluído.', 'success');
      setDeleteTarget(null);
    } catch (err: any) {
      showToast('Erro ao excluir compromisso.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (item: Commitment) => {
    const nextStatus: 'pending' | 'completed' = item.status === 'completed' ? 'pending' : 'completed';
    try {
      if (session?.user?.id) {
        await supabase
          .from('commitments')
          .update({ status: nextStatus })
          .eq('id', item.id);
      }

      const updated = commitments.map(c =>
        c.id === item.id ? { ...c, status: nextStatus } : c
      );
      setCommitments(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      if (nextStatus === 'completed') {
        showToast('Compromisso concluído! Ele foi para o Histórico.', 'success');
      } else {
        showToast('Compromisso reaberto! Ele voltou para Próximos.', 'info');
      }
    } catch {
      showToast('Erro ao atualizar status.', 'error');
    }
  };

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const formatDateTimeDisplay = (isoStr?: string | null) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Skeleton screen idêntico ao do Dashboard ao acessar o aplicativo
  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark font-display pb-28 animate-pulse">
        {/* Header skeleton */}
        <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 flex items-center justify-between border-b border-gray-100/60 dark:border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-44 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        </header>

        <main className="flex flex-col gap-5 px-4 pt-4">
          {/* Main Card skeleton */}
          <div className="rounded-2xl bg-gradient-to-br from-[#102217] to-[#0e3b25] dark:from-[#1c3326] dark:to-[#102217] p-6 shadow-lg">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="size-4 rounded bg-white/20" />
                <div className="h-3.5 w-36 rounded-full bg-white/20" />
              </div>
              <div className="h-10 w-48 rounded-xl bg-white/20" />
              <div className="h-3 w-60 rounded-full bg-white/15" />
              <div className="h-11 w-full rounded-xl bg-white/10 mt-1" />
            </div>
          </div>

          {/* Navigation Tabs skeleton */}
          <div className="flex bg-surface-variant-light dark:bg-surface-dark p-1 rounded-xl gap-1">
            <div className="flex-1 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* List Section skeleton */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="h-4 w-40 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-2xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="h-3.5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="h-5 w-44 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="size-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="size-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark font-display pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-sm p-4 pb-2 flex items-center justify-between border-b border-gray-100/60 dark:border-gray-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer mr-1 p-2 -ml-2 rounded-full hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark text-[#111814] dark:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-[#111814] dark:text-white">
            Meus compromissos
          </h2>
        </div>

        <button
          onClick={openMenu}
          className="cursor-pointer flex items-center justify-center rounded-full size-10 hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark transition-colors relative"
          title="Abrir Menu"
        >
          <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">menu</span>
        </button>
      </header>

      <main className="flex flex-col gap-5 px-4 pt-4">
        {/* Main Card (Matching ViewIncome/ViewExpenses signature gradient) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102217] to-[#0e3b25] dark:from-[#1c3326] dark:to-[#102217] p-6 shadow-lg text-white">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 size-32 rounded-full bg-primary/5 blur-xl"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a8f0c8]">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <p className="text-xs font-semibold tracking-widest uppercase">
                    Resumo em {currentMonthName}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {currentMonthCount} {currentMonthCount === 1 ? 'compromisso' : 'compromissos'}
                </h1>
              </div>
              <p className="text-xs text-gray-300 dark:text-gray-300 mt-1">
                {currentMonthCount > 0
                  ? `Você tem ${currentMonthCount} compromisso(s) agendado(s) para este mês.`
                  : 'Nenhum compromisso agendado para este mês.'}
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-[#0a2018] font-bold py-2.5 px-4 rounded-xl transition-all text-sm shadow-md shadow-primary/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl icon-filled">add</span>
              <span>Novo Compromisso</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Próximos vs Histórico) */}
        <div className="flex bg-surface-variant-light dark:bg-surface-dark p-1 rounded-xl border border-gray-200/50 dark:border-white/5">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-surface-variant-dark text-[#111814] dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">schedule</span>
            <span>Próximos ({upcomingCommitments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-surface-variant-dark text-[#111814] dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span>Histórico ({commitments.filter(c => c.status === 'completed').length})</span>
          </button>
        </div>

        {/* TAB 1: PRÓXIMOS COMPROMISSOS (PENDENTES) */}
        {activeTab === 'upcoming' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-[#111814] dark:text-white">
                Próximos Compromissos
              </h3>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>Mais próximos</span>
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </div>
            </div>

            {upcomingCommitments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6">
                <div className="size-16 rounded-full bg-emerald-50 dark:bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-emerald-700 dark:text-primary">event_available</span>
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  Nenhum compromisso pendente
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                  Toque em "Novo Compromisso" para agendar suas consultas médicas, vistorias e compromissos.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingCommitments.map(item => {
                const rescheduleCount = item.reschedule_history ? item.reschedule_history.length : 0;

                return (
                  <div
                    key={item.id}
                    className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col gap-3 transition-all hover:border-emerald-500/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-primary/10 text-emerald-800 dark:text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl">{getTypeIcon(item.type)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="inline-block px-2.5 py-0.5 bg-emerald-50 dark:bg-primary/15 text-emerald-800 dark:text-primary text-[11px] font-bold rounded-md">
                              {item.type}
                            </span>
                            {rescheduleCount > 0 && (
                              <span
                                onClick={() => openViewModal(item)}
                                className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-md border border-blue-200 dark:border-blue-800/40 hover:underline"
                                title="Ver histórico de reagendamentos"
                              >
                                <span className="material-symbols-outlined text-[12px]">update</span>
                                <span>Reagendado {rescheduleCount}x</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">
                            {formatDateDisplay(item.date)} às {item.time}
                          </h4>
                          {item.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 truncate">
                              <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                              <span className="truncate">{item.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações superiores: Olhinho (Consultar) à esquerda do Lápis (Editar) e Lixeira */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openViewModal(item)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          title="Consultar compromisso"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="bg-surface-variant-light dark:bg-black/20 border border-border-light/50 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-200">
                          <span className="material-symbols-outlined text-sm text-emerald-700 dark:text-primary">description</span>
                          <span>Observações / Documentos:</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed font-medium">
                          {item.notes}
                        </p>
                      </div>
                    )}

                    {/* Rodapé: Tag Pendente em Amarelo + Opção Reagendar ao lado de Concluir */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      {/* Tag PENDENTE em AMARELO com contraste WCAG garantido */}
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/40 border border-amber-300/60 dark:border-amber-700/50 px-2.5 py-0.5 rounded-full">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pendente
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openRescheduleModal(item)}
                          className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-base">update</span>
                          <span>Reagendar</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(item)}
                          className="text-xs font-bold text-emerald-700 dark:text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          <span>Concluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HISTÓRICO DE COMPROMISSOS (SOMENTE CONCLUÍDOS) */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-3">
            {/* Filters (Tipo, Mês e Ano) */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-lg">filter_alt</span>
                <span className="text-xs font-bold text-[#111814] dark:text-white uppercase tracking-wider">
                  Filtros do Histórico
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    Tipo
                  </label>
                  <CustomSelect
                    value={filterType}
                    onChange={setFilterType}
                    options={[
                      { value: 'all', label: 'Todos os tipos' },
                      ...APPOINTMENT_TYPES.map(t => ({ value: t.value, label: t.label }))
                    ]}
                    minWidth="w-full"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    Mês
                  </label>
                  <CustomSelect
                    value={filterMonth}
                    onChange={setFilterMonth}
                    options={MONTHS}
                    minWidth="w-full"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">
                    Ano
                  </label>
                  <CustomSelect
                    value={filterYear}
                    onChange={setFilterYear}
                    options={YEAR_OPTIONS}
                    minWidth="w-full"
                  />
                </div>
              </div>
            </div>

            {/* History List */}
            {historyCommitments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6">
                <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-600">history_toggle_off</span>
                <p className="text-base font-bold text-gray-800 dark:text-white">
                  Nenhum compromisso concluído
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                  Os compromissos aparecem no histórico assim que você marcá-los como concluídos na aba "Próximos".
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {historyCommitments.map(item => {
                const rescheduleCount = item.reschedule_history ? item.reschedule_history.length : 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl p-4 border border-gray-100 dark:border-gray-800/80 bg-surface-variant-light/40 dark:bg-surface-dark/60 flex flex-col gap-3 shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-11 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-primary">
                          <span className="material-symbols-outlined text-2xl">{getTypeIcon(item.type)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              {item.type}
                            </span>
                            {/* Tag CONCLUÍDO em VERDE */}
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50 rounded-md">
                              <span className="size-1.5 rounded-full bg-emerald-500"></span>
                              Concluído
                            </span>
                            {rescheduleCount > 0 && (
                              <span
                                onClick={() => openViewModal(item)}
                                className="cursor-pointer text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-1.5 py-0.5 rounded-md hover:underline"
                              >
                                Reagendado {rescheduleCount}x
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight mt-0.5">
                            {formatDateDisplay(item.date)} às {item.time}
                          </h4>
                          {item.location && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                              <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                              <span className="truncate">{item.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações superiores */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openViewModal(item)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          title="Consultar compromisso"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 bg-surface-variant-light dark:bg-black/20 p-2.5 rounded-xl whitespace-pre-line font-medium border border-border-light/40 dark:border-white/5">
                        <span className="font-bold text-gray-700 dark:text-gray-200 block mb-0.5">Observações:</span>
                        {item.notes}
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="text-xs font-bold text-emerald-700 dark:text-primary hover:underline transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">replay</span>
                        <span>Reabrir compromisso</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: CONSULTAR COMPROMISSO (Olhinho - Somente Leitura) */}
      {viewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-2xl">visibility</span>
                <h3 className="text-lg font-bold text-[#111814] dark:text-white">
                  Detalhes do Compromisso
                </h3>
              </div>
              <button
                onClick={() => setViewTarget(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Card Resumo do Compromisso */}
              <div className="bg-surface-variant-light/70 dark:bg-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-emerald-50 dark:bg-primary/10 text-emerald-800 dark:text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">{getTypeIcon(viewTarget.type)}</span>
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-50 dark:bg-primary/15 text-emerald-800 dark:text-primary text-[11px] font-bold rounded-md mb-1">
                      {viewTarget.type}
                    </span>
                    <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight">
                      {formatDateDisplay(viewTarget.date)} às {viewTarget.time}
                    </h4>
                  </div>
                </div>

                {viewTarget.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 rounded-lg">
                    Concluído
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 rounded-lg">
                    Pendente
                  </span>
                )}
              </div>

              {/* Local */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Local
                </span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 pl-5">
                  {viewTarget.location || 'Nenhum local informado.'}
                </p>
              </div>

              {/* Observações */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">description</span>
                  Observações / Documentos a levar
                </span>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 pl-5 whitespace-pre-line leading-relaxed">
                  {viewTarget.notes || 'Nenhuma observação informada.'}
                </div>
              </div>

              {/* SEÇÃO REAGENDAMENTOS (MAPEAMENTO) */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-col gap-2.5">
                {/* Cabeçalho da Seção de Reagendamentos */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[#111814] dark:text-white">
                    <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-base">history</span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Histórico de Reagendamentos
                    </span>
                  </div>

                  {viewTarget.reschedule_history && viewTarget.reschedule_history.length > 0 ? (
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">
                        <span className="size-1.5 rounded-full bg-blue-500"></span>
                        {viewTarget.reschedule_history.length} {viewTarget.reschedule_history.length === 1 ? 'reagendamento realizado' : 'reagendamentos realizados'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Nenhum reagendamento realizado.
                    </p>
                  )}
                </div>

                {/* Data Original */}
                <div className="bg-gray-50 dark:bg-surface-variant-dark/40 rounded-xl p-3 flex items-center justify-between text-xs border border-gray-100 dark:border-white/5">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">Data Original de Criação:</span>
                  <span className="font-bold text-[#111814] dark:text-white">
                    {formatDateDisplay(viewTarget.original_date || viewTarget.date)} às {viewTarget.original_time || viewTarget.time}
                  </span>
                </div>

                {/* Lista de Reagendamentos */}
                {viewTarget.reschedule_history && viewTarget.reschedule_history.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {viewTarget.reschedule_history.map((hist, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-200">
                          <span>Reagendamento #{idx + 1}</span>
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            {formatDateTimeDisplay(hist.rescheduled_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <span className="line-through text-gray-400">
                            {formatDateDisplay(hist.previous_date)} às {hist.previous_time}
                          </span>
                          <span className="material-symbols-outlined text-xs text-blue-600">arrow_forward</span>
                          <span className="font-bold text-emerald-800 dark:text-primary">
                            {formatDateDisplay(hist.new_date)} às {hist.new_time}
                          </span>
                        </div>
                        {hist.reason && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 italic mt-0.5">
                            Motivo: "{hist.reason}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Este compromisso permanece na data original e nunca precisou ser reagendado.
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setViewTarget(null)}
                  className="w-full h-11 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold text-sm rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REAGENDAR COMPROMISSO */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-2xl">update</span>
                <h3 className="text-lg font-bold text-[#111814] dark:text-white">
                  Reagendar Compromisso
                </h3>
              </div>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Alerta com data atual */}
            <div className="bg-surface-variant-light dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Agendamento atual:</span>
              <span className="font-bold text-[#111814] dark:text-white">
                {formatDateDisplay(rescheduleTarget.date)} às {rescheduleTarget.time}
              </span>
            </div>

            <form onSubmit={handleConfirmReschedule} className="flex flex-col gap-4">
              {/* Nova Data e Nova Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    Nova Data *
                  </label>
                  <CustomDatePicker
                    value={rescheduleDate}
                    onChange={setRescheduleDate}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    Nova Hora *
                  </label>
                  <CustomTimePicker
                    value={rescheduleTime}
                    onChange={setRescheduleTime}
                  />
                </div>
              </div>

              {/* Motivo do Reagendamento (Opcional) */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Motivo do reagendamento</span>
                  <span className="text-[10px] font-normal text-gray-400">Opcional</span>
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  rows={2}
                  placeholder="Ex: Imprevisto no trabalho, médico desmarcou a consulta, etc."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="flex-1 h-11 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="flex-1 h-11 bg-primary hover:bg-primary-dark text-[#0a2018] font-bold text-sm rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{rescheduling ? 'Reagendando...' : 'Confirmar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CADASTRAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-2xl">event</span>
                <h3 className="text-lg font-bold text-[#111814] dark:text-white">
                  {editTarget ? 'Editar Compromisso' : 'Novo Compromisso'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Tipo */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Tipo de Compromisso *
                </label>
                <CustomSelect
                  value={type}
                  onChange={setType}
                  options={APPOINTMENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                  minWidth="w-full"
                />
              </div>

              {type === 'Outro' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    Especifique o Tipo *
                  </label>
                  <input
                    type="text"
                    value={customType}
                    onChange={e => setCustomType(e.target.value)}
                    placeholder="Ex: Consulta Veterinária, Detran Vistoria..."
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    required
                  />
                </div>
              )}

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    Data *
                  </label>
                  <CustomDatePicker
                    value={date}
                    onChange={setDate}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    Hora *
                  </label>
                  <CustomTimePicker
                    value={time}
                    onChange={setTime}
                  />
                </div>
              </div>

              {/* Local */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Local
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ex: Hospital Central, Posto Detran Centro..."
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Observações / Documentos necessários
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: Levar RG, CPF, exames de sangue recentes, comprovante..."
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 bg-primary hover:bg-primary-dark text-[#0a2018] font-bold text-sm rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir compromisso"
        message={`Deseja realmente excluir o compromisso "${deleteTarget?.type}" do dia ${deleteTarget ? formatDateDisplay(deleteTarget.date) : ''}?`}
        confirmText={deleting ? 'Excluindo...' : 'Excluir'}
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Commitments;
