import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';

interface Property {
  id: string;
  name: string;
  address: string | null;
  contract_value: number | null;
  created_at: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const Imoveis: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProperties(); }, [session]);

  const fetchProperties = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProperties(data || []);
    } catch {
      showToast('Erro ao carregar imóveis.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setName('');
    setAddress('');
    setContractValue('');
    setIsModalOpen(true);
  };

  const openEdit = (p: Property) => {
    setEditTarget(p);
    setName(p.name);
    setAddress(p.address || '');
    setContractValue(p.contract_value != null
      ? p.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('Informe o nome do imóvel.', 'warning'); return; }
    const numericCV = contractValue
      ? parseFloat(contractValue.replace(/\./g, '').replace(',', '.'))
      : null;
    setSaving(true);
    try {
      const payload = {
        user_id: session!.user.id,
        name: name.trim(),
        address: address.trim() || null,
        contract_value: numericCV,
      };
      if (editTarget) {
        const { error } = await supabase.from('properties').update(payload).eq('id', editTarget.id);
        if (error) throw error;
        showToast('Imóvel atualizado!', 'success');
      } else {
        const { error } = await supabase.from('properties').insert(payload);
        if (error) throw error;
        showToast('Imóvel cadastrado!', 'success');
      }
      setIsModalOpen(false);
      fetchProperties();
    } catch (e: any) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('properties').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      showToast('Imóvel excluído.', 'success');
      setDeleteTarget(null);
      fetchProperties();
    } catch (e: any) {
      showToast('Erro ao excluir.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[#111814] dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[#111814] dark:text-white">Imóveis</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-[#111814] shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined font-bold">add</span>
        </button>
      </header>

      <main className="px-6 pt-4 flex flex-col gap-4">
        {loading ? (
          <p className="text-center text-gray-400 py-12">Carregando...</p>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="size-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-blue-500">apartment</span>
            </div>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200">Nenhum imóvel cadastrado</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toque no botão + para adicionar seu primeiro imóvel.</p>
          </div>
        ) : (
          properties.map(p => (
            <div
              key={p.id}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-white/5"
            >
              {/* Clickable area */}
              <button
                onClick={() => navigate(`/imoveis/${p.id}`, { state: { property: p } })}
                className="flex items-center gap-4 flex-1 min-w-0 text-left"
              >
                <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-blue-500 dark:text-blue-400">apartment</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#111814] dark:text-white truncate">{p.name}</p>
                  {p.address && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{p.address}</p>}
                  {p.contract_value != null && (
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      Contrato: {formatCurrency(p.contract_value)}
                    </p>
                  )}
                </div>
              </button>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => openEdit(p)}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setIsModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#1c2e24] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editTarget ? 'Editar Imóvel' : 'Novo Imóvel'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Nome do imóvel *</span>
                <input
                  className="w-full h-12 bg-gray-50 dark:bg-surface-dark text-[#111814] dark:text-white placeholder:text-gray-400 border-none rounded-xl px-4 font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Ex: Quinta dos Camarás"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Endereço</span>
                <input
                  className="w-full h-12 bg-gray-50 dark:bg-surface-dark text-[#111814] dark:text-white placeholder:text-gray-400 border-none rounded-xl px-4 font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Ex: Rua das Flores, 123"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Valor do contrato</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-gray-400">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={contractValue}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setContractValue(v ? (Number(v) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
                    }}
                    placeholder="0,00"
                    className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-surface-dark text-[#111814] dark:text-white placeholder:text-gray-400 border-none rounded-xl font-bold focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                </div>
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 mt-2 bg-primary hover:bg-primary-dark active:scale-[0.98] text-[#111814] font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span className="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? 'Salvando...' : (editTarget ? 'Salvar Alterações' : 'Cadastrar Imóvel')}
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
        title="Excluir Imóvel"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todos os pagamentos vinculados serão removidos. Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Imoveis;
