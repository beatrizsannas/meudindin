import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface Purchase {
    id: string;
    person_name: string;
    item_name: string;
    amount: number;
    installments_total: number;
    installments_paid: number;
    start_payment_date: string;
    is_paid: boolean;
    purchase_date: string;
    avatar_url?: string;
    user_id?: string;
}

export const useThirdPartyPurchases = () => {
    return useQuery({
        queryKey: ['third-party-purchases'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('third_party_purchases')
                .select('*');

            if (error) throw error;
            return data as Purchase[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
