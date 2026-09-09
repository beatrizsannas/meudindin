import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
    }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

async function run() {
    const response = await fetch(`${url}/rest/v1/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify([
            {
                name: 'Avulsas',
                type: 'expense',
                icon: 'receipt_long',
                color_theme: 'gray'
            }
        ])
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Error:", error);
    } else {
        console.log("Success: Category Avulsas added.");
    }
}
run();
