const { createClient } = supabase;

const supabaseUrl = 'https://wbxjqrjytcsqglgafeti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieGpxcmp5dGNzcWdsZ2FmZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTkyMTgsImV4cCI6MjA4NTM5NTIxOH0.koF1iSEXU7T7Jzp7wZhqDA58aqgdMso94LpYbcZirLc';

window.supabaseClient = createClient(supabaseUrl, supabaseKey);