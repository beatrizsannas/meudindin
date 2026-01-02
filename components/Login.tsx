import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Auth state change will be picked up by AuthContext
      navigate('/');
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden items-center justify-center px-8 py-12 bg-background-light dark:bg-background-dark font-display">
      {/* Main Container */}
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        {/* Header / Logo */}
        <div className="flex flex-col items-center gap-5 pt-8 pb-4">
          {/* Logo Graphic */}
          <div
            className="relative flex items-center justify-center h-24 w-24 rounded-2xl bg-gradient-to-br from-[#0df26c] to-[#04c452] shadow-lg shadow-[#0df26c]/30"
            data-alt="Abstract wallet and graph logo icon in neon green"
          >
            <span className="material-symbols-outlined text-white text-[48px]">account_balance_wallet</span>
          </div>
          {/* App Title */}
          <div className="flex flex-col items-center justify-center gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-center text-text-main dark:text-white">Meu Dindin</h1>
            <p className="text-text-secondary dark:text-gray-400 text-base font-medium text-center">Gerencie seu dinheiro com facilidade</p>
          </div>
        </div>

        {/* Login Form */}
        <form className="flex flex-col gap-4 w-full" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label className="text-text-main dark:text-gray-200 text-sm font-semibold leading-normal ml-1">E-mail</label>
            <div className="relative">
              <input
                className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-gray-700 bg-white dark:bg-[#1A2E22] focus:border-primary h-14 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-4 text-base font-normal leading-normal transition-all"
                placeholder="seu@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-text-main dark:text-gray-200 text-sm font-semibold leading-normal ml-1">Senha</label>
            <div className="relative flex w-full items-stretch rounded-xl">
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-gray-700 bg-white dark:bg-[#1A2E22] focus:border-primary h-14 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-12 text-base font-normal leading-normal transition-all"
                placeholder="Digite sua senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Icon Left */}
              <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              {/* Eye Toggle Right */}
              <button
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 hover:text-primary transition-colors cursor-pointer"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-bold text-text-main dark:text-primary hover:text-primary dark:hover:text-primary/80 transition-colors">
              Esqueci a Senha?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            size="lg"
            className="mt-2 text-[#0a2e1d] shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-light dark:border-gray-700"></div>
          <span className="flex-shrink mx-4 text-text-secondary dark:text-gray-500 text-xs font-medium uppercase tracking-wider">Ou continue com</span>
          <div className="flex-grow border-t border-border-light dark:border-gray-700"></div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-12 bg-white dark:bg-[#1A2E22] border-border-light dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"></path>
                <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"></path>
                <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05"></path>
                <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"></path>
              </svg>
              <span className="text-sm font-bold text-text-main dark:text-white">Google</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-12 bg-white dark:bg-[#1A2E22] border-border-light dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-text-main dark:text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.68-.32-1.42-.48-2.26-.48-.88 0-1.68.17-2.39.51-1.01.48-1.99.52-2.93-.44-1.89-1.92-3.23-5.5-1.32-8.8 1.05-1.82 2.85-2.95 4.88-2.92 1.02.01 1.95.4 2.76.71.69.27 1.25.29 1.76.01.8-.44 1.9-.84 3.18-.72 1.34.12 2.51.64 3.32 1.83-2.9 1.77-2.4 5.99.71 7.23-.55 1.15-1.12 2.07-1.88 2.67H17.05ZM15.22 5.09c-.06 2.09-1.74 3.79-3.79 3.84-.28-2.06 1.4-4.04 3.79-3.84Z"></path>
              </svg>
              <span className="text-sm font-bold text-text-main dark:text-white">Apple</span>
            </div>
          </Button>
        </div>

        {/* Footer Register */}
        <div className="flex items-center justify-center mt-4">
          <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">
            Não tem uma conta?
            <Link to="/signup" className="text-primary font-bold hover:underline decoration-2 underline-offset-2 ml-1">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;