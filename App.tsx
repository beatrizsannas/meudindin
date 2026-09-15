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
    // You can replace this with a proper loading spinner component
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />;
};

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  // Hide Nav on Auth Screens
  const hideNavPaths = ['/login', '/signup', '/forgot-password', '/reset-confirmation'];
  if (hideNavPaths.includes(location.pathname)) {
    return null;
  }

  const navItems = [
    { path: '/', icon: 'home', label: 'Início' },
    { path: '/third-party', icon: 'directions_car', label: 'Veículo' },
    { path: '/wallet', icon: 'account_balance_wallet', label: 'Terceiros' },
    { path: '/settings', icon: 'settings', label: 'Ajustes' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface-light dark:bg-surface-dark px-6 pb-6 pt-3 shadow-nav rounded-t-3xl border-t border-gray-100 dark:border-gray-800">
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
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

import { ToastProvider } from './contexts/ToastContext';
import ExportDataModal from './components/ExportDataModal';

// Monthly backup reminder — shows once per month on first visit
const MonthlyBackupChecker: React.FC = () => {
  const { session } = useAuth();
  const location = useLocation();

  const STORAGE_KEY = 'meudindin_backup_reminder_month';

  const [showReminder, setShowReminder] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [prevMonthLabel, setPrevMonthLabel] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;

    // Only check on protected pages (not login/signup/etc)
    const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-confirmation'];
    if (publicPaths.includes(location.pathname)) return;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const storedKey = localStorage.getItem(STORAGE_KEY);

    if (storedKey !== currentMonthKey) {
      // Compute previous month label in Portuguese
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const label = prevDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      // Capitalize first letter
      setPrevMonthLabel(label.charAt(0).toUpperCase() + label.slice(1));
      // Small delay so the app has time to fully render before the modal pops up
      const timer = setTimeout(() => setShowReminder(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [session, location.pathname]);

  const handleClose = () => {
    // Mark this month as seen
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    localStorage.setItem(STORAGE_KEY, currentMonthKey);
    setShowReminder(false);
  };

  const handleGenerateReport = () => {
    handleClose();
    // Small delay then open export modal
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
            {/* Main App Container - Relative to contain the absolute SideMenu */}
            {/* Removed shadow-2xl to fix the "left shadow" issue on login screen */}
            <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden max-w-md mx-auto bg-background-light dark:bg-background-dark">

              <Routes>
                {/* Public Auth Routes — sem wrapper de scroll, sem pb-28 */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-confirmation" element={<ResetConfirmation />} />

                {/* Protected App Routes — dentro do scroll wrapper com nav e pb-28 */}
                <Route path="/*" element={
                  <>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-none scrollbar-hide w-full relative pb-28 h-full">
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

                    <BottomNav />
                    <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
                    <MonthlyBackupChecker />
                  </>
                } />
              </Routes>

            </div>
          </HashRouter>
        </ToastProvider>
      </MenuContext.Provider>
    </AuthProvider>
  );
};

export default App;