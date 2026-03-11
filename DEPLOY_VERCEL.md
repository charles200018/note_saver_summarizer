Quick Vercel deployment guide for this Next.js app

1) Push your repository to GitHub/GitLab/Bitbucket.

2) Create a Vercel account and import the repo (Vercel auto-detects Next.js).

3) Set required environment variables in the Vercel Project Settings > Environment Variables.
   - Example env names used by this project (set your values):
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - OPENROUTER_API_KEY (if used)
     - Any other API keys you added to `process.env` in the app

4) (Optional) Install and use the Vercel CLI to deploy from your machine:

```bash
npm install -g vercel
vercel login
vercel --prod
```

5) If you prefer Git-based deploys, Vercel will create preview deployments on every PR and a Production deployment on the main branch.

Notes & tips
- Vercel Hobby (free) allows unlimited projects but has quotas for build minutes, bandwidth, and serverless function usage — upgrade if you exceed them.
- For server-side features that require secrets, add them as Project Environment Variables (do not commit secrets in code).
- If you need to customize builds or routes, add a `vercel.json` (example included).

Files added by this guide:
- `vercel.json` (minimal config).