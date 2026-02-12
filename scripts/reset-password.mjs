import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
function loadEnv() {
  const envPath = join(__dirname, '../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex !== -1) {
        const key = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1).replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = process.argv[2] || 'devin.patrick.fox@gmail.com';

async function sendPasswordReset() {
  console.log(`Sending password reset to: ${email}`);

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3002/reset-password',
    });

    if (error) {
      console.error('Error sending reset email:', error);
      process.exit(1);
    }

    console.log(`Password reset email sent to ${email}`);
    console.log('Check inbox (and spam folder) for the reset link.');
  } catch (e) {
    console.error('Exception:', e);
  }
}

sendPasswordReset();
