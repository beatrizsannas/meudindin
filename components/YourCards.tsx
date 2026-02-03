
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCreditCards, CreditCard } from '../hooks/useCreditCards';
import Button from './Button';

const YourCards: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const { showToast } = useToast();
    const { cards, isLoading, addCard, updateCard, deleteCard } = useCreditCards(session?.user?.id);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [limit, setLimit] = useState('');
    const [dueDay, setDueDay] = useState('');
    const [usageRating, setUsageRating] = useState(50);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const openModal = (card?: CreditCard) => {
        if (card) {
            setEditingCard(card);
            setName(card.name);
            setLimit((card.limit * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
            setDueDay(card.due_day.toString());
            setUsageRating(card.usage_rating);
        } else {
            setEditingCard(null);
            setName('');
            setLimit('');
            setDueDay('');
            setUsageRating(50);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCard(null);
    };

    const handleSave = async () => {
        if (!name || !limit || !dueDay) {
            showToast("Por favor, preencha todos os campos.", "warning");
            return;
        }

        const limitValue = parseFloat(limit.replace(/\./g, '').replace(',', '.'));
        const dueDayValue = parseInt(dueDay, 10);

        if (isNaN(limitValue) || isNaN(dueDayValue) || dueDayValue < 1 || dueDayValue > 31) {
            showToast("Dados inválidos. Verifique o limite e o dia de vencimento.", "warning");
            return;
        }

        setSaving(true);
        try {
            if (editingCard) {
                await updateCard.mutateAsync({
                    id: editingCard.id,
                    name,
                    limit: limitValue,
                    due_day: dueDayValue,
                    usage_rating: usageRating
                });
                showToast("Cartão atualizado com sucesso!", "success");
            } else {
                await addCard.mutateAsync({
                    name,
                    limit: limitValue,
                    due_day: dueDayValue,
                    usage_rating: usageRating
                });
                showToast("Cartão adicionado com sucesso!", "success");
            }
            closeModal();
        } catch (error: any) {
            console.error("Error saving card:", error);
            showToast("Erro ao salvar cartão: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCard.mutateAsync(id);
            showToast("Cartão removido com sucesso!", "success");
            setShowDeleteConfirm(null);
        } catch (error: any) {
            console.error("Error deleting card:", error);
            showToast("Erro ao remover cartão: " + error.message, "error");
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 pb-24">
            <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-[#111814] dark:text-white">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-[#111814] dark:text-white">Seus Cartões</h1>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-[#111814] shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined font-bold">add</span>
                </button>
            </header>

            <main className="flex flex-col px-6 gap-6 pt-2">
                {isLoading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : cards?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center opacity-60">
                        <span className="material-symbols-outlined text-6xl mb-4 text-gray-400">credit_card</span>
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Nenhum cartão cadastrado.</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Toque no + para adicionar seu primeiro cartão.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {cards?.map((card) => (
                            <div
                                key={card.id}
                                className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-2xl p-6 shadow-xl text-white group"
                            >
                                {/* Background Decoration */}
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

                                <div className="relative z-10 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400 font-medium tracking-wider uppercase">Nome do Cartão</p>
                                            <h3 className="text-xl font-bold tracking-wide">{card.name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(card)}
                                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(card.id)}
                                                className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Limite</p>
                                            <p className="text-2xl font-bold text-primary">{formatCurrency(card.limit)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 mb-1">Dia do Vencimento</p>
                                            <p className="text-lg font-bold">{card.due_day}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Uso Frequente</span>
                                            <span>{card.usage_rating}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${card.usage_rating > 70 ? 'bg-red-500' : card.usage_rating > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: `${card.usage_rating}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}></div>
                    <div className="relative z-10 bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Excluir Cartão?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-3">
                            <Button variant="ghost" fullWidth onClick={() => setShowDeleteConfirm(null)}>Cancelar</Button>
                            <Button variant="primary" fullWidth className="!bg-red-500 text-white" onClick={() => handleDelete(showDeleteConfirm)}>Excluir</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-background-dark rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</h2>
                            <button
                                onClick={closeModal}
                                className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-gray-500">close</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            {/* Name Input */}
                            <label className="flex flex-col gap-2">
                                <span className="text-text-main dark:text-white text-sm font-bold ml-1">Nome do Cartão</span>
                                <input
                                    className="w-full h-14 bg-gray-50 dark:bg-surface-dark text-text-main dark:text-white placeholder:text-text-secondary/50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 px-4 font-medium"
                                    placeholder="Ex: NuBank, Inter..."
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </label>

                            {/* Limit Input */}
                            <div className="flex flex-col gap-2">
                                <label className="text-text-main dark:text-white text-sm font-bold ml-1">Limite do Cartão</label>
                                <div className="relative">
                                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-2xl transition-colors ${limit ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}>R$</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={limit}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            const formatted = (Number(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                                            setLimit(formatted);
                                        }}
                                        placeholder="0,00"
                                        className={`w-full h-14 pl-14 pr-4 bg-gray-50 dark:bg-surface-dark text-xl font-bold border-none rounded-xl focus:ring-0 outline-none transition-colors ${limit ? 'text-[#111814] dark:text-white placeholder:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}
                                    />
                                </div>
                            </div>

                            {/* Due Day Input */}
                            <label className="flex flex-col gap-2">
                                <span className="text-text-main dark:text-white text-sm font-bold ml-1">Dia do Vencimento</span>
                                <input
                                    className="w-full h-14 bg-gray-50 dark:bg-surface-dark text-text-main dark:text-white placeholder:text-text-secondary/50 border-none rounded-xl focus:ring-2 focus:ring-primary/50 px-4 font-medium"
                                    placeholder="Ex: 10"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={dueDay}
                                    onChange={(e) => setDueDay(e.target.value)}
                                />
                            </label>

                            {/* Usage Rating Slider */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center ml-1">
                                    <span className="text-text-main dark:text-white text-sm font-bold">Frequência de Uso</span>
                                    <span className={`text-sm font-bold ${usageRating > 70 ? 'text-red-500' : usageRating > 30 ? 'text-yellow-500' : 'text-green-500'}`}>
                                        {usageRating > 70 ? 'Muito Usado' : usageRating > 30 ? 'Moderado' : 'Pouco Usado'} ({usageRating}%)
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={usageRating}
                                    onChange={(e) => setUsageRating(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Pouco</span>
                                    <span>Muito</span>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-14 mt-4 bg-primary hover:bg-primary-dark active:scale-[0.98] text-text-main font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
                                {saving ? 'Salvando...' : 'Salvar Cartão'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YourCards;
