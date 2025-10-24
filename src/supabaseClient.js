import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://muzvbwiertfzwubdfhje.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enZid2llcnRmend1YmRmaGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjkyNzYsImV4cCI6MjA3NTYwNTI3Nn0.DlXuKeluii3JA4umw0dtwHEo4wWJX9JE_4m2kP5PFqQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
