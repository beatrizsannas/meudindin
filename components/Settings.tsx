import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<{ full_name: string | null, avatar_url: string | null }>({ full_name: '', avatar_url: null });
  const [loading, setLoading] = useState(true);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session?.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const verifyAndDelete = async () => {
    if (!deletePassword) {
      setDeleteError('Por favor, digite sua senha.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      // 1. Verify Password by attempting a sign in (re-auth)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session?.user.email || '',
        password: deletePassword,
      });

      if (authError) {
        throw new Error('Senha incorreta.');
      }

      // 2. If Auth successful, proceed to delete data

      // Delete all transactions for the user
      const { error: tError } = await supabase.from('transactions').delete().eq('user_id', session?.user.id);
      // Delete all purchases for the user
      const { error: pError } = await supabase.from('third_party_purchases').delete().eq('user_id', session?.user.id);

      if (tError) throw tError;
      if (pError) throw pError;

      if (pError) throw pError;

      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['third-party-purchases'] });
      await queryClient.invalidateQueries({ queryKey: ['transaction-totals'] });

      showToast("Todos os dados foram apagados com sucesso!", "success");
      setIsDeleteModalOpen(false);

    } catch (e: any) {
      console.error(e);
      setDeleteError(e.message || "Erro ao apagar dados.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair da sua conta?")) {
      localStorage.removeItem('isAuthenticated');
      supabase.auth.signOut();
      navigate('/login', { replace: true });
    }
  };

  const handleAction = (message: string) => {
    showToast(message, "info");
  };

  return (
    <div className="flex flex-col bg-background-light dark:bg-background-dark min-h-full">
      {/* Top App Bar */}
      <header className="flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between sticky top-0 z-10 shadow-sm transition-colors">
        <Link to="/" className="text-gray-900 dark:text-gray-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
        </Link>
        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          Configurações
        </h2>
      </header>

      <div className="pb-24">
        {/* Profile Header */}
        <section className="mt-6 px-6">
          <Link to="/settings/profile" className="flex items-center gap-4 bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-card transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5">
            <div className="relative">
              {profile.avatar_url ? (
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14 border-2 border-primary shadow-sm"
                  style={{ backgroundImage: `url("${profile.avatar_url}")` }}
                ></div>
              ) : (
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/20 border-2 border-primary shadow-sm">
                  <span className="text-primary font-bold text-xl">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-[3px] border-white dark:border-surface-dark flex items-center justify-center h-7 w-7 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[14px] text-[#052e16] font-bold">edit</span>
              </div>
            </div>
            <div className="flex flex-col justify-center flex-1">
              <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight">
                {profile.full_name || 'Usuário'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">
                {session?.user.email || 'email@exemplo.com'}
              </p>
            </div>
            <div className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </Link>
        </section>

        {/* Section: Gerenciamento */}
        <div className="px-6 pb-2 pt-8">
          <h3 className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-2">Gerenciamento</h3>
        </div>
        <div className="mx-6 flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-card">
          {/* Item 1 */}
          <button
            onClick={() => handleAction("Gerenciar categorias")}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group"
          >
            <div className="flex items-center justify-center rounded-xl bg-green-50 dark:bg-primary/10 shrink-0 size-10 text-green-600 dark:text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">category</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1 text-left">Categorias de Gastos</p>
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-xl">chevron_right</span>
          </button>
          {/* Item 2 */}
          <button
            onClick={() => handleAction("Gerenciar veículos")}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group"
          >
            <div className="flex items-center justify-center rounded-xl bg-green-50 dark:bg-primary/10 shrink-0 size-10 text-green-600 dark:text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">directions_car</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1 text-left">Veículos</p>
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-xl">chevron_right</span>
          </button>
          {/* Item 3 */}
          <Link to="/third-party" className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
            <div className="flex items-center justify-center rounded-xl bg-green-50 dark:bg-primary/10 shrink-0 size-10 text-green-600 dark:text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">credit_card</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1 text-left">Cartões de Terceiros</p>
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-xl">chevron_right</span>
          </Link>
        </div>

        {/* Section: Preferências */}
        <div className="px-6 pb-2 pt-8">
          <h3 className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-2">Preferências</h3>
        </div>
        <div className="mx-6 flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-card">
          {/* Toggle Item 1 */}
          <div className="flex items-center gap-4 px-5 py-4 w-full border-b border-gray-50 dark:border-gray-800 last:border-0 group">
            <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 shrink-0 size-10 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">notifications</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1">Notificações</p>
            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer toggle-checkbox" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 toggle-label transition-colors"></div>
            </label>
          </div>
          {/* Toggle Item 2 */}
          <div className="flex items-center gap-4 px-5 py-4 w-full border-b border-gray-50 dark:border-gray-800 last:border-0 group">
            <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 shrink-0 size-10 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">dark_mode</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1">Modo Escuro</p>
            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer toggle-checkbox" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 toggle-label transition-colors"></div>
            </label>
          </div>
          {/* Item 3 */}
          <button
            onClick={() => handleAction("Configurar FaceID")}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 shrink-0 size-10 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">lock</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1 text-left">Segurança (FaceID)</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ativado</span>
              <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-xl">chevron_right</span>
            </div>
          </button>
        </div>

        {/* Section: Sobre */}
        <div className="px-6 pb-2 pt-8">
          <h3 className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest pl-2">Sobre</h3>
        </div>
        <div className="mx-6 flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-surface-dark shadow-card mb-8">
          <button
            onClick={() => handleAction("Abrir Central de Ajuda")}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group"
          >
            <div className="flex items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 shrink-0 size-10 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">help</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1 text-left">Ajuda e Suporte</p>
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-xl">chevron_right</span>
          </button>
          <button
            onClick={() => handleAction("Avaliar na loja")}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group"
          >
            <div className="flex items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-900/20 shrink-0 size-10 text-yellow-500 dark:text-yellow-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">star</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1 text-left">Avaliar o App</p>
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-xl">chevron_right</span>
          </button>
          <button
            onClick={() => handleAction("Ver Termos de Uso")}
            className="flex items-center gap-4 px-5 py-4 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 shrink-0 size-10 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined icon-filled text-[20px]">description</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm font-bold flex-1 text-left">Termos de Uso</p>
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-xl">chevron_right</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="mx-6 mb-8 flex flex-col gap-4 relative z-20">
          <Button
            type="button"
            onClick={handleOpenDeleteModal}
            fullWidth
            variant="secondary"
            className="bg-white dark:bg-surface-dark text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 shadow-card border border-transparent hover:border-red-100 h-14 rounded-2xl flex items-center justify-center gap-3"
            startIcon="delete_forever"
          >
            Apagar todos os dados
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            fullWidth
            variant="secondary"
            className="bg-white dark:bg-surface-dark text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 shadow-card border border-transparent hover:border-red-100 h-14 rounded-2xl"
            startIcon="logout"
          >
            Sair da Conta
          </Button>
          <div className="text-center pb-4 pt-2">
            <p className="text-xs text-gray-400 font-medium">Meu Dindin v1.0.0</p>
            <p className="text-[10px] text-gray-300 mt-1">© 2023 Financeira App Ltda.</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-red-600 dark:text-red-500 text-3xl">warning</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                Apagar todos os dados?
              </h3>

              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Essa ação <strong>não pode ser desfeita</strong>. Todas as suas transações e registros serão excluídos permanentemente.
              </p>

              <div className="w-full flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 text-left ml-1">
                  Digite sua senha para confirmar
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full h-12 rounded-xl bg-gray-50 dark:bg-background-dark border-transparent focus:border-red-500 focus:ring-red-500/20 text-gray-900 dark:text-white"
                  autoFocus
                />
                {deleteError && (
                  <p className="text-red-500 text-xs font-bold text-left ml-1 animate-in slide-in-from-left-2">
                    {deleteError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={verifyAndDelete}
                  disabled={isDeleting}
                  className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "Apagar Tudo"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;