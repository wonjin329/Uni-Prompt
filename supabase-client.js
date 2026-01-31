import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project URL and anon key
const supabaseUrl = 'https://wbxjqrjytcsqglgafeti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieGpxcmp5dGNzcWdsZ2FmZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTkyMTgsImV4cCI6MjA4NTM5NTIxOH0.koF1iSEXU7T7Jzp7wZhqDA58aqgdMso94LpYbcZirLc';

export const supabase = createClient(supabaseUrl, supabaseKey);
