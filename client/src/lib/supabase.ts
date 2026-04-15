import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://nizqmiosjtbimkfjbrec.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5penFtaW9zanRiaW1rZmpicmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTQwMDYsImV4cCI6MjA4OTE5MDAwNn0.63INRIhfCW30w-VXJwNroAxX7BRaTo0aY9BfjolOZcI",
);
