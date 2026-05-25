import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgtonxqcphhyszhwbagy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndG9ueHFjcGhoeXN6aHdiYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTk3OTksImV4cCI6MjA5NDMzNTc5OX0.YdSWQdM7dWR0ecylwhnEBNc5Ky-FDtRLq1evgf3g3YI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
