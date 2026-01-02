import React from 'react';
import { useNavigate } from 'react-router-dom';

const ResetConfirmation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display text-[#111814] dark:text-gray-100 antialiased selection:bg-primary selection:text-[#111814]">
      {/* TopAppBar */}
      <div className="flex items-center p-4 pb-2 justify-between shrink-0 z-10">
        <button 
          onClick={() => navigate('/login')}
          className="text-[#111814] dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <span className="material-symbols-outlined" style={{fontSize: '24px'}}>arrow_back</span>
        </button>
        <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Recuperação de Senha
        </h2>
      </div>

      {/* Main Content Area (EmptyState + Spacing) */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <div className="flex flex-col items-center gap-8 w-full max-w-[420px] animate-fade-in-up">
          {/* Hero Visual: Modified to be an Illustration Icon */}
          <div className="relative flex items-center justify-center">
            {/* Background Circle */}
            <div className="size-32 rounded-full bg-primary/20 dark:bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 dark:text-primary" style={{fontSize: '64px'}}>mail</span>
            </div>
            {/* Floating Status Badge */}
            <div className="absolute -bottom-1 -right-1 bg-background-light dark:bg-background-dark p-1.5 rounded-full">
              <div className="size-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[#111814]" style={{fontSize: '20px', fontWeight: 700}}>check</span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-[#111814] dark:text-white text-2xl font-bold leading-tight tracking-[-0.025em]">
              Verifique seu email
            </p>
            <p className="text-[#111814]/70 dark:text-gray-400 text-base font-normal leading-relaxed">
              Enviamos as instruções de recuperação de senha para o email cadastrado.
            </p>
            {/* Smaller hint text */}
            <p className="text-[#111814]/50 dark:text-gray-500 text-sm font-medium leading-normal bg-black/5 dark:bg-white/5 py-2 px-4 rounded-lg mt-2">
              <span className="material-symbols-outlined align-middle mr-1 text-sm" style={{fontSize: '16px'}}>info</span>
              Não encontrou? Verifique sua caixa de spam.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions (SingleButton Components) */}
      <div className="flex flex-col gap-3 px-6 pb-8 pt-4 w-full max-w-[420px] mx-auto shrink-0 z-10">
        {/* Primary Action */}
        <button 
          onClick={() => navigate('/login')}
          className="group flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary hover:bg-[#0be062] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/20"
        >
          <span className="text-[#111814] text-base font-bold leading-normal tracking-[0.015em]">Voltar para o Login</span>
        </button>
        {/* Secondary Action */}
        <button 
            onClick={() => alert('Email reenviado!')}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-4 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-200"
        >
          <span className="text-[#111814] dark:text-white text-sm font-bold leading-normal tracking-[0.015em]">Reenviar Email</span>
        </button>
      </div>
    </div>
  );
};

export default ResetConfirmation;