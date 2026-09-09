import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('categories').insert([
        {
            name: 'Avulsas',
            type: 'expense',
            icon: 'shopping_bag', // or whatever icon makes sense, maybe 'receipt'
            color_theme: 'gray'
        }
    ]);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success:", data);
    }
}
run();
