import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

type CategoryKey = 'entrada' | 'fgts' | 'construtora' | 'evolucao_obra' | 'financiamento' | 'outros';

const CATEGORIES: { key: CategoryKey; label: string; icon: string; color: [number, number, number] }[] = [
  { key: 'entrada',       label: 'Entrada',          icon: 'home',            color: [37, 99, 235] },
  { key: 'fgts',          label: 'FGTS',             icon: 'account_balance', color: [5, 150, 105] },
  { key: 'construtora',   label: 'Construtora',      icon: 'construction',    color: [234, 88, 12] },
  { key: 'evolucao_obra', label: 'Evolução de Obra', icon: 'trending_up',     color: [124, 58, 237] },
  { key: 'financiamento', label: 'Financiamento',    icon: 'credit_card',     color: [225, 29, 72] },
  { key: 'outros',        label: 'Outros',           icon: 'more_horiz',      color: [100, 116, 139] },
];

const CAT_LABELS: Record<CategoryKey, string> = {
  entrada: 'Entrada', fgts: 'FGTS', construtora: 'Construtora',
  evolucao_obra: 'Evolução de Obra', financiamento: 'Financiamento', outros: 'Outros',
};

interface Payment {
  id: string;
  category: CategoryKey;
  description: string | null;
  amount: number;
  date: string;
}

interface Property {
  id: string;
  name: string;
  address: string | null;
  contract_value?: number | null;
}

interface ImovelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  payments: Payment[];
}

