
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const parseEnv = () => {
    try {
        const envPath = '/Users/beatrizsannas/Library/CloudStorage/GoogleDrive-beatrizsannas@gmail.com/Meu Drive/JOBS/MEU DINDIN/meu-dindin/meudindin_recuperado/.env';
        const content = fs.readFileSync(envPath, 'utf-8');
        const envVars: any = {};
        content.split('\n').forEach(line => {
            if (!line || line.startsWith('#')) return;
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
                envVars[key] = val;
            }
        });
        return envVars;
    } catch (e) {
        return {};
    }
};

const env = parseEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkData() {
    console.log("Fetching 1 category...");
    const { data: catData, error: catError } = await supabase.from('categories').select('*');
    if (catError) console.error("Category Error:", catError);
    else {
        console.log("Categories found:", catData?.length);
        if (catData && catData.length > 0) {
            console.log("First Category:", catData[0]);
            console.log("All Category Names:", catData.map(c => c.name));
        }
    }

    console.log("\nFetching 1 transaction...");
    // Fetch a transaction to see if it has 'category' (string) or just 'category_id'
    const { data: txData, error: txError } = await supabase.from('transactions').select('*').limit(1);
    if (txError) console.error("Transaction Error:", txError);
    else {
        if (txData && txData.length > 0) {
            console.log("First Transaction:", txData[0]);
        } else {
            console.log("No transactions found.");
        }
    }
}

checkData();
