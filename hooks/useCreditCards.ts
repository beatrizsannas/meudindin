
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface CreditCard {
    id: string;
    user_id: string;
    name: string;
    limit: number;
    due_day: number;
    usage_rating: number;
    created_at: string;
}

export const useCreditCards = (userId: string | undefined) => {
    const queryClient = useQueryClient();

    const fetchCreditCards = async () => {
        if (!userId) return [];

        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as CreditCard[];
    };

    const { data: cards, isLoading, error } = useQuery({
        queryKey: ['credit_cards', userId],
        queryFn: fetchCreditCards,
        enabled: !!userId,
    });

    const addCard = useMutation({
        mutationFn: async (newCard: Omit<CreditCard, 'id' | 'created_at' | 'user_id'>) => {
            const { data, error } = await supabase
                .from('credit_cards')
                .insert([{ ...newCard, user_id: userId }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credit_cards', userId] });
        },
    });

    const updateCard = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<CreditCard> & { id: string }) => {
            const { data, error } = await supabase
                .from('credit_cards')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credit_cards', userId] });
        },
    });

    const deleteCard = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('credit_cards')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credit_cards', userId] });
        },
    });

    return {
        cards,
        isLoading,
        error,
        addCard,
        updateCard,
        deleteCard,
    };
};
