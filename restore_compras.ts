
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

async function restoreCompras() {
    console.log("Checking for 'Compras' category...");

    // Check if it exists first
    const { data: existing, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', 'Compras')
        .eq('type', 'expense')
        .limit(1);

    if (fetchError) {
        console.error("Error checking category:", fetchError);
        return;
    }

    if (existing && existing.length > 0) {
        console.log("Category 'Compras' already exists. ID:", existing[0].id);
        return;
    }

    console.log("'Compras' category not found. Creating...");

    // Insert WITHOUT user_id
    const { data, error } = await supabase
        .from('categories')
        .insert({
            name: 'Compras',
            type: 'expense',
            icon: 'shopping_bag',
            color_theme: 'orange'
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating 'Compras':", error);
    } else {
        console.log("Successfully created 'Compras' category!", data);
    }
}

restoreCompras();
