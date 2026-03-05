import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Fetching all transactions without user filter (using service role / anon if RLS allows)...");

    // Try to bypass RLS or see if anon has any access
    const { data, error } = await supabase
        .from('transactions')
        .select('id, description, amount, type, date, exclude_from_global, created_at, user_id')
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error.message);
    } else {
        console.log(`Found ${data.length} transactions total.`);

        let totalIncome = 0;
        let totalExpense = 0;

        data.forEach(t => {
            // Calculate totals similar to the app
            if (!t.exclude_from_global) {
                if (t.type === 'income') totalIncome += Number(t.amount);
                if (t.type === 'expense') totalExpense += Number(t.amount);
            }
        });

        console.log(`\nTotals Calculation (excluding global=true):`);
        console.log(`Income: ${totalIncome}`);
        console.log(`Expense: ${totalExpense}`);
        console.log(`Balance: ${totalIncome - totalExpense}`);

        console.log(`\nTransactions Dump:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkData();
