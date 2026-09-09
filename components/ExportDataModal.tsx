import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ExportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onClose }) => {
    const { session } = useAuth();
    const { showToast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    // State for multi-step flow - Moved to top to avoid Rules of Hooks violation
    const [step, setStep] = useState<'initial' | 'filter' | 'preview'>('initial');
    const [filterPeriod, setFilterPeriod] = useState<'current' | 'previous' | 'last_3'>('current');
    const [categories, setCategories] = useState<any[]>([]);
    const [processedData, setProcessedData] = useState<any>(null);

    // Reset step when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setStep('initial');
            setFilterPeriod('current');
            setProcessedData(null);
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('id, name, type');
        if (data) setCategories(data);
    };

    if (!isOpen) return null;

    const isVehicleExpense = (categoryName: string) => {
        if (!categoryName) return false;
        const lower = categoryName.toLowerCase();
        return lower.includes('veículo') ||
            lower.includes('carro') ||
            lower.includes('moto') ||
            lower.includes('combustível') ||
            lower.includes('manutenção') ||
            lower.includes('ipva') ||
            lower.includes('licenciamento') ||
            lower.includes('oficina') ||
            lower.includes('peças');
    };

    const fetchData = async () => {
        if (!session?.user) return null;

        try {
            // Fetch Transactions (Income and Expenses)
            const { data: transactions, error: tError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', session.user.id)
                .order('date', { ascending: false });

            if (tError) throw tError;

            // Fetch Third Party Purchases
            const { data: thirdParty, error: tpError } = await supabase
                .from('third_party_purchases')
                .select('*')
                .eq('user_id', session.user.id)
                .order('purchase_date', { ascending: false });

            if (tpError) throw tpError;

            return { transactions: transactions || [], thirdParty: thirdParty || [] };
        } catch (error) {
            console.error("Error fetching data for export:", error);
            showToast("Erro ao buscar dados para exportação.", "error");
            return null;
        }
    };

    // Helper function to filter data by date
    const filterByPeriod = (items: any[], period: string) => {
        if (!items || items.length === 0) return [];

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        return items.filter(item => {
            // Check for date or purchase_date (for third party)
            const dateStr = item.date || item.purchase_date;
            if (!dateStr) return false;

            const itemDate = new Date(dateStr + 'T12:00:00');

            if (period === 'current') {
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            }

            if (period === 'previous') {
                const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
                return itemDate.getMonth() === prevMonthDate.getMonth() && itemDate.getFullYear() === prevMonthDate.getFullYear();
            }

            if (period === 'last_3') {
                const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
                const endOfCurrent = new Date(currentYear, currentMonth + 1, 0);
                return itemDate >= threeMonthsAgo && itemDate <= endOfCurrent;
            }

            return true;
        });
    };

    // Helper: get the list of months covered by a filter period
    const getMonthsForPeriod = (period: string): { month: number; year: number }[] => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        if (period === 'current') {
            return [{ month: currentMonth, year: currentYear }];
        }
        if (period === 'previous') {
            const d = new Date(currentYear, currentMonth - 1, 1);
            return [{ month: d.getMonth(), year: d.getFullYear() }];
        }
        if (period === 'last_3') {
            const result: { month: number; year: number }[] = [];
            for (let i = 2; i >= 0; i--) {
                const d = new Date(currentYear, currentMonth - i, 1);
                result.push({ month: d.getMonth(), year: d.getFullYear() });
            }
            return result;
        }
        return [{ month: currentMonth, year: currentYear }];
    };

    // Helper: filter third-party purchases by active installments in a period
    // This mirrors the logic in Wallet.tsx's getInstallmentDetails
    const filterThirdPartyByActiveInstallments = (purchases: any[], period: string) => {
        const periodMonths = getMonthsForPeriod(period);
        const result: any[] = [];

        purchases.forEach(purchase => {
            const startParts = (purchase.start_payment_date || purchase.purchase_date || '').split('-');
            if (startParts.length < 2) return;
            const startYear = parseInt(startParts[0]);
            const startMonth = parseInt(startParts[1]) - 1; // 0-indexed

            // Check if any month in the period has an active installment
            for (const { month, year } of periodMonths) {
                const diffMonths = (year - startYear) * 12 + (month - startMonth);
                const installmentNumber = diffMonths + 1;

                if (installmentNumber >= 1 && installmentNumber <= purchase.installments_total) {
                    const installmentValue = purchase.amount / purchase.installments_total;
                    const isPaidThisMonth = installmentNumber <= purchase.installments_paid;

                    result.push({
                        ...purchase,
                        installmentNumber,
                        installmentValue,
                        isPaidThisMonth,
                        displayMonth: month,
                        displayYear: year,
                    });
                    break; // Avoid duplicate entries for the same purchase across months
                }
            }
        });

        return result;
    };

    const handlePreview = async () => {
        setProcessedData(null);
        setIsExporting(true); // Reuse loading state

        const rawData = await fetchData();
        if (!rawData) {
            setIsExporting(false);
            return;
        }

        // 1. Filter transactions by date
        const filteredTransactions = filterByPeriod(rawData.transactions, filterPeriod);

        // 2. Filter third-party by active installments (same logic as Wallet.tsx)
        const filteredThirdParty = filterThirdPartyByActiveInstallments(rawData.thirdParty, filterPeriod);

        if (filteredTransactions.length === 0 && filteredThirdParty.length === 0) {
            showToast("Nenhum dado encontrado para o período selecionado.", "warning");
            setIsExporting(false);
            return;
        }

        // 3. Categorize transactions
        const income: any[] = [];
        const expenses: any[] = [];
        const vehicleExpenses: any[] = [];

        // Create category lookup map
        const catMap = new Map(categories.map(c => [c.id, c.name]));

        filteredTransactions.forEach(t => {
            let catName = t.category;
            if (t.category_id && catMap.has(t.category_id)) {
                catName = catMap.get(t.category_id);
            }
            if (!catName) catName = 'Outros';

            const enriched = { ...t, categoryName: catName };

            if (t.type === 'income') {
                income.push(enriched);
            } else {
                if (isVehicleExpense(catName)) {
                    vehicleExpenses.push(enriched);
                } else {
                    expenses.push(enriched);
                }
            }
        });

        // 4. Calculate Totals
        const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);
        const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
        const totalVehicle = vehicleExpenses.reduce((acc, t) => acc + t.amount, 0);
        // Use installment value (per-month amount) instead of full purchase amount
        const totalThirdParty = filteredThirdParty.reduce((acc: number, t: any) => acc + (t.installmentValue || t.amount), 0);

        const summaryTotalExpenses = totalExpenses + totalVehicle;
        const balance = totalIncome - summaryTotalExpenses;

        setProcessedData({
            income,
            expenses,
            vehicleExpenses,
            thirdParty: filteredThirdParty,
            totals: {
                income: totalIncome,
                generalExpenses: totalExpenses,
                vehicle: totalVehicle,
                thirdParty: totalThirdParty,
                summaryExpenses: summaryTotalExpenses,
                balance
            },
            periodLabel: filterPeriod === 'current' ? 'Mês Atual' : filterPeriod === 'previous' ? 'Mês Anterior' : 'Últimos 3 Meses'
        });

        setIsExporting(false);
        setStep('preview');
    };

    const handleGeneratePDF = () => {
        if (!processedData) return;
        setIsExporting(true);

        try {
            // @ts-ignore
            let jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) { showToast("PDF lib missing", "error"); return; }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;
            const contentWidth = pageWidth - margin * 2;

            // ACCESSIBLE COLOR PALETTE (WCAG AA+ compliant)
            const colors = {
                brandDark: [16, 34, 23] as [number, number, number],
                brandAccent: [13, 191, 86] as [number, number, number],
                textPrimary: [30, 30, 30] as [number, number, number],
                textSecondary: [100, 100, 100] as [number, number, number],
                textOnDark: [255, 255, 255] as [number, number, number],
                sectionExpense: [185, 28, 28] as [number, number, number],
                sectionIncome: [21, 128, 61] as [number, number, number],
                sectionVehicle: [180, 83, 9] as [number, number, number],
                sectionThirdParty: [109, 40, 180] as [number, number, number],
                headerExpense: [153, 27, 27] as [number, number, number],
                headerIncome: [20, 83, 45] as [number, number, number],
                headerVehicle: [146, 64, 14] as [number, number, number],
                headerThirdParty: [88, 28, 135] as [number, number, number],
                bgAltRow: [245, 247, 250] as [number, number, number],
                bgFooter: [232, 236, 241] as [number, number, number],
                borderLight: [210, 218, 226] as [number, number, number],
            };

            const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            // ── HEADER BAR (compact) ──
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
            doc.text(`RELATÓRIO FINANCEIRO  ·  ${processedData.periodLabel}`, margin, 19);

            doc.setFontSize(7.5);
            doc.setTextColor(...colors.textOnDark);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 12, { align: 'right' });

            let currentY = 36;

            // ── SUMÁRIO GERAL (compact inline) ──
            doc.setFillColor(...colors.brandAccent);
            doc.rect(margin, currentY - 1, 2.5, 6, 'F');
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...colors.textPrimary);
            doc.text("Sumário Geral", margin + 5, currentY + 3.5);
            currentY += 9;

            const cardWidth = (contentWidth - 6) / 3;
            const cardHeight = 16;

            // Receitas card
            doc.setFillColor(236, 253, 245);
            doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...colors.sectionIncome);
            doc.text("RECEITAS", margin + 4, currentY + 5.5);
            doc.setFontSize(10);
            doc.text(formatCurrency(processedData.totals.income), margin + 4, currentY + 12.5);

            // Despesas card
            const card2X = margin + cardWidth + 3;
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...colors.sectionExpense);
            doc.text("DESPESAS", card2X + 4, currentY + 5.5);
            doc.setFontSize(10);
            doc.text(formatCurrency(processedData.totals.summaryExpenses), card2X + 4, currentY + 12.5);

            // Saldo card
            const card3X = card2X + cardWidth + 3;
            const balancePositive = processedData.totals.balance >= 0;
            doc.setFillColor(balancePositive ? 236 : 254, balancePositive ? 253 : 242, balancePositive ? 245 : 242);
            doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...colors.textSecondary);
            doc.text("SALDO", card3X + 4, currentY + 5.5);
            doc.setFontSize(10);
            doc.setTextColor(balancePositive ? 21 : 185, balancePositive ? 128 : 28, balancePositive ? 61 : 28);
            doc.text(formatCurrency(processedData.totals.balance), card3X + 4, currentY + 12.5);

            currentY += cardHeight + 8;

            // ── COMMON TABLE STYLES (compact) ──
            const commonStyles = {
                styles: {
                    fontSize: 7.5,
                    cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
                    lineColor: colors.borderLight,
                    lineWidth: 0.15,
                    textColor: colors.textPrimary,
                    font: 'helvetica',
                },
                headStyles: {
                    fillColor: colors.headerExpense,
                    textColor: colors.textOnDark,
                    fontStyle: 'bold' as const,
                    fontSize: 7,
                    halign: 'left' as const,
                    cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                },
                alternateRowStyles: {
                    fillColor: colors.bgAltRow,
                },
                footStyles: {
                    fillColor: colors.bgFooter,
                    textColor: colors.textPrimary,
                    fontStyle: 'bold' as const,
                    fontSize: 7.5,
                    cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                },
                theme: 'striped' as const,
                margin: { left: margin, right: margin },
                tableLineColor: colors.borderLight,
                tableLineWidth: 0,
            };

            // Helper: compact section title
            const drawSectionTitle = (title: string, color: [number, number, number], y: number) => {
                doc.setFillColor(...color);
                doc.rect(margin, y - 0.5, 2.5, 5.5, 'F');
                doc.setFontSize(8.5);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...color);
                doc.text(title, margin + 5, y + 3.5);
            };

            // ── 2. DESPESAS ──
            if (processedData.expenses.length > 0) {
                drawSectionTitle("Despesas", colors.sectionExpense, currentY);
                // @ts-ignore
                doc.autoTable({
                    ...commonStyles,
                    startY: currentY + 7,
                    head: [['Data', 'Descrição', 'Categoria', 'Valor']],
                    body: processedData.expenses.map((t: any) => [
                        new Date(t.date).toLocaleDateString('pt-BR').slice(0, 5),
                        t.description,
                        t.categoryName,
                        formatCurrency(t.amount)
                    ]),
                    headStyles: { ...commonStyles.headStyles, fillColor: colors.headerExpense },
                    columnStyles: {
                        0: { cellWidth: 18 },
                        3: { halign: 'right', fontStyle: 'bold' },
                    },
                    foot: [['', '', 'Total Despesas', formatCurrency(processedData.totals.generalExpenses)]],
                    footStyles: { ...commonStyles.footStyles, textColor: colors.sectionExpense },
                });
                // @ts-ignore
                currentY = doc.lastAutoTable.finalY + 8;
            }

            // ── 3. RECEITAS ──
            if (processedData.income.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                drawSectionTitle("Receitas", colors.sectionIncome, currentY);
                // @ts-ignore
                doc.autoTable({
                    ...commonStyles,
                    startY: currentY + 7,
                    head: [['Data', 'Descrição', 'Valor']],
                    body: processedData.income.map((t: any) => [
                        new Date(t.date).toLocaleDateString('pt-BR').slice(0, 5),
                        t.description,
                        formatCurrency(t.amount)
                    ]),
                    headStyles: { ...commonStyles.headStyles, fillColor: colors.headerIncome },
                    columnStyles: {
                        0: { cellWidth: 18 },
                        2: { halign: 'right', fontStyle: 'bold' },
                    },
                    foot: [['', 'Total Receitas', formatCurrency(processedData.totals.income)]],
                    footStyles: { ...commonStyles.footStyles, textColor: colors.sectionIncome },
                });
                // @ts-ignore
                currentY = doc.lastAutoTable.finalY + 8;
            }

            // ── 4. VEÍCULO ──
            if (processedData.vehicleExpenses.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                drawSectionTitle("Custos do Veículo", colors.sectionVehicle, currentY);
                // @ts-ignore
                doc.autoTable({
                    ...commonStyles,
                    startY: currentY + 7,
                    head: [['Data', 'Descrição', 'Tipo', 'Valor']],
                    body: processedData.vehicleExpenses.map((t: any) => [
                        new Date(t.date).toLocaleDateString('pt-BR').slice(0, 5),
                        t.description,
                        t.categoryName,
                        formatCurrency(t.amount)
                    ]),
                    headStyles: { ...commonStyles.headStyles, fillColor: colors.headerVehicle },
                    columnStyles: {
                        0: { cellWidth: 18 },
                        3: { halign: 'right', fontStyle: 'bold' },
                    },
                    foot: [['', '', 'Total Veículo', formatCurrency(processedData.totals.vehicle)]],
                    footStyles: { ...commonStyles.footStyles, textColor: colors.sectionVehicle },
                });
                // @ts-ignore
                currentY = doc.lastAutoTable.finalY + 8;
            }

            // ── 5. TERCEIROS ──
            if (processedData.thirdParty.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                drawSectionTitle("Compras de Terceiros", colors.sectionThirdParty, currentY);
                // @ts-ignore
                doc.autoTable({
                    ...commonStyles,
                    startY: currentY + 7,
                    head: [['Nome', 'Dt. Compra', 'Início Pag.', 'Parcelas', 'Valor']],
                    body: processedData.thirdParty.map((t: any) => [
                        t.person_name || 'Desconhecido',
                        new Date(t.purchase_date).toLocaleDateString('pt-BR'),
                        t.start_payment_date ? new Date(t.start_payment_date).toLocaleDateString('pt-BR') : '-',
                        `${t.installments_paid}/${t.installments_total}`,
                        formatCurrency(t.installmentValue || t.amount)
                    ]),
                    headStyles: { ...commonStyles.headStyles, fillColor: colors.headerThirdParty },
                    columnStyles: {
                        0: { fontStyle: 'bold' },
                        4: { halign: 'right', fontStyle: 'bold' },
                    },
                    foot: [['', '', '', 'Total a Receber', formatCurrency(processedData.totals.thirdParty)]],
                    footStyles: { ...commonStyles.footStyles, textColor: colors.sectionThirdParty },
                });
            }

            // ═══════════════════════════════════════════════════
            // FOOTER
            // ═══════════════════════════════════════════════════
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                const footerY = doc.internal.pageSize.getHeight() - 10;
                // Footer line
                doc.setDrawColor(...colors.borderLight);
                doc.setLineWidth(0.3);
                doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
                // Footer text
                doc.setFontSize(7.5);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(...colors.textSecondary);
                doc.text("Documento gerado automaticamente pelo Meu Dindin", margin, footerY);
                doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
            }

            const periodName = filterPeriod === 'current' ? 'Mes_Atual' : filterPeriod === 'previous' ? 'Mes_Anterior' : 'Ultimos_3_Meses';
            doc.save(`MeuDindin_Relatorio_${periodName}.pdf`);
            showToast("PDF gerado com sucesso!", "success");
            onClose();

        } catch (error: any) {
            console.error(error);
            showToast("Erro ao gerar PDF", "error");
        } finally {
            setIsExporting(false);
        }
    };

    const handleBack = () => {
        if (step === 'preview') {
            setStep('filter');
        } else if (step === 'filter') {
            setStep('initial');
        } else {
            onClose();
        }
    };

    // Use hardcoded colors to avoid issues with missing Tailwind config
    const overlayClasses = "fixed inset-0 z-[70] bg-[#f5f8f7] dark:bg-[#102217] overflow-y-auto";
    const containerClasses = "relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl bg-[#f5f8f7] dark:bg-[#102217]";
    const headerClasses = "flex items-center bg-background-light dark:bg-[#1c2e24] p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 transition-colors";

    const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className={overlayClasses}>
            <div className={containerClasses}>

                {/* Header is Step Dependent */}
                <header className={headerClasses}>
                    <button
                        onClick={handleBack}
                        className="text-gray-900 dark:text-gray-100 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                        {step === 'initial' ? 'Compartilhar Dados' : step === 'filter' ? 'Exportar PDF' : 'Pré-visualizar PDF'}
                    </h2>
                </header>

                {/* Step 1: Initial Share Screen */}
                {step === 'initial' && (
                    <main className="flex-1 p-4 flex flex-col pt-6">
                        <div className="mb-8 px-2 text-center">
                            <div className="inline-flex items-center justify-center p-4 bg-[#228b3b]/10 dark:bg-[#228b3b]/20 rounded-full mb-4 text-[#1b6d2f] dark:text-[#228b3b]">
                                <span className="material-symbols-outlined text-4xl">share</span>
                            </div>
                            <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-2">Exportar Relatórios</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                Exporte o histórico financeiro do seu fluxo de caixa, veículos e cartões.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => setStep('filter')}
                                className="group relative flex items-center gap-4 p-5 w-full bg-background-light dark:bg-[#1c2e24] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-red-500 dark:hover:border-red-500 transition-all duration-300 active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 shrink-0 size-14 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                                    <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                                </div>
                                <div className="flex flex-col items-start flex-1 text-left">
                                    <span className="text-gray-900 dark:text-white text-lg font-bold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Gerar PDF</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Relatório para impressão (.pdf)</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">download</span>
                            </button>
                        </div>
                    </main>
                )}

                {/* Step 2: Filter Screen */}
                {step === 'filter' && (
                    <main className="flex-1 p-6 flex flex-col">
                        <div className="mb-8 text-center">
                            <div className="inline-flex items-center justify-center p-4 bg-[#228b3b]/10 dark:bg-[#228b3b]/20 rounded-full mb-4 text-[#1b6d2f] dark:text-[#228b3b]">
                                <span className="material-symbols-outlined text-4xl">calendar_month</span>
                            </div>
                            <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-2">Selecione o Período</h3>
                        </div>

                        <div className="flex flex-col gap-4">
                            {['current', 'previous', 'last_3'].map((p) => (
                                <label key={p} className={`group relative flex items-center justify-between p-4 bg-background-light dark:bg-[#1c2e24] rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${filterPeriod === p ? 'border-[#228b3b] bg-[#228b3b]/5 dark:bg-[#228b3b]/10' : 'border-transparent hover:border-[#228b3b]/30'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center justify-center rounded-xl size-10 transition-colors ${filterPeriod === p ? 'bg-[#228b3b] text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                                            <span className="material-symbols-outlined text-[20px]">
                                                {p === 'current' ? 'event_available' : p === 'previous' ? 'history' : 'date_range'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-bold transition-colors ${filterPeriod === p ? 'text-[#1b6d2f] dark:text-[#228b3b]' : 'text-gray-900 dark:text-white'}`}>
                                                {p === 'current' ? 'Mês Atual' : p === 'previous' ? 'Mês Anterior' : 'Últimos 3 Meses'}
                                            </span>
                                        </div>
                                    </div>
                                    <input
                                        className="w-5 h-5 text-[#228b3b] border-gray-300 focus:ring-[#228b3b] focus:ring-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
                                        name="filter_period"
                                        type="radio"
                                        value={p}
                                        checked={filterPeriod === p}
                                        onChange={() => setFilterPeriod(p as any)}
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="mt-auto pt-10 pb-4 flex flex-col gap-3">
                            <button
                                onClick={handlePreview}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-[#228b3b] hover:bg-[#1b6d2f] text-black font-bold text-lg shadow-lg shadow-[#228b3b]/20 transition-all active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-[24px]">visibility</span>
                                Visualizar Relatório
                            </button>
                        </div>
                    </main>
                )}

                {/* Step 3: Preview Screen (Matches the User's HTML Structure) */}
                {step === 'preview' && processedData && (
                    <main className="flex-1 p-4 bg-[#f5f8f7] overflow-y-auto">
                        <div className="bg-background-light text-gray-900 rounded-lg shadow-lg p-5 w-full text-[12px] leading-relaxed relative border-t-8 border-[#228b3b] mb-6">

                            {/* PDF Header */}
                            <div className="border-b-2 border-gray-100 mb-6 pb-4 flex justify-between items-end">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meu Dindin</h1>
                                    <p className="text-gray-500 uppercase tracking-widest text-[10px] mt-1 font-bold">Relatório Financeiro</p>
                                    <div className="mt-2 inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                        <span>Período: {processedData.periodLabel}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400 text-[10px]">Gerado em</p>
                                    <p className="font-bold text-sm">{new Date().toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            {/* 1. Sumário Geral */}
                            <section className="mb-8">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-[#228b3b]"></span>
                                    1. Sumário Geral
                                </h3>
                                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-md border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 font-medium uppercase mb-1">Receitas</span>
                                        <span className="text-sm font-bold text-green-600">{formatBRL(processedData.totals.income)}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-gray-200 pl-2">
                                        <span className="text-[10px] text-gray-500 font-medium uppercase mb-1">Despesas</span>
                                        <span className="text-sm font-bold text-red-600">{formatBRL(processedData.totals.summaryExpenses)}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-gray-200 pl-2">
                                        <span className="text-[10px] text-gray-500 font-medium uppercase mb-1">Saldo</span>
                                        <span className="text-sm font-bold text-gray-900">{formatBRL(processedData.totals.balance)}</span>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Despesas */}
                            {processedData.expenses.length > 0 && (
                                <section className="mb-8">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-red-500"></span>
                                        2. Despesas
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
                                                {processedData.expenses.map((t: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-100">
                                                        <td className="py-2 px-1 text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR').slice(0, 5)}</td>
                                                        <td className="py-2 px-1 font-medium text-gray-900 truncate max-w-[120px]">{t.description}</td>
                                                        <td className="py-2 px-1 text-gray-500 truncate max-w-[80px]">{t.categoryName}</td>
                                                        <td className="py-2 px-1 text-red-600 font-bold text-right">{formatBRL(t.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-bold">
                                                <tr>
                                                    <td className="py-2 px-1 text-right text-gray-500 uppercase text-[10px]" colSpan={3}>Total Despesas</td>
                                                    <td className="py-2 px-1 text-right text-red-600">{formatBRL(processedData.totals.generalExpenses)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* 3. Receitas */}
                            {processedData.income.length > 0 && (
                                <section className="mb-8">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-green-500"></span>
                                        3. Receitas
                                    </h3>
                                    <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
                                        <table className="w-full text-left border-collapse min-w-[300px]">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Data</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Descrição</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px] text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-[11px]">
                                                {processedData.income.map((t: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-100">
                                                        <td className="py-2 px-1 text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR').slice(0, 5)}</td>
                                                        <td className="py-2 px-1 font-medium text-gray-900 truncate max-w-[150px]">{t.description}</td>
                                                        <td className="py-2 px-1 text-green-600 font-bold text-right">{formatBRL(t.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-bold">
                                                <tr>
                                                    <td className="py-2 px-1 text-right text-gray-500 uppercase text-[10px]" colSpan={2}>Total Receitas</td>
                                                    <td className="py-2 px-1 text-right text-green-600">{formatBRL(processedData.totals.income)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* 4. Custos do Veículo */}
                            {processedData.vehicleExpenses.length > 0 && (
                                <section className="mb-8">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-orange-500"></span>
                                        4. Custos do Veículo
                                    </h3>
                                    <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
                                        <table className="w-full text-left border-collapse min-w-[300px]">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Data</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Descrição</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Tipo</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px] text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-[11px]">
                                                {processedData.vehicleExpenses.map((t: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-100">
                                                        <td className="py-2 px-1 text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR').slice(0, 5)}</td>
                                                        <td className="py-2 px-1 font-medium text-gray-900 truncate max-w-[120px]">{t.description}</td>
                                                        <td className="py-2 px-1 text-gray-500 truncate max-w-[80px]">{t.categoryName}</td>
                                                        <td className="py-2 px-1 text-gray-900 text-right">{formatBRL(t.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-bold">
                                                <tr>
                                                    <td className="py-2 px-1 text-right text-gray-500 uppercase text-[10px]" colSpan={3}>Total Veículo</td>
                                                    <td className="py-2 px-1 text-right text-red-600">- {formatBRL(processedData.totals.vehicle)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* 5. Cartão de Terceiros */}
                            {processedData.thirdParty.length > 0 && (
                                <section className="mb-8">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-purple-500"></span>
                                        5. COMPRAS DE TERCEIROS
                                    </h3>
                                    <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
                                        <table className="w-full text-left border-collapse min-w-[400px]">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Nome</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">Dt. Compra</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px]">PARC. PAGAS</th>
                                                    <th className="py-2 px-1 font-bold text-gray-400 uppercase text-[10px] text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-[11px]">
                                                {processedData.thirdParty.map((t: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-100">
                                                        <td className="py-2 px-1 font-bold text-purple-700">{t.person_name || 'Desconhecido'}</td>
                                                        <td className="py-2 px-1 text-gray-500">{new Date(t.purchase_date).toLocaleDateString('pt-BR').slice(0, 5)}</td>
                                                        <td className="py-2 px-1 text-gray-900 font-bold">{t.installments_paid}/{t.installments_total}</td>
                                                        <td className="py-2 px-1 text-gray-900 text-right">{formatBRL(t.installmentValue || t.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-bold">
                                                <tr>
                                                    <td className="py-2 px-1 text-right text-gray-500 uppercase text-[10px]" colSpan={3}>Total a Receber</td>
                                                    <td className="py-2 px-1 text-right text-green-600">{formatBRL(processedData.totals.thirdParty)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </section>
                            )}

                            <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400">Documento gerado automaticamente pelo aplicativo Meu Dindin.</p>
                            </div>
                        </div>

                        <div className="mt-6 mb-8 flex justify-center pb-8">
                            <button
                                onClick={handleGeneratePDF}
                                className="flex items-center gap-2 bg-gray-900 dark:bg-[#228b3b] text-white dark:text-[#ffffff] px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform"
                            >
                                <span className="material-symbols-outlined text-[20px]">print</span>
                                Imprimir / Salvar PDF
                            </button>
                        </div>

                    </main>
                )}

                {/* Loading Overlay */}
                {isExporting && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <div className="bg-background-light dark:bg-[#1c2e24] p-4 rounded-xl shadow-xl flex items-center gap-3">
                            <span className="size-5 border-2 border-[#228b3b] border-t-transparent rounded-full animate-spin"></span>
                            <span className="font-bold text-gray-900 dark:text-white">Gerando Relatório...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default ExportDataModal;

