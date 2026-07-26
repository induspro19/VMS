import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://duikfskqbacackelieux.supabase.co';

export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aWtmc2txYmFjYWNrZWxpZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTA0ODIsImV4cCI6MjA3OTE4NjQ4Mn0.IST84GYs9-5eOGmx485XPqDAwfp0Jdw5MHAjzUYTUUA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
