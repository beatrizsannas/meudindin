import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';

import { useQueryClient } from '@tanstack/react-query';

const EditProfile: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dob: "",
        avatar_url: null as string | null
    });
    const [loading, setLoading] = useState(true);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    useEffect(() => {
        if (session?.user) {
            if (session.user.email) {
                setFormData(prev => ({ ...prev, email: session.user.email! }));
            }
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session?.user.id)
                .single();

            if (data) {
                setFormData(prev => ({
                    ...prev,
                    name: data.full_name || "",
                    avatar_url: data.avatar_url,
                    phone: data.phone || "",
                    // Fix: Ensure date is strictly YYYY-MM-DD for the input type="date"
                    dob: data.dob ? data.dob.split('T')[0] : ""
                }));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemovePhoto = async () => {
        if (!window.confirm("Deseja remover sua foto de perfil?")) return;
        setFormData(prev => ({ ...prev, avatar_url: null }));
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!session?.user) return;

        try {
            setLoading(true);
            // data to upsert
            const updates = {
                id: session.user.id,
                full_name: formData.name,
                avatar_url: formData.avatar_url, // Saves null if removed
                phone: formData.phone,
                dob: formData.dob || null, // Handle empty string for date
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            // Invalidate profile query to update other components immediately
            await queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });

            showToast("Perfil atualizado com sucesso!", "success");
            navigate(-1);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            showToast('Erro ao atualizar perfil: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarSelect = (url: string) => {
        setFormData(prev => ({ ...prev, avatar_url: url }));
        setIsAvatarModalOpen(false);
    };

    // Predefined Avatars (DiceBear) - Happy & Curly/Wavy Hair Focus
    const avatars = [
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka&mouth=smile&eyes=happy&top=curvy&hairColor=2c1b18",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&mouth=smile&eyes=happy&top=shortCurly&hairColor=2c1b18",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Bella&mouth=smile&eyes=happy&top=curly&hairColor=4a312c",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Leo&mouth=smile&eyes=happy&top=fro&hairColor=000000",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe&mouth=smile&eyes=happy&top=bigHair&hairColor=724133",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Jack&mouth=smile&eyes=happy&top=shortWaved&hairColor=2c1b18",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Callie&mouth=smile&eyes=happy&top=longButNotTooLong&hairColor=2c1b18",
        "https://api.dicebear.com/9.x/avataaars/svg?seed=Sam&mouth=smile&eyes=happy&top=dreads&hairColor=000000"
    ];

    return (
        <div className="flex flex-col h-full min-h-screen bg-background-light dark:bg-background-dark">
            <header className="flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 transition-colors">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-900 dark:text-gray-100 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    Editar Perfil
                </h2>
                <div className="size-12 shrink-0"></div>
            </header>

            <main className="flex-1 px-4 py-6">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                        {formData.avatar_url ? (
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 border-4 border-surface-light dark:border-surface-dark shadow-md"
                                style={{ backgroundImage: `url("${formData.avatar_url}")` }}
                            ></div>
                        ) : (
                            <div className="flex items-center justify-center h-28 w-28 rounded-full bg-emerald-100 dark:bg-primary/20 border-4 border-surface-light dark:border-surface-dark shadow-md">
                                <span className="text-emerald-700 dark:text-primary font-bold text-4xl">
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                        )}

                        <div className="absolute bottom-0 right-0 bg-primary hover:bg-green-400 transition-colors rounded-full p-2 border-4 border-background-light dark:border-background-dark flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[20px] text-surface-dark font-bold">photo_camera</span>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-3">
                        <button
                            type="button"
                            onClick={() => setIsAvatarModalOpen(true)}
                            className="text-emerald-700 dark:text-primary font-bold text-sm hover:underline"
                        >
                            Alterar foto
                        </button>
                        {formData.avatar_url && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="text-red-500 font-bold text-sm hover:underline"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                </div>

                <form className="space-y-5" onSubmit={handleSave}>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="name">
                            Nome Completo
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <input
                                className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium"
                                id="name"
                                name="name"
                                placeholder="Seu nome completo"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="email">
                            E-mail
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">mail</span>
                            </div>
                            <input
                                className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium opacity-70"
                                id="email"
                                name="email"
                                placeholder="seu@email.com"
                                type="email"
                                value={formData.email}
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="phone">
                            Telefone
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">smartphone</span>
                            </div>
                            <input
                                className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium"
                                id="phone"
                                name="phone"
                                placeholder="(00) 00000-0000"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="dob">
                            Data de Nascimento
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                            </div>
                            <input
                                className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium [color-scheme:light] dark:[color-scheme:dark]"
                                id="dob"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </form>
            </main>
            <div className="p-4 bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 sticky bottom-0 z-20">
                <button
                    onClick={() => handleSave()}
                    className="w-full bg-primary text-surface-dark font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-green-400 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">save</span>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Avatar Selection Modal */}
            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Escolha um Avatar</h3>
                            <button
                                onClick={() => setIsAvatarModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-gray-500">close</span>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-4 gap-4">
                            {avatars.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAvatarSelect(url)}
                                    className="relative aspect-square rounded-full border-2 border-transparent hover:border-primary hover:scale-110 focus:border-primary focus:scale-110 transition-all outline-none group"
                                >
                                    <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full rounded-full bg-gray-100 dark:bg-white/5" />
                                    {formData.avatar_url === url && (
                                        <div className="absolute inset-0 bg-emerald-100 dark:bg-primary/20 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-emerald-700 dark:text-primary font-bold shadow-lg">check</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5 text-center text-xs text-gray-400">
                            Selecione um dos avatares para o seu perfil
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProfile;