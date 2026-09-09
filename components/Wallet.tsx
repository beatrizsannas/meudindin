import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MenuContext } from '../App';
import Button from './Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

import { useThirdPartyPurchases, Purchase } from '../hooks/useWallet';
import { useQueryClient } from '@tanstack/react-query';

const Wallet: React.FC = () => {
  const { openMenu } = useContext(MenuContext);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  // React Query
  const { data: purchases = [], isLoading: loading } = useThirdPartyPurchases();

  // History Report State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyStep, setHistoryStep] = useState<'filter' | 'preview'>('filter');
  const [historyPeriod, setHistoryPeriod] = useState<'current' | 'previous' | 'custom'>('current');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [historyData, setHistoryData] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fixed lists for selectors
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const years = [2023, 2024, 2025, 2026];

  const handleTogglePaid = async (id: string, currentPaid: number, total: number, isCurrentlyPaid: boolean) => {
    if (isCurrentlyPaid) {
      if (currentPaid <= 0) return;
      const newPaidCount = currentPaid - 1;
      const isFullyPaid = newPaidCount >= total;
      try {
        const { error } = await supabase
          .from('third_party_purchases')
          .update({ installments_paid: newPaidCount, is_paid: isFullyPaid })
          .eq('id', id);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['third-party-purchases'] });
        showToast("Parcela marcada como pendente.", "success");
      } catch (error) {
        console.error(error);
        showToast("Erro ao atualizar", "error");
      }
    } else {
      if (currentPaid >= total) return;
      const newPaidCount = currentPaid + 1;
      const isFullyPaid = newPaidCount >= total;
      try {
        const { error } = await supabase
          .from('third_party_purchases')
          .update({ installments_paid: newPaidCount, is_paid: isFullyPaid })
          .eq('id', id);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['third-party-purchases'] });
        if (isFullyPaid) {
          showToast("Compra totalmente paga!", "success");
        } else {
          showToast("Parcela marcada como paga.", "success");
        }
      } catch (error) {
        console.error(error);
        showToast("Erro ao atualizar", "error");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar?")) return;
    try {
      const { error } = await supabase.from('third_party_purchases').delete().eq('id', id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['third-party-purchases'] });
      showToast("Compra apagada com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast("Erro ao apagar", "error");
    }
  };

  const handleEdit = (purchase: Purchase) => {
    navigate('/wallet/register', { state: { purchase } });
  };

  const getInstallmentDetails = (purchase: Purchase) => {
    const [y, m] = purchase.start_payment_date.split('-');
    const startYear = parseInt(y);
    const startMonth = parseInt(m) - 1;
    const diffMonths = (selectedYear - startYear) * 12 + (selectedMonth - startMonth);
    const installmentNumber = diffMonths + 1;
    const isValid = installmentNumber >= 1 && installmentNumber <= purchase.installments_total;
    const isPaidThisMonth = installmentNumber <= purchase.installments_paid;
    const isFullyPaid = purchase.is_paid;
    const installmentValue = purchase.amount / purchase.installments_total;
    const progressPercent = (purchase.installments_paid / purchase.installments_total) * 100;
    return { isValid, installmentNumber, isPaidThisMonth, isFullyPaid, installmentValue, progressPercent };
  };

  const activePurchases = purchases
    .map(p => ({ ...p, ...getInstallmentDetails(p) }))
    .filter(p => p.isValid)
    .filter(p => p.person_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.item_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalReceivable = activePurchases
    .filter(p => !p.isPaidThisMonth && !p.isFullyPaid)
    .reduce((acc, curr) => acc + curr.installmentValue, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // ─── HISTORY REPORT LOGIC ───
  const openHistory = () => {
    setHistoryStep('filter');
    setHistoryPeriod('current');
    setCustomDateFrom('');
    setCustomDateTo('');
    setHistoryData(null);
    setIsHistoryOpen(true);
  };

  const getHistoryPeriodLabel = () => {
    if (historyPeriod === 'current') return 'Mês Atual';
    if (historyPeriod === 'previous') return 'Mês Anterior';
    if (customDateFrom && customDateTo) {
      return `${new Date(customDateFrom + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(customDateTo + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    }
    return 'Personalizado';
  };

  const filterPurchasesByPeriod = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return purchases.filter(p => {
      const dateStr = p.start_payment_date || p.purchase_date;
      if (!dateStr) return false;
      const startParts = dateStr.split('-');
      const startYear = parseInt(startParts[0]);
      const startMonth = parseInt(startParts[1]) - 1;

      if (historyPeriod === 'current') {
        const diffMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);
        const installmentNumber = diffMonths + 1;
        return installmentNumber >= 1 && installmentNumber <= p.installments_total;
      }

      if (historyPeriod === 'previous') {
        const prevDate = new Date(currentYear, currentMonth - 1, 1);
        const diffMonths = (prevDate.getFullYear() - startYear) * 12 + (prevDate.getMonth() - startMonth);
        const installmentNumber = diffMonths + 1;
        return installmentNumber >= 1 && installmentNumber <= p.installments_total;
      }

      if (historyPeriod === 'custom' && customDateFrom && customDateTo) {
        const from = new Date(customDateFrom + 'T00:00:00');
        const to = new Date(customDateTo + 'T23:59:59');
        for (let i = 0; i < p.installments_total; i++) {
          const instDate = new Date(startYear, startMonth + i, 1);
          const instEndDate = new Date(startYear, startMonth + i + 1, 0);
          if (instEndDate >= from && instDate <= to) return true;
        }
        return false;
      }
      return false;
    }).map(p => {
      const dateStr = p.start_payment_date || p.purchase_date;
      const startParts = dateStr.split('-');
      const startYear = parseInt(startParts[0]);
      const startMonth = parseInt(startParts[1]) - 1;

      let installmentNumber = 1;
      if (historyPeriod === 'current') {
        const diffMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);
        installmentNumber = diffMonths + 1;
      } else if (historyPeriod === 'previous') {
        const prevDate = new Date(currentYear, currentMonth - 1, 1);
        const diffMonths = (prevDate.getFullYear() - startYear) * 12 + (prevDate.getMonth() - startMonth);
        installmentNumber = diffMonths + 1;
      } else if (historyPeriod === 'custom' && customDateFrom) {
        const fromDate = new Date(customDateFrom + 'T00:00:00');
        const diffMonths = (fromDate.getFullYear() - startYear) * 12 + (fromDate.getMonth() - startMonth);
        installmentNumber = Math.max(1, Math.min(p.installments_total, diffMonths + 1));
      }

      const installmentValue = p.amount / p.installments_total;
      const isPaidThisMonth = installmentNumber <= p.installments_paid;
      const isFullyPaid = p.is_paid || p.installments_paid >= p.installments_total;
      const isPaid = isPaidThisMonth || isFullyPaid;

      return {
        ...p,
        installmentNumber,
        installmentValue,
        isPaidThisMonth,
        isFullyPaid,
        isPaid,
      };
    });
  };

  const handleHistoryPreview = () => {
    if (historyPeriod === 'custom') {
      if (!customDateFrom || !customDateTo) {
        showToast("Selecione as datas de início e fim.", "warning");
        return;
      }
      const fromD = new Date(customDateFrom + 'T00:00:00');
      const toD = new Date(customDateTo + 'T00:00:00');
      if (fromD > toD) {
        showToast("A data de início não pode ser maior que a data de fim.", "warning");
        return;
      }
    }
    const filtered = filterPurchasesByPeriod();
    if (filtered.length === 0) {
      showToast("Nenhuma compra encontrada neste período.", "warning");
      return;
    }
    setHistoryData(filtered);
    setHistoryStep('preview');
  };

  const handleHistoryPDF = () => {
    if (!historyData || historyData.length === 0) return;
    setIsGenerating(true);

    try {
      // @ts-ignore
      let jsPDF = window.jspdf?.jsPDF || window.jsPDF;
      if (!jsPDF) { showToast("PDF lib missing", "error"); return; }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      const colors = {
        brandDark: [16, 34, 23] as [number, number, number],
        brandAccent: [13, 191, 86] as [number, number, number],
        textPrimary: [30, 30, 30] as [number, number, number],
        textSecondary: [100, 100, 100] as [number, number, number],
        textOnDark: [255, 255, 255] as [number, number, number],
        greenDark: [16, 85, 45] as [number, number, number],
        green: [21, 128, 61] as [number, number, number],
        yellow: [161, 98, 7] as [number, number, number],
        bgAltRow: [245, 247, 250] as [number, number, number],
        bgFooter: [232, 236, 241] as [number, number, number],
        borderLight: [210, 218, 226] as [number, number, number],
      };

      const fmtCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const periodLabel = getHistoryPeriodLabel();

      // ── HEADER ──
      doc.setFillColor(...colors.brandDark);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setFillColor(...colors.brandAccent);
      doc.rect(0, 28, pageWidth, 1, 'F');

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.textOnDark);
      doc.text("Meu Dindin", margin, 12);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 220, 200);
      doc.text(`HISTÓRICO DE TERCEIROS  ·  ${periodLabel}`, margin, 19);

      doc.setFontSize(7.5);
      doc.setTextColor(...colors.textOnDark);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 12, { align: 'right' });

      let currentY = 36;

      // ── SUMMARY CARDS ──
      doc.setFillColor(...colors.brandAccent);
      doc.rect(margin, currentY - 1, 2.5, 6, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.brandDark);
      doc.text("Resumo do Período", margin + 5, currentY + 3.5);
      currentY += 9;

      const totalAmount = historyData.reduce((acc, p) => acc + p.amount, 0);
      const totalInstValue = historyData.reduce((acc, p) => acc + p.installmentValue, 0);
      const totalPaid = historyData.filter(p => p.isPaid).length;
      const totalPending = historyData.length - totalPaid;

      const cw = (contentWidth - 6) / 3;
      const ch = 16;

      // Card 1: TOTAL (Soma das parcelas a receber no período)
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(margin, currentY, cw, ch, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.greenDark);
      doc.text("TOTAL", margin + 3, currentY + 5);
      doc.setFontSize(9);
      doc.text(fmtCurrency(totalInstValue), margin + 3, currentY + 12);

      // Card 2: QUITADAS
      const c2 = margin + cw + 3;
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(c2, currentY, cw, ch, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...colors.green);
      doc.text("QUITADAS", c2 + 3, currentY + 5);
      doc.setFontSize(10);
      doc.text(String(totalPaid), c2 + 3, currentY + 12);

      // Card 3: PENDENTES
      const c3 = c2 + cw + 3;
      doc.setFillColor(254, 249, 195);
      doc.roundedRect(c3, currentY, cw, ch, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...colors.yellow);
      doc.text("PENDENTES", c3 + 3, currentY + 5);
      doc.setFontSize(10);
      doc.text(String(totalPending), c3 + 3, currentY + 12);

      currentY += ch + 8;

      // ── TABLE ──
      doc.setFillColor(...colors.brandAccent);
      doc.rect(margin, currentY - 0.5, 2.5, 5.5, 'F');
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.brandDark);
      doc.text("Compras de Terceiros", margin + 5, currentY + 3.5);

      // @ts-ignore
      doc.autoTable({
        startY: currentY + 7,
        head: [['Nome', 'Item', 'Dt. Compra', 'Início Pag.', 'Parcelas', 'Valor Total', 'Vlr. Parcela', 'Status']],
        body: historyData.map((p: any) => [
          p.person_name || '-',
          p.item_name || '-',
          new Date(p.purchase_date + 'T12:00:00').toLocaleDateString('pt-BR'),
          p.start_payment_date ? new Date(p.start_payment_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-',
          `${p.installmentNumber || p.installments_paid}/${p.installments_total}`,
          fmtCurrency(p.amount),
          fmtCurrency(p.installmentValue),
          p.isFullyPaid ? 'Quitado' : p.isPaid ? 'Pago' : 'Pendente'
        ]),
        styles: {
          fontSize: 7,
          cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
          lineColor: colors.borderLight,
          lineWidth: 0.15,
          textColor: colors.textPrimary,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: colors.brandDark,
          textColor: colors.textOnDark,
          fontStyle: 'bold' as const,
          fontSize: 6.5,
          halign: 'left' as const,
          cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        },
        alternateRowStyles: { fillColor: colors.bgAltRow },
        columnStyles: {
          0: { fontStyle: 'bold' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' },
          7: { halign: 'center' },
        },
        foot: [['', '', '', '', '', 'Total', fmtCurrency(totalInstValue), '']],
        footStyles: {
          fillColor: colors.bgFooter,
          textColor: colors.brandDark,
          fontStyle: 'bold' as const,
          fontSize: 7,
          cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        },
        theme: 'striped' as const,
        margin: { left: margin, right: margin },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 7) {
            if (data.cell.raw === 'Quitado' || data.cell.raw === 'Pago') {
              data.cell.styles.textColor = [21, 128, 61];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [161, 98, 7];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      // ── FOOTER ──
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setDrawColor(...colors.borderLight);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.textSecondary);
        doc.text("Documento gerado automaticamente pelo Meu Dindin", margin, footerY);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
      }

      const suffix = historyPeriod === 'current' ? 'Mes_Atual' : historyPeriod === 'previous' ? 'Mes_Anterior' : 'Personalizado';
      doc.save(`MeuDindin_Terceiros_${suffix}.pdf`);
      showToast("PDF gerado com sucesso!", "success");
      setIsHistoryOpen(false);

    } catch (error: any) {
      console.error(error);
      showToast("Erro ao gerar PDF", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[#111814] dark:text-white text-[24px]">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Compra de Terceiros</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={openHistory}
              className="flex size-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark text-[#111814] dark:text-white border border-gray-200 dark:border-white/10 shadow-sm hover:border-primary dark:hover:border-primary transition-all"
              title="Histórico"
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
            </button>
            <Link to="/wallet/register" className="flex size-10 items-center justify-center rounded-full bg-primary text-[#102217] shadow-lg hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-[24px]">add</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6">
        {/* Filters */}
        <section className="flex gap-3">
          <CustomSelect
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(Number(val))}
            options={months.map((m, i) => ({ value: i, label: m }))}
            icon="calendar_month"
            className="flex-1"
            minWidth=""
          />
          <CustomSelect
            value={selectedYear}
            onChange={(val) => setSelectedYear(Number(val))}
            options={years.map(y => ({ value: y, label: String(y) }))}
            minWidth="min-w-[90px]"
          />
        </section>

        {/* Total Card */}
        <section>
          <div className="w-full bg-[#111814] dark:bg-surface-dark rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
            <div className="relative z-10 flex justify-between items-end">
              <div className="flex flex-col gap-1">
                {/* WCAG: #a8f0c8 sobre #111814 = ~7.8:1 ✅ */}
                <span className="text-[#a8f0c8] text-xs font-semibold uppercase tracking-widest">Total a Receber</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(totalReceivable)}</h2>
              </div>
              <div className="bg-primary/20 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary text-[28px]">account_balance_wallet</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section>
          <div className="group flex w-full items-center rounded-xl bg-white dark:bg-surface-dark border border-transparent focus-within:border-primary/50 shadow-sm transition-all h-12">
            <div className="pl-4 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none text-base text-[#111814] dark:text-white placeholder:text-gray-400 focus:ring-0 px-3 h-full rounded-xl outline-none"
              placeholder="Buscar por nome..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-[#111814] dark:text-white">Compras Recentes</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : activePurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma compra para este mês.</div>
          ) : (
            activePurchases.map((item) => (
              <article key={item.id} className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden transition-all">
                <div className="flex gap-4 mb-3">
                  <div className="relative shrink-0">
                    <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 text-primary-dark dark:text-primary font-bold text-xl">
                      {item.person_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex justify-between items-start w-full">
                      <div className="overflow-hidden">
                        <h4 className="text-base font-bold text-[#111814] dark:text-white leading-tight truncate">{item.person_name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{item.item_name}</p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Total: {formatCurrency(item.amount)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        {/* WCAG: emerald-700 sobre white = ~5.8:1 ✅ */}
                        <span className="block text-emerald-700 dark:text-primary font-bold text-lg">{formatCurrency(item.installmentValue)}</span>
                        {item.isPaidThisMonth || item.isFullyPaid ? (
                          <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800 dark:text-primary bg-primary/10 px-1.5 py-0.5 rounded-md inline-block mt-1">Pago</span>
                        ) : (
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md inline-block mt-1">Pendente</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress & Actions */}
                <div className="bg-background-light dark:bg-black/20 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex flex-col w-full pr-4">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mb-1">Parcelas ({item.installments_paid}/{item.installments_total})</span>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(item.progressPercent, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-[#111814] dark:text-gray-200">
                        {item.installmentNumber}/{item.installments_total}
                      </span>
                    </div>
                  </div>
                  <div className="h-px w-full bg-gray-200 dark:bg-white/10 my-1"></div>

                  <div className="flex items-center justify-between gap-3 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer group/check">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isPaidThisMonth}
                          onChange={() => handleTogglePaid(item.id, item.installments_paid, item.installments_total, item.isPaidThisMonth)}
                          className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 checked:bg-primary checked:border-primary transition-all"
                        />
                        {/* WCAG: checkmark #0a2018 sobre primary = ~8.1:1 ✅ */}
                        <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0a2018] opacity-0 peer-checked:opacity-100 pointer-events-none text-[14px]">check</span>
                      </div>
                      {/* WCAG: emerald-700 = ~5.8:1 ✅ */}
                      <span className={`text-xs font-semibold transition-colors select-none ${item.isPaidThisMonth ? 'text-emerald-700 dark:text-primary' : 'text-gray-500 group-hover/check:text-emerald-700 dark:group-hover/check:text-primary'}`}>
                        {item.isPaidThisMonth ? 'Pago' : 'Marcar como Pago'}
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#111814] dark:hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        <span className="hidden sm:inline">Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {/* ═══ HISTORY REPORT MODAL ═══ */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[70] bg-[#f5f8f7] dark:bg-[#102217] overflow-y-auto">
          <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl bg-[#f5f8f7] dark:bg-[#102217]">

            {/* Modal Header */}
            <header className="flex items-center bg-white dark:bg-[#1c2e24] p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 transition-colors">
              <button
                onClick={() => {
                  if (historyStep === 'preview') { setHistoryStep('filter'); }
                  else { setIsHistoryOpen(false); }
                }}
                className="text-gray-900 dark:text-gray-100 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
              </button>
              <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                {historyStep === 'filter' ? 'Histórico de Terceiros' : 'Pré-visualizar Relatório'}
              </h2>
            </header>

            {/* FILTER STEP */}
            {historyStep === 'filter' && (
              <main className="flex-1 p-6 flex flex-col">
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-full mb-3 text-emerald-700 dark:text-primary">
                    <span className="material-symbols-outlined text-3xl">history</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1">Selecione o Período</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Escolha o período para gerar o relatório.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {(['current', 'previous', 'custom'] as const).map((p) => (
                    <label
                      key={p}
                      className={`group relative flex items-center justify-between p-4 bg-white dark:bg-[#1c2e24] rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${
                        historyPeriod === p ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30' : 'border-transparent hover:border-emerald-300/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center rounded-xl size-10 transition-colors ${
                          historyPeriod === p ? 'bg-emerald-600 dark:bg-primary text-white dark:text-[#0a2018]' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {p === 'current' ? 'event_available' : p === 'previous' ? 'history' : 'date_range'}
                          </span>
                        </div>
                        <span className={`font-bold transition-colors ${
                          historyPeriod === p ? 'text-emerald-800 dark:text-primary' : 'text-gray-900 dark:text-white'
                        }`}>
                          {p === 'current' ? 'Mês Atual' : p === 'previous' ? 'Mês Anterior' : 'Data Personalizada'}
                        </span>
                      </div>
                      <input
                        className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500 focus:ring-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 accent-emerald-600"
                        name="history_period"
                        type="radio"
                        value={p}
                        checked={historyPeriod === p}
                        onChange={() => setHistoryPeriod(p)}
                      />
                    </label>
                  ))}
                </div>

                {/* Custom date pickers */}
                {historyPeriod === 'custom' && (
                  <div className="mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-gray-700 dark:text-gray-300 text-sm font-bold ml-1">Data Início</span>
                      <CustomDatePicker
                        value={customDateFrom}
                        onChange={(val) => setCustomDateFrom(val)}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-gray-700 dark:text-gray-300 text-sm font-bold ml-1">Data Fim</span>
                      <CustomDatePicker
                        value={customDateTo}
                        onChange={(val) => setCustomDateTo(val)}
                      />
                    </label>
                  </div>
                )}

                <div className="mt-auto pt-8 pb-4">
                  <button
                    onClick={handleHistoryPreview}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-primary dark:hover:brightness-110 text-white dark:text-[#102217] font-bold text-lg shadow-lg shadow-emerald-700/20 transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                    Visualizar Relatório
                  </button>
                </div>
              </main>
            )}

            {/* PREVIEW STEP */}
            {historyStep === 'preview' && historyData && (
              <main className="flex-1 p-4 bg-[#f5f8f7] overflow-y-auto">
                <div className="bg-white text-gray-900 rounded-lg shadow-lg p-5 w-full text-[12px] leading-relaxed relative border-t-8 border-emerald-600 mb-6">

                  {/* Preview Header */}
                  <div className="border-b-2 border-gray-100 mb-4 pb-3 flex justify-between items-end">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight">Meu Dindin</h1>
                      <p className="text-gray-500 uppercase tracking-widest text-[10px] mt-0.5 font-bold">Histórico de Terceiros</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                        <span>{getHistoryPeriodLabel()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-[10px]">Gerado em</p>
                      <p className="font-bold text-sm">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-emerald-50/80 rounded-md p-2">
                      <span className="text-[9px] text-emerald-800 font-bold uppercase">Total</span>
                      <p className="text-[11px] font-bold text-emerald-950">{formatCurrency(historyData.reduce((a, p) => a + p.installmentValue, 0))}</p>
                    </div>
                    <div className="bg-green-50 rounded-md p-2">
                      <span className="text-[9px] text-green-700 font-bold uppercase">Quitadas</span>
                      <p className="text-[11px] font-bold text-green-700">{historyData.filter(p => p.isPaid).length}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-md p-2">
                      <span className="text-[9px] text-yellow-700 font-bold uppercase">Pendentes</span>
                      <p className="text-[11px] font-bold text-yellow-700">{historyData.filter(p => !p.isPaid).length}</p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-1.5 px-1 font-bold text-gray-400 uppercase text-[9px]">Nome</th>
                          <th className="py-1.5 px-1 font-bold text-gray-400 uppercase text-[9px]">Item</th>
                          <th className="py-1.5 px-1 font-bold text-gray-400 uppercase text-[9px]">Parcelas</th>
                          <th className="py-1.5 px-1 font-bold text-gray-400 uppercase text-[9px] text-right">Vlr. Parcela</th>
                          <th className="py-1.5 px-1 font-bold text-gray-400 uppercase text-[9px] text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-[11px]">
                        {historyData.map((p: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1.5 px-1 font-bold text-emerald-900">{p.person_name}</td>
                            <td className="py-1.5 px-1 text-gray-600 truncate max-w-[100px]">{p.item_name}</td>
                            <td className="py-1.5 px-1 text-gray-900 font-bold">{p.installmentNumber || p.installments_paid}/{p.installments_total}</td>
                            <td className="py-1.5 px-1 text-gray-900 font-bold text-right">{formatCurrency(p.installmentValue)}</td>
                            <td className="py-1.5 px-1 text-center">
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${p.isFullyPaid ? 'text-emerald-700 bg-emerald-50' : p.isPaid ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50'}`}>
                                {p.isFullyPaid ? 'Quitado' : p.isPaid ? 'Pago' : 'Pendente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold">
                        <tr>
                          <td className="py-1.5 px-1 text-right text-gray-500 uppercase text-[10px]" colSpan={3}>Total</td>
                          <td className="py-1.5 px-1 text-right text-emerald-900">{formatCurrency(historyData.reduce((a, p) => a + p.installmentValue, 0))}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-6 pt-3 border-t border-gray-100 text-center">
                    <p className="text-[9px] text-gray-400">Documento gerado automaticamente pelo Meu Dindin.</p>
                  </div>
                </div>

                {/* Generate PDF Button */}
                <div className="mt-4 mb-8 flex justify-center pb-8">
                  <button
                    onClick={handleHistoryPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-[#111814] dark:bg-primary text-white dark:text-[#102217] px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[20px]">{isGenerating ? 'hourglass_empty' : 'print'}</span>
                    {isGenerating ? 'Gerando...' : 'Imprimir / Salvar PDF'}
                  </button>
                </div>
              </main>
            )}

            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                <div className="bg-white dark:bg-[#1c2e24] p-4 rounded-xl shadow-xl flex items-center gap-3">
                  <span className="size-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                  <span className="font-bold text-gray-900 dark:text-white">Gerando Relatório...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;