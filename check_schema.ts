
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

async function checkSchema() {
    // We can't access information_schema easily with anon key usually due to permissions.
    // Instead, let's try to select * from categories limit 1 and see the keys in the returned object.
    const { data, error } = await supabase.from('categories').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
        // No data found, let's try to insert a test category WITHOUT user_id to see if it works.
        // If it works, user_id might not be required or might not exist.
        // If it fails with "column user_id does not exist", then we know.
        // Wait, if we don't send user_id, it might fail if user_id is NOT null.

        // Let's try to inspect the error message by sending a bad column "test_col".
        const { error: badColError } = await supabase.from('categories').insert({
            name: 'Test Schema',
            type: 'expense',
            test_col_bad: '123'
        } as any);

        if (badColError) console.log("Bad Col Error:", badColError);

        // Now try sending user_id to see if it complains about THAT column
        const { error: userIdError } = await supabase.from('categories').insert({
            name: 'Test Schema UserID',
            type: 'expense',
            user_id: '123456' // invalid UUID probably, but should trigger column check first
        } as any);

        if (userIdError) console.log("User ID Error:", userIdError);
    } else {
        console.log("No data found to infer columns. Attempting inserts to probe schema...");

        // Let's try to inspect the error message by sending a bad column "test_col".
        const { error: badColError } = await supabase.from('categories').insert({
            name: 'Test Schema',
            type: 'expense',
            test_col_bad: '123'
        } as any);

        if (badColError) console.log("Bad Col Error:", badColError);

        // Now try sending user_id to see if it complains about THAT column
        const { error: userIdError } = await supabase.from('categories').insert({
            name: 'Test Schema UserID',
            type: 'expense',
            user_id: '123456' // invalid UUID, should trigger error
        } as any);

        if (userIdError) console.log("User ID Error:", userIdError);
    }
}

checkSchema();
