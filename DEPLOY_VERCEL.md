Secure Vercel deployment guide for this Next.js 16 + Supabase app

1) Import repo into Vercel.

2) Configure environment variables in Vercel Project Settings.
  - Public (safe for browser):
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY
    - NEXT_PUBLIC_SITE_URL
  - Server-only secrets:
    - SUPABASE_SERVICE_ROLE_KEY
    - GROQ_API_KEY

3) Ensure server-only secrets are never referenced in client components.
  - In Next.js, only variables prefixed with NEXT_PUBLIC_ are bundled into the browser.

4) Add OAuth redirect URLs in Supabase Auth settings:
  - https://<your-production-domain>/auth/callback
  - http://localhost:3000/auth/callback

5) Run SQL migrations before or during first deployment:
  - supabase/migrations/001_create_schema.sql
  - supabase/migrations/002_notes_table.sql
  - supabase/migrations/003_youtube_table.sql
  - supabase/migrations/004_rls_policies.sql
  - supabase/migrations/005_folders_tables.sql
  - supabase/migrations/006_folder_policies.sql

6) Deploy with Git integration or CLI:

```bash
npm install -g vercel
vercel login
vercel --prod
```

7) Validate after deploy:
  - /dashboard, /notes, /youtube redirect to /login when signed out.
  - OAuth returns to /auth/callback then /dashboard.
  - Data access works only for owner due to RLS.
  - Storage object paths follow: <user_id>/<filename>.