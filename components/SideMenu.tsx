import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null, avatar_url: string | null }>({ full_name: '', avatar_url: null });

  useEffect(() => {
    if (session?.user && isOpen) {
      fetchProfile();
    }
  }, [session, isOpen]);

  const fetchProfile = async () => {
    try {
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
    }
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair da sua conta?")) {
      localStorage.removeItem('isAuthenticated');
      onClose();
      supabase.auth.signOut();
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/expenses', icon: 'trending_down', label: 'Ver Despesas', color: 'text-red-500' },
    { path: '/income', icon: 'trending_up', label: 'Ver Receitas', color: 'text-green-500' },
    { divider: true },
    { path: '/', icon: 'home', label: 'Início' },
    { path: '/third-party', icon: 'directions_car', label: 'Veículo' },
    { path: '/wallet', icon: 'account_balance_wallet', label: 'Terceiros' },
    { path: '/settings', icon: 'settings', label: 'Ajustes' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`absolute inset-0 z-[60] h-full w-full pointer-events-none overflow-hidden`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`absolute top-0 left-0 h-full w-72 bg-surface-light dark:bg-surface-dark transform transition-transform duration-300 ease-in-out pointer-events-auto ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}`}
      >
        <div className="p-6 flex flex-col h-full overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                {profile.avatar_url ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20"
                    style={{ backgroundImage: `url("${profile.avatar_url}")` }}
                  ></div>
                ) : (
                  <div className="flex items-center justify-center size-10 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark shadow-sm">
                    <span className="text-white dark:text-[#102217] font-bold text-sm">
                      {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Meu Dindin</p>
                <h2 className="text-lg font-bold text-[#111814] dark:text-white">Menu</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer flex items-center justify-center size-10 rounded-full hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark transition-colors"
            >
              <span className="material-symbols-outlined text-[#111814] dark:text-white">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 flex-1">
            {menuItems.map((item, index) => (
              item.divider ? (
                <div key={`divider-${index}`} className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive(item.path!)
                    ? 'bg-surface-variant-light dark:bg-surface-variant-dark text-gray-900 dark:text-white'
                    : 'hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark text-gray-700 dark:text-gray-200'
                    }`}
                  onClick={onClose}
                >
                  <span className={`material-symbols-outlined ${item.color || ''} ${isActive(item.path!) ? 'icon-filled' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            ))}

            <button
              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark text-gray-700 dark:text-gray-200 transition-colors w-full text-left"
              onClick={() => alert('QR Code')}
            >
              <span className="material-symbols-outlined">qr_code_scanner</span>
              <span className="font-medium">QR Code</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
            <Button
              variant="ghost"
              fullWidth
              onClick={handleLogout}
              className="!justify-start !px-4 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              startIcon="logout"
            >
              Sair da conta
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SideMenu;