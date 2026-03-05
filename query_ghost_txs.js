import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users?.users?.length) {
        console.error("Auth Error (RLS likely blocking if anon key):", userError?.message);
        // fallback down to direct query if RLS allows anon select which it probably doesn't
    }

    let userId;
    if (users?.users?.length) {
        userId = users.users[0].id; // assuming she is the only/main user testing
    } else {
        // try to fetch any transaction just to get a user id
        const { data: anyTx } = await supabase.from('transactions').select('user_id').limit(1);
        if (anyTx && anyTx.length) userId = anyTx[0].user_id;
    }

    if (!userId) {
        console.log("Could not find user ID");
        return;
    }

    // Get all transactions
    const { data: txs, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error);
        return;
    }

    console.log(`\nFound ${txs.length} transactions Total.`);

    const feb = txs.filter(t => t.date.startsWith('2026-02') || t.date.startsWith('2024-02') || t.date.startsWith('2025-02'));
    const mar = txs.filter(t => t.date.startsWith('2026-03') || t.date.startsWith('2024-03') || t.date.startsWith('2025-03'));

    console.log("\n==== FEBRUARY TRANSACTIONS ====");
    feb.forEach(t => console.log(`${t.date} | ${t.description} | R$ ${t.amount} | Type: ${t.type} | ID: ${t.id} | Exclude: ${t.exclude_from_global}`));

    console.log("\n==== MARCH TRANSACTIONS ====");
    mar.forEach(t => console.log(`${t.date} | ${t.description} | R$ ${t.amount} | Type: ${t.type} | ID: ${t.id} | Exclude: ${t.exclude_from_global}`));

    console.log("\n==== ALL OTHER TRANSACTIONS RECENT ====");
    txs.slice(0, 5).forEach(t => console.log(`${t.date} | ${t.description} | R$ ${t.amount}`));
}

check();
