import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative flex min-h-full w-full flex-col overflow-y-auto items-center justify-center p-6 bg-background-light dark:bg-background-dark font-display">
      <div className="w-full max-w-[400px] flex flex-col gap-6 my-auto">

        <div className="flex flex-col items-center gap-5 pt-4 pb-2">
          <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0df26c] to-[#04c452] shadow-lg shadow-[#0df26c]/30">
            <span className="material-symbols-outlined text-white text-[40px]">account_balance_wallet</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-center text-text-main dark:text-white">Criar Conta</h1>
            <p className="text-text-secondary dark:text-gray-400 text-sm font-medium text-center">Cadastre-se para controlar suas finanças</p>
          </div>
        </div>

        <form className="flex flex-col gap-4 w-full" onSubmit={handleRegister}>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-text-main dark:text-gray-200 text-sm font-semibold leading-normal ml-1">Nome Completo</label>
            <div className="relative">
              <input
                className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-gray-700 bg-white dark:bg-surface-dark focus:border-primary h-12 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-4 text-base font-normal leading-normal transition-all"
                placeholder="Seu nome"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-text-main dark:text-gray-200 text-sm font-semibold leading-normal ml-1">E-mail</label>
            <div className="relative">
              <input
                className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-gray-700 bg-white dark:bg-surface-dark focus:border-primary h-12 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-4 text-base font-normal leading-normal transition-all"
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

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-text-main dark:text-gray-200 text-sm font-semibold leading-normal ml-1">Senha</label>
            <div className="relative flex w-full items-stretch rounded-xl">
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-gray-700 bg-white dark:bg-surface-dark focus:border-primary h-12 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-12 text-base font-normal leading-normal transition-all"
                placeholder="Crie uma senha"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <button
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 hover:text-primary transition-colors cursor-pointer"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
            {/* Strength Bars */}
            <div className="flex items-center gap-1 mt-1 px-1">
              <div className={`h-1 flex-1 rounded-full ${password.length > 0 ? 'bg-red-400' : 'bg-border-light dark:bg-gray-700'}`}></div>
              <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-yellow-400' : 'bg-border-light dark:bg-gray-700'}`}></div>
              <div className={`h-1 flex-1 rounded-full ${password.length >= 10 ? 'bg-green-400' : 'bg-border-light dark:bg-gray-700'}`}></div>
              <div className="h-1 flex-1 rounded-full bg-border-light dark:bg-gray-700"></div>
            </div>
            <p className="text-xs text-text-secondary dark:text-gray-500 px-1">Mínimo de 8 caracteres</p>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-text-main dark:text-gray-200 text-sm font-semibold leading-normal ml-1">Confirmar Senha</label>
            <div className="relative flex w-full items-stretch rounded-xl">
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-main dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-gray-700 bg-white dark:bg-surface-dark focus:border-primary h-12 placeholder:text-text-secondary/70 dark:placeholder:text-gray-500 pl-[48px] pr-12 text-base font-normal leading-normal transition-all"
                placeholder="Repita sua senha"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
              </div>
              <button
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-text-secondary dark:text-gray-500 hover:text-primary transition-colors cursor-pointer"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            className="mt-4 text-[#0a2e1d] shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>

        <div className="flex items-center justify-center mt-6 mb-4">
          <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">
            Já tenho uma conta?
            <Link to="/login" className="text-primary font-bold hover:underline decoration-2 underline-offset-2 ml-1">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;