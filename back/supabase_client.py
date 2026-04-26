# supabase_client.py  — MODIFIÉ : client activé + bucket configuré
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL="https://kmrkgxuxalpilfzseamc.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcmtneHV4YWxwaWxmenNlYW1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY3MTg2MSwiZXhwIjoyMDkyMjQ3ODYxfQ.v6PGtZikF6SFtvDXnbMx19QeLlrPerGZ4x_-N55_Aac"

# SECRET_KEY=ma_super_cle_ultra_secrete_123

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Nom du bucket Supabase Storage à créer dans votre dashboard
# Dashboard → Storage → New bucket → "imagelab" (public)
STORAGE_BUCKET = "imagelab"