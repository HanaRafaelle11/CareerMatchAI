import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Connecting to Supabase:', supabaseUrl);
  
  // 1. Fetch profiles
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) console.error('Error fetching profiles:', pError);
  else console.log('Profiles:', profiles);

  // 2. Fetch resumes
  const { data: resumes, error: rError } = await supabase.from('resumes').select('*');
  if (rError) console.error('Error fetching resumes:', rError);
  else {
    console.log('Resumes count:', resumes?.length);
    resumes?.forEach(r => {
      console.log(`- Resume ID: ${r.id}, Name: ${r.file_name}, Primary: ${r.is_primary}, URL: ${r.file_url}`);
    });
  }

  // 3. Fetch resume versions
  const { data: versions, error: vError } = await supabase.from('resume_versions').select('*');
  if (vError) console.error('Error fetching versions:', vError);
  else {
    console.log('Resume versions count:', versions?.length);
    versions?.forEach(v => {
      console.log(`- Version ID: ${v.id}, Name: ${v.file_name}, URL: ${v.file_url}`);
    });
  }

  // 4. Fetch applications
  const { data: applications, error: aError } = await supabase.from('applications').select('*');
  if (aError) console.error('Error fetching applications:', aError);
  else console.log('Applications count:', applications?.length);

  // 5. Fetch matches
  const { data: matches, error: mError } = await supabase.from('matches').select('*');
  if (mError) console.error('Error fetching matches:', mError);
  else console.log('Matches count:', matches?.length);
}

run();
