import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    created_at: string;
    account: string;
    category_id: string;
    category: {
        name: string;
        icon: string;
        color_theme: string;
    } | null;
    exclude_from_global?: boolean;
}

export const useTransactions = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['transactions', 'all', userId],
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from('transactions')
                .select(`
          id,
          description,
          amount,
          type,
          date,
          created_at,
          account,
          category_id,
          exclude_from_global,
          category:categories (
            name,
            icon,
            color_theme
          )
        `)
                .eq('user_id', userId)
                // .eq('exclude_from_global', false) // We might want all, and filter later?
                // Dashboard filters exclude_from_global=false.
                // Vehicle expenses might want to see them even if hidden global?
                // ThirdPartyCards sets exclude_from_global=!includeInExpenses.
                // It fetches ALL for that category regardless of flag?
                // The original ThirdPartyCards fetch: .eq('category_id', catId). No exclude filter.
                // So we should fetch ALL for the user, and let components filter.
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map data to ensure structure matches interface
            return data.map((t: any) => ({
                id: t.id,
                description: t.description,
                amount: t.amount,
                type: t.type,
                date: t.date,
                created_at: t.created_at,
                account: t.account,
                category_id: t.category_id,
                category: t.category,
                exclude_from_global: t.exclude_from_global
            })) as Transaction[];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useTransactionTotals = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['transactions', 'totals', userId],
        queryFn: async () => {
            if (!userId) return { income: 0, expense: 0, balance: 0 };

            // Fetch all income
            const { data: incomeData, error: incomeError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'income')
                .eq('exclude_from_global', false);

            if (incomeError) throw incomeError;

            // Fetch all expense
            const { data: expenseData, error: expenseError } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'expense')
                .eq('exclude_from_global', false);

            if (expenseError) throw expenseError;

            const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
            const totalExpense = expenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
            const balance = totalIncome - totalExpense;

            return {
                income: totalIncome,
                expense: totalExpense,
                balance
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
