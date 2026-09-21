import React, { useState, useEffect, createContext } from 'react';
import { HashRouter, Routes, Route, useLocation, Link, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ThirdPartyCards from './components/ThirdPartyCards';
import RegisterCost from './components/RegisterCost';
import Wallet from './components/Wallet';
import RegisterPurchase from './components/RegisterPurchase';
import Settings from './components/Settings';
import ViewExpenses from './components/ViewExpenses';
import ViewIncome from './components/ViewIncome';
import SideMenu from './components/SideMenu';
import ScanReceipt from './components/ScanReceipt';
import ReceivablesDetails from './components/ReceivablesDetails';
import AllPurchases from './components/AllPurchases';
import YourCards from './components/YourCards';
import AllTransactions from './components/AllTransactions';
import EditProfile from './components/EditProfile';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetConfirmation from './components/ResetConfirmation';
import Notifications from './components/Notifications';
import Imoveis from './components/Imoveis';
import ImovelDetail from './components/ImovelDetail';
import Commitments from './components/Commitments';
import MonthlyBackupReminderModal from './components/MonthlyBackupReminderModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ExportDataModal from './components/ExportDataModal';
import { supabase } from './lib/supabaseClient';

// Create Context for Menu Control
export const MenuContext = createContext({
  isMenuOpen: false,
  toggleMenu: () => { },
  openMenu: () => { },
  closeMenu: () => { }
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  return session ? <>{children}</> : <Navigate to="/login" replace />;
};

// Bottom Nav — mobile only (md:hidden keeps it invisible on desktop)
const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const hideNavPaths = ['/login', '/signup', '/forgot-password', '/reset-confirmation'];
  if (hideNavPaths.includes(location.pathname)) return null;

  const navItems = [
    { path: '/', icon: 'home', label: 'Início' },
    { path: '/third-party', icon: 'directions_car', label: 'Veículo' },
    { path: '/wallet', icon: 'account_balance_wallet', label: 'Terceiros' },
    { path: '/settings', icon: 'settings', label: 'Ajustes' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface-light dark:bg-surface-dark px-6 pb-6 pt-3 shadow-nav rounded-t-3xl border-t border-gray-100 dark:border-gray-800">
      <div className="flex justify-around items-end relative">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 w-14 group ${active ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <span className={`material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform duration-200 ${active ? 'icon-filled' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Desktop Sidebar — hidden on mobile (hidden md:flex)
const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const hideNavPaths = ['/login', '/signup', '/forgot-password', '/reset-confirmation'];
  if (hideNavPaths.includes(location.pathname)) return null;

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const menuItems = [
    { path: '/', icon: 'home', label: 'Início' },
    { path: '/commitments', icon: 'event', label: 'Compromissos', color: 'text-emerald-600 dark:text-emerald-400' },
    { divider: true },
    { path: '/expenses', icon: 'trending_down', label: 'Ver Despesas', color: 'text-red-500' },
    { path: '/income', icon: 'trending_up', label: 'Ver Receitas', color: 'text-emerald-600' },
    { divider: true },
    { path: '/third-party', icon: 'directions_car', label: 'Veículo' },
    { path: '/wallet', icon: 'account_balance_wallet', label: 'Terceiros' },
    { path: '/credit-cards', icon: 'credit_card', label: 'Cartões' },
    { path: '/imoveis', icon: 'apartment', label: 'Imóveis', color: 'text-blue-500' },
    { divider: true },
    { path: '/settings', icon: 'settings', label: 'Ajustes' },
  ];

  const handleLogout = async () => {
    localStorage.removeItem('isAuthenticated');
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 h-screen sticky top-0 bg-surface-light dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800 overflow-y-auto scrollbar-hide z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-xl bg-primary shadow-sm">
            <span className="material-symbols-outlined text-white text-[18px] icon-filled">savings</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-none">Meu</p>
            <p className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">Dindin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 px-3 py-4">
        {menuItems.map((item, index) =>
          item.divider ? (
            <div key={`d-${index}`} className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-1" />
          ) : (
            <Link
              key={item.path}
              to={item.path!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path!)
                  ? 'bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-surface-variant-light dark:hover:bg-surface-variant-dark hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] shrink-0 ${isActive(item.path!) ? 'text-primary icon-filled' : (item.color || '')}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};

// Monthly Backup Checker
const MonthlyBackupChecker: React.FC = () => {
  const { session } = useAuth();
  const location = useLocation();
  const STORAGE_KEY = 'meudindin_backup_reminder_month';
  const [showReminder, setShowReminder] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [prevMonthLabel, setPrevMonthLabel] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;
    const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-confirmation'];
    if (publicPaths.includes(location.pathname)) return;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey !== currentMonthKey) {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const label = prevDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      setPrevMonthLabel(label.charAt(0).toUpperCase() + label.slice(1));
      const timer = setTimeout(() => setShowReminder(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [session, location.pathname]);

  const handleClose = () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    localStorage.setItem(STORAGE_KEY, currentMonthKey);
    setShowReminder(false);
  };

  const handleGenerateReport = () => {
    handleClose();
    setTimeout(() => setShowExportModal(true), 300);
  };

  return (
    <>
      <MonthlyBackupReminderModal
        isOpen={showReminder}
        onClose={handleClose}
        onGenerateReport={handleGenerateReport}
        previousMonthLabel={prevMonthLabel}
      />
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        initialStep="filter"
        initialPeriod="previous"
      />
    </>
  );
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <AuthProvider>
      <MenuContext.Provider value={{ isMenuOpen, toggleMenu, openMenu, closeMenu }}>
        <ToastProvider>
          <HashRouter>
            {/*
              MOBILE  (< 768px): max-w-md centered, bottom nav, drawer — UNCHANGED
              DESKTOP (>= 768px): green bg + left sidebar + floating app card
            */}
            <div className="
              min-h-screen w-full
              md:flex md:flex-row
              md:bg-background-light dark:md:bg-background-dark
            ">
              {/* Persistent desktop sidebar */}
              <DesktopSidebar />

              {/* Right area: fills available space beside sidebar */}
              <div className="md:flex-1 md:flex md:flex-col md:min-h-screen md:overflow-hidden">

                {/* App shell
                    Mobile:  h-[100dvh], w-full, max-w-md centered
                    Desktop: fills full width, full height, no card styling
                */}
                <div className="
                  relative flex flex-col overflow-hidden
                  bg-background-light dark:bg-background-dark
                  h-[100dvh] w-full max-w-md mx-auto
                  md:h-screen md:max-w-none md:mx-0 md:w-full md:rounded-none md:shadow-none md:border-none
                ">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-confirmation" element={<ResetConfirmation />} />

                    {/* Protected routes */}
                    <Route path="/*" element={
                      <>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-none scrollbar-hide w-full relative pb-28 md:pb-4 h-full">
                          <Routes>
                            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/third-party" element={<ProtectedRoute><ThirdPartyCards /></ProtectedRoute>} />
                            <Route path="/register" element={<ProtectedRoute><RegisterCost /></ProtectedRoute>} />
                            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                            <Route path="/wallet/register" element={<ProtectedRoute><RegisterPurchase /></ProtectedRoute>} />
                            <Route path="/wallet/details" element={<ProtectedRoute><ReceivablesDetails /></ProtectedRoute>} />
                            <Route path="/wallet/all" element={<ProtectedRoute><AllPurchases /></ProtectedRoute>} />
                            <Route path="/credit-cards" element={<ProtectedRoute><YourCards /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="/settings/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                            <Route path="/expenses" element={<ProtectedRoute><ViewExpenses /></ProtectedRoute>} />
                            <Route path="/income" element={<ProtectedRoute><ViewIncome /></ProtectedRoute>} />
                            <Route path="/scan" element={<ProtectedRoute><ScanReceipt /></ProtectedRoute>} />
                            <Route path="/all-transactions" element={<ProtectedRoute><AllTransactions /></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                            <Route path="/imoveis" element={<ProtectedRoute><Imoveis /></ProtectedRoute>} />
                            <Route path="/imoveis/:id" element={<ProtectedRoute><ImovelDetail /></ProtectedRoute>} />
                            <Route path="/commitments" element={<ProtectedRoute><Commitments /></ProtectedRoute>} />
                          </Routes>
                        </div>

                        {/* Mobile-only bottom nav */}
                        <BottomNav />

                        {/* Mobile-only drawer */}
                        <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />

                        <MonthlyBackupChecker />
                      </>
                    } />
                  </Routes>
                </div>
              </div>
            </div>
          </HashRouter>
        </ToastProvider>
      </MenuContext.Provider>
    </AuthProvider>
  );
};

export default App;
