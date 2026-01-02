import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    navigate('/reset-confirmation');
  };

  return (
    <div className="relative flex h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-[#15281e] shadow-sm font-display text-[#111814] dark:text-white overflow-x-hidden">
      {/* TopAppBar */}
      <div className="flex items-center p-4 pb-2 justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#111814] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Recuperar Acesso
        </h2>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-y-auto">
        {/* Hero Illustration */}
        <div className="flex justify-center pt-8 pb-6">
          <div className="relative flex items-center justify-center size-24 bg-primary/20 rounded-full">
            <span className="material-symbols-outlined text-primary text-[48px]">lock_reset</span>
          </div>
        </div>

        {/* HeadlineText */}
        <h1 className="text-[#111814] dark:text-white tracking-tight text-[28px] font-extrabold leading-tight text-center pb-3">
          Esqueceu sua senha?
        </h1>

        {/* BodyText */}
        <p className="text-[#608a72] dark:text-gray-300 text-base font-normal leading-relaxed pb-8 text-center px-2">
          Não se preocupe! Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
        </p>

        {/* Form */}
        <form className="flex flex-col gap-6 w-full" onSubmit={handleReset}>
          {/* TextField */}
          <label className="flex flex-col w-full">
            <span className="text-[#111814] dark:text-gray-200 text-sm font-semibold leading-normal pb-2 ml-1">E-mail</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#608a72]">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input 
                className="form-input flex w-full min-w-0 resize-none rounded-xl text-[#111814] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe6df] dark:border-gray-600 bg-white dark:bg-[#1a3324] focus:border-primary h-14 placeholder:text-[#a0b3a9] dark:placeholder:text-gray-500 pl-12 pr-4 text-base font-medium leading-normal transition-all" 
                placeholder="seu.email@exemplo.com" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </label>

          {/* Primary Action Button */}
          <button className="flex w-full items-center justify-center rounded-xl bg-primary hover:bg-[#0be062] active:bg-[#09c455] text-[#102217] text-base font-bold h-14 transition-colors shadow-sm mt-2">
            Redefinir Senha
          </button>
        </form>
      </div>

      {/* Footer Link */}
      <div className="p-6 pb-8 text-center">
        <p className="text-[#608a72] dark:text-gray-400 text-sm font-medium">
          Lembrou sua senha? 
          <Link to="/login" className="text-[#102217] dark:text-primary font-bold hover:underline ml-1">
            Entrar agora
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;