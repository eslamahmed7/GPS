const SUPABASE_URL = 'https://qorxfpadvqnluosqqycg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcnhmcGFkdnFubHVvc3FxeWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTk0MjIsImV4cCI6MjA5NjY5NTQyMn0.GIjZjtTmyQgaQy6Zc5hzFUMzbb-fJyjUNDngwKGqL5I';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

