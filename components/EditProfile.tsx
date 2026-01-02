import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "Maria Silva",
    email: "maria.silva@email.com",
    phone: "(11) 98765-4321",
    dob: "1990-05-15"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Logic to save profile data would go here
    alert("Perfil atualizado com sucesso!");
    navigate(-1);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <button 
            onClick={() => navigate(-1)}
            className="text-gray-900 dark:text-gray-100 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
            <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
        </button>
        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Editar Perfil
        </h2>
        <div className="size-12 shrink-0"></div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer">
                <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 border-4 border-surface-light dark:border-surface-dark shadow-md" 
                    data-alt="User profile picture of a smiling woman" 
                    style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC1t3_M-oMF0kPEnEWv_RIeUj7y1lTKWQoNvHelsL8-t_xLOtqRwi1Iq2ot3P5VoSbi8y4FMebaRo6L_3jh11cRRp-tcQPfbRkbLVKcs9dRA4d7kE6iyYOqRouyLLjzFwSkWRZKQrwAv6iqANDkH3JN9m3XOJQcpMmoA1Bv26oFZMkuVvA-5IIyVieDoxJHQqW99rT5zstZRAuUspyvCqDWQjSOOfFxp22L-HvRdoklz-AvXZPV14ROk4W3H523Itev8oixCOo")'}}
                >
                </div>
                <div className="absolute bottom-0 right-0 bg-primary hover:bg-green-400 transition-colors rounded-full p-2 border-4 border-background-light dark:border-background-dark flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px] text-surface-dark font-bold">photo_camera</span>
                </div>
            </div>
            <button className="mt-3 text-primary dark:text-primary font-bold text-sm hover:underline">
                Alterar foto
            </button>
        </div>

        <form className="space-y-5" onSubmit={handleSave}>
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="name">
                    Nome Completo
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <input 
                        className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium" 
                        id="name" 
                        name="name" 
                        placeholder="Seu nome completo" 
                        type="text" 
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="email">
                    E-mail
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <input 
                        className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium" 
                        id="email" 
                        name="email" 
                        placeholder="seu@email.com" 
                        type="email" 
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="phone">
                    Telefone
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">smartphone</span>
                    </div>
                    <input 
                        className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium" 
                        id="phone" 
                        name="phone" 
                        placeholder="(00) 00000-0000" 
                        type="tel" 
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1" htmlFor="dob">
                    Data de Nascimento
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                    <input 
                        className="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm font-medium [color-scheme:light] dark:[color-scheme:dark]" 
                        id="dob" 
                        name="dob" 
                        type="date" 
                        value={formData.dob}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </form>
      </main>
      <div className="p-4 bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 sticky bottom-0 z-20">
        <button 
            onClick={() => handleSave()}
            className="w-full bg-primary text-surface-dark font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-green-400 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
            <span className="material-symbols-outlined">save</span>
            Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default EditProfile;