const ImovelExportModal: React.FC<ImovelExportModalProps> = ({ isOpen, onClose, property, payments }) => {
  const { showToast } = useToast();
  const [selectedCats, setSelectedCats] = useState<Set<CategoryKey>>(new Set(CATEGORIES.map(c => c.key)));
  const [isExporting, setIsExporting] = useState(false);
  const [step, setStep] = useState<'filter' | 'preview'>('filter');

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

  const toggleCat = (key: CategoryKey) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredPayments = payments.filter(p => selectedCats.has(p.category));

  const totalsPerCat = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = filteredPayments.filter(p => p.category === cat.key).reduce((s, p) => s + p.amount, 0);
    return acc;
  }, {} as Record<CategoryKey, number>);

  const grandTotal = filteredPayments.reduce((s, p) => s + p.amount, 0);

  const handleGeneratePDF = () => {
    setIsExporting(true);
    try {
      // @ts-ignore
      const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
      if (!jsPDF) { showToast('Biblioteca PDF não encontrada.', 'error'); return; }

      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Meu Dindin', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('IMÓVEL — RELATÓRIO DE PAGAMENTOS', 14, 26);
      doc.text(`Imóvel: ${property.name}`, 14, 32);
      if (property.address) doc.text(`Endereço: ${property.address}`, 14, 37);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 150, 20);

      let y = property.address ? 47 : 42;

      // Contract value
      if (property.contract_value) {
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Valor do contrato: ${fmt(property.contract_value)}`, 14, y);
        y += 8;
      }

      // Summary box
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Sumário', 14, y + 4);
      y += 10;

      // @ts-ignore
      doc.autoTable({
        startY: y,
        head: [['Categoria', 'Total']],
        body: CATEGORIES.filter(c => selectedCats.has(c.key) && totalsPerCat[c.key] > 0).map(c => [
          c.label,
          fmt(totalsPerCat[c.key]),
        ]),
        foot: [['TOTAL GERAL', fmt(grandTotal)]],
        headStyles: { fillColor: [26, 58, 108] },
        footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
        theme: 'grid',
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 15;

      // Per-category detail tables
      for (const cat of CATEGORIES) {
        if (!selectedCats.has(cat.key)) continue;
        const rows = filteredPayments.filter(p => p.category === cat.key);
        if (rows.length === 0) continue;

        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...cat.color);
        doc.text(cat.label, 14, y);

        // @ts-ignore
        doc.autoTable({
          startY: y + 5,
          head: [['Data', 'Descrição', 'Valor']],
          body: rows.map(p => [fmtDate(p.date), p.description || '—', fmt(p.amount)]),
          foot: [['', `Total ${cat.label}`, fmt(totalsPerCat[cat.key])]],
          headStyles: { fillColor: cat.color },
          footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0] },
          theme: 'grid',
        });
        // @ts-ignore
        y = doc.lastAutoTable.finalY + 12;
      }

      // Footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      doc.text('Documento gerado pelo Meu Dindin.', 14, y + 6);

      const safeName = property.name.replace(/\s+/g, '_');
      doc.save(`Imovel_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF gerado com sucesso!', 'success');
      onClose();
    } catch (e: any) {
      showToast('Erro ao gerar PDF: ' + e.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1c2e24] rounded-t-3xl shadow-2xl border-t border-gray-100 dark:border-gray-800 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-4 mb-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            {step === 'preview' && (
              <button onClick={() => setStep('filter')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-1">
                <span className="material-symbols-outlined text-gray-500">arrow_back</span>
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {step === 'filter' ? 'Exportar Relatório' : 'Pré-visualização'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Step 1: Filter */}
        {step === 'filter' && (
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecione as categorias que deseja incluir no PDF:
            </p>

            {/* Select All / None */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCats(new Set(CATEGORIES.map(c => c.key)))}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary"
              >
                Selecionar tudo
              </button>
              <button
                onClick={() => setSelectedCats(new Set())}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                Limpar
              </button>
            </div>

            {/* Category checkboxes */}
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(cat => {
                const total = payments.filter(p => p.category === cat.key).reduce((s, p) => s + p.amount, 0);
                const count = payments.filter(p => p.category === cat.key).length;
                const checked = selectedCats.has(cat.key);
                return (
                  <label
                    key={cat.key}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      checked ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 bg-surface-light dark:bg-surface-dark'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCat(cat.key)}
                      className="w-5 h-5 rounded accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-[#111814] dark:text-white text-sm">{cat.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{count} pagamento(s)</p>
                    </div>
                    <p className={`text-sm font-extrabold ${total > 0 ? 'text-[#111814] dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                      {fmt(total)}
                    </p>
                  </label>
                );
              })}
            </div>

            {/* Total preview */}
            <div className="bg-gray-50 dark:bg-background-dark rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Total selecionado</span>
              <span className="text-lg font-extrabold text-[#111814] dark:text-white">{fmt(grandTotal)}</span>
            </div>

            <div className="pb-28 flex flex-col gap-3">
              <button
                onClick={() => setStep('preview')}
                disabled={selectedCats.size === 0 || filteredPayments.length === 0}
                className="w-full h-12 bg-primary hover:bg-primary-dark active:scale-[0.98] text-[#111814] font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">visibility</span>
                Pré-visualizar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="flex-1 p-4 bg-[#f5f8f7] overflow-y-auto pb-28">
            {/* Mini PDF card matching ExportDataModal */}
            <div className="bg-white text-gray-900 rounded-lg shadow-lg p-5 w-full text-[12px] leading-relaxed relative border-t-8 border-[#0df26c] mb-6">
              
              {/* PDF Header */}
              <div className="border-b-2 border-gray-100 mb-6 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meu Dindin</h1>
                  <p className="text-gray-500 uppercase tracking-widest text-[10px] mt-1 font-bold">Relatório de Pagamentos</p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[14px]">apartment</span>
                    <span>Imóvel: {property.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-[10px]">Gerado em</p>
                  <p className="font-bold text-sm">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* 1. SUMÁRIO GERAL */}
              <section className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#0df26c]"></span>
                  1. SUMÁRIO GERAL
                </h3>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md border border-gray-100">
                  {property.contract_value != null && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-medium uppercase mb-1">Valor do Contrato</span>
                      <span className="text-sm font-bold text-gray-900">{fmt(property.contract_value)}</span>
                    </div>
                  )}
                  <div className={`flex flex-col ${property.contract_value != null ? 'border-l border-gray-200 pl-2' : ''}`}>
                    <span className="text-[10px] text-gray-500 font-medium uppercase mb-1">Total Selecionado</span>
                    <span className="text-sm font-bold text-green-600">{fmt(grandTotal)}</span>
                  </div>
                </div>
              </section>

              {/* 2. PAGAMENTOS */}
              <section className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500"></span>
                  2. PAGAMENTOS
                </h3>
                <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
                  <table className="w-full text-left border-collapse min-w-[300px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Data</th>
                        <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Descrição</th>
                        <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Categ.</th>
                        <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px] text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {filteredPayments.map((p, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 px-1 text-gray-500">{fmtDate(p.date).slice(0, 5)}</td>
                          <td className="py-2 px-1 font-medium text-gray-900 truncate max-w-[120px]">{p.description || '—'}</td>
                          <td className="py-2 px-1 text-gray-500 truncate max-w-[80px]">{CAT_LABELS[p.category]}</td>
                          <td className="py-2 px-1 text-gray-900 font-bold text-right">{fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td className="py-2 px-1 text-right text-gray-500 uppercase text-[10px]" colSpan={3}>Total Categ.</td>
                        <td className="py-2 px-1 text-right text-gray-900">{fmt(grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400">Documento gerado automaticamente pelo aplicativo Meu Dindin.</p>
              </div>
            </div>

            <div className="mb-8 flex justify-center pb-8 pt-2">
              <button
                onClick={handleGeneratePDF}
                disabled={isExporting}
                className="flex items-center gap-2 bg-gray-900 dark:bg-[#0df26c] text-white dark:text-[#003314] px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[20px]">{isExporting ? 'hourglass_empty' : 'print'}</span>
                {isExporting ? 'Gerando...' : 'Imprimir / Salvar PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImovelExportModal;
