import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
    full_name: string;
    avatar_url: string | null;
}

export const useUserProfile = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data as UserProfile;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 60, // 1 hour (profiles rarely change)
    });
};
