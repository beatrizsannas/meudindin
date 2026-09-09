import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const accepted = localStorage.getItem('@MeuDindin:termsAccepted');
      if (accepted === 'true') {
        setHasAccepted(true);
        setIsChecked(true);
      } else {
        setHasAccepted(false);
        setIsChecked(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (isChecked) {
      localStorage.setItem('@MeuDindin:termsAccepted', 'true');
      setHasAccepted(true);
      showToast('Termos aceitos com sucesso!', 'success');
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background-light dark:bg-surface-dark rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-500">
              <span className="material-symbols-outlined icon-filled">description</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Termos de Uso</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-600 dark:text-gray-300 space-y-6">
          
          <div className="text-xs font-semibold text-gray-400">
            Última atualização: {currentDate}
          </div>

          <p className="leading-relaxed">
            Bem-vindo(a) ao Meu Dindin! Criamos este textinho para deixar claro como o nosso aplicativo funciona. Ao usar o app, você concorda com estas regrinhas básicas.
          </p>

          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">1. Para que serve o app?</h4>
            <p className="leading-relaxed">
              O Meu Dindin é uma ferramenta simples desenvolvida para te ajudar a anotar, organizar e acompanhar seus gastos diários. Ele serve como um apoio para o seu controle pessoal.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">2. Seus Dados</h4>
            <p className="leading-relaxed">
              Nós respeitamos a sua privacidade. Os dados que você insere no aplicativo são seus. Não vendemos suas informações para terceiros.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">3. Nossa Responsabilidade</h4>
            <p className="leading-relaxed">
              O aplicativo é oferecido como apenas uma ferramenta de anotação. Não nos responsabilizamos por decisões financeiras. Use o app como um aliado, mas sempre fique de olho nas suas finanças!
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">4. Exclusão de Dados</h4>
            <p className="leading-relaxed">
              Você tem controle total. A qualquer momento, você pode utilizar a opção "Apagar todos os dados" nas Configurações para deletar permanentemente suas informações do nosso sistema.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">5. Dúvidas?</h4>
            <p className="leading-relaxed">
              Se precisar de alguma coisa, a gente está à disposição! É só usar o botão "Ajuda e Suporte" no aplicativo para falar com a gente direto no WhatsApp.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-surface-dark/50 shrink-0">
          {hasAccepted ? (
            <div className="flex items-center gap-3 justify-center text-primary bg-primary/10 p-3 rounded-xl border border-primary/20">
              <span className="material-symbols-outlined text-[24px]">verified</span>
              <span className="font-bold text-sm">Você já aceitou os termos de uso.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 dark:border-white/20 bg-background-light dark:bg-white/5 checked:bg-primary checked:border-primary transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#ffffff] opacity-0 peer-checked:opacity-100 pointer-events-none text-[16px]">check</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Li e concordo com os Termos de Uso do Meu Dindin.
                </span>
              </label>
              
              <button
                onClick={handleAccept}
                disabled={!isChecked}
                className="w-full bg-primary text-surface-dark font-bold text-lg py-3.5 rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Aceitar Termos
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TermsModal;
