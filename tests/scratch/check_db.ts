// tests/scratch/check_db.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../../.env');

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
  }
} catch (e: any) {
  console.error("Error loading env:", e.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking columns in database tables...");
  
  const rvCheck = await supabase.from('resume_versions').select('processing_time_ms').limit(1);
  console.log('resume_versions column check:', rvCheck.error ? rvCheck.error.message : 'OK');

  const mCheck = await supabase.from('matches').select('processing_time_ms').limit(1);
  console.log('matches column check:', mCheck.error ? mCheck.error.message : 'OK');

  const jmCheck = await supabase.from('job_matches').select('processing_time_ms').limit(1);
  console.log('job_matches column check:', jmCheck.error ? jmCheck.error.message : 'OK');
}

check();
