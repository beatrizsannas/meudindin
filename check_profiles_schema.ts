
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Manually load env vars since we are running this with ts-node/node
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
const envConfig = fs.existsSync(envPath)
    ? Object.fromEntries(fs.readFileSync(envPath, 'utf-8').split('\n').filter(Boolean).map(line => line.split('=')))
    : {};

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking profiles table schema...');

    // Attempt to insert a dummy row to trigger an error that might reveal columns, OR just select one
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('Error selecting from profiles:', error);
    } else {
        console.log('Success! Sample row keys:', data && data.length > 0 ? Object.keys(data[0]) : 'No data found, but query succeeded.');
        if (data && data.length > 0) {
            console.log('Sample data:', data[0]);
        }
    }
}

checkSchema();
