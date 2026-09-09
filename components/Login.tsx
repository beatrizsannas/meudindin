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
          <div className="relative flex items-center justify-center h-36 w-36 rounded-[32px] overflow-hidden shadow-xl ring-1 ring-gray-900/5 dark:ring-white/20 bg-[#F4F6F5] dark:bg-[#1A2E22]" data-alt="Meu Dindin Mascot Logo">
            <img 
              src="/assets/mascot_logo.png" 
              alt="Meu Dindin Mascot" 
              className="w-full h-full object-cover scale-[1.22] -translate-y-2" 
            />
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
                className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#228b3b]/30 border border-border-light dark:border-gray-700 bg-white dark:bg-[#1A2E22] focus:border-[#228b3b] h-14 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-4 text-base font-normal leading-normal transition-all"
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
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#228b3b]/30 border border-border-light dark:border-gray-700 bg-white dark:bg-[#1A2E22] focus:border-[#228b3b] h-14 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-12 text-base font-normal leading-normal transition-all"
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
            className="mt-2 !bg-[#228b3b] hover:!bg-[#1b7330] !text-white font-bold text-base !shadow-lg !shadow-[#228b3b]/25 focus:!ring-[#228b3b]"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>



        {/* Footer Register */}
        <div className="flex items-center justify-center mt-4">
          <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">
            Não tem uma conta?
            {/* Mascot matching green */}
            <Link to="/signup" className="text-[#228b3b] hover:text-[#1b7330] dark:text-[#2ea342] font-bold hover:underline decoration-2 underline-offset-2 ml-1">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;