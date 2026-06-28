# 🚀 DeadlineVibe Deployment Checklist

Before you submit your project and move to the public phase of the hackathon, **YOU MUST COMPLETE THESE STEPS** so that judges and public users can actually test your app without crashing or getting blocked!

## 1. Fix Google Calendar Login (CRITICAL)
If you don't do this, nobody except you will be able to log in with Google, and they will see a "403 Access Denied" error!

1. Go to the [Google Cloud Console - OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent).
2. Make sure you are logged into the exact same Google account that you used to create your Supabase project's Google credentials.
3. Look for the **Publishing status** (it currently says "Testing").
4. Click the button that says **"PUBLISH APP"** to change the status to **"In production"**. 
5. A popup will ask you to confirm. Click **Confirm**.

*Note: Once you do this, judges will see a "Google hasn't verified this app" warning when they log in. They just need to click "Advanced" -> "Go to app (unsafe)" to proceed. This is standard for hackathons!*

## 2. Supabase Database Configuration
Ensure your database tables are created in your production Supabase instance.
- Did you run the `supabase_setup.sql` script in your Supabase SQL Editor?
- Are the Row Level Security (RLS) policies active so users can only see their own tasks and chats?

## 3. Environment Variables
When you host the app (e.g., on Vercel, Netlify, or Render), make sure you copy over your `.env` variables exactly as they are in your local setup:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Good luck with the Vibe2Ship submission! You've built an incredible, highly polished application. You're going to crush it!
