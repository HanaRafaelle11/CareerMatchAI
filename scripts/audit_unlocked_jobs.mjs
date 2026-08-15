import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
} catch {
  try {
    envContent = fs.readFileSync('.env.local', 'utf8');
  } catch {}
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
});

const url = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function main() {
  const { count: unlockedCount } = await supabase.from('user_unlocked_jobs').select('*', { count: 'exact', head: true });
  console.log('USER_UNLOCKED_JOBS_COUNT:', unlockedCount);

  const { data: logs, count: logCount } = await supabase
    .from('activity_logs')
    .select('id, user_id, entity_id, created_at', { count: 'exact' })
    .eq('event_type', 'job_unlocked');
  
  console.log('ACTIVITY_LOGS_JOB_UNLOCKED_COUNT:', logCount);
  if (logs && logs.length > 0) {
    console.log('LOGS:', logs);
  }
}

main().catch(console.error);
