
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
// Simple .env parsing
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const envConfig: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key) envConfig[key.trim()] = val.join('=').trim();
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function probeColumns() {
    console.log('Probing for phone and dob columns...');
    // We try to select them. If they don't exist, we get an error.
    const { error } = await supabase.from('profiles').select('phone, dob').limit(1);

    if (error) {
        console.log('Error probing columns:', error.message);
    } else {
        console.log('Columns phone and dob exist!');
    }
}

probeColumns();
