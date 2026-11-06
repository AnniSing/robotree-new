# Robotree — Git, Vercel & Supabase Deployment Guide

This project is fully configured and ready for **Git version control**, **Vercel edge deployment**, and **Supabase PostgreSQL database connectivity**.

---

## 1. Git Repository Setup

The local Git repository is initialized on branch `main` with a clean working tree.

### Connecting to GitHub
To push this project to your GitHub account:

```bash
# 1. Create a new repository on GitHub (e.g. named "robotree")
# 2. Add your GitHub remote repository (replace with your GitHub URL):
git remote add origin https://github.com/<YOUR-USERNAME>/robotree.git

# 3. Rename branch to main (if not already main)
git branch -M main

# 4. Push all code to GitHub
git push -u origin main
```

### Git Files Configured
- **`.gitignore`**: Configured to ignore `node_modules/`, `dist/`, `dist-server/`, `.env*`, `.vercel/`, temporary logs, and large zip archives (`all-website-photos.zip`, `hostinger-assets.zip`).
- **`.gitattributes`**: Normalizes LF line endings across Windows and Linux (Vercel builds run on Linux).

---

## 2. Supabase Database Connection

The backend supports **dual database modes**:
1. **Supabase PostgreSQL Mode**: Activated automatically when `DATABASE_URL` or `SUPABASE_URL` is set.
2. **Local Atomic JSON Mode**: Automatic fallback for local offline development when database credentials are not present.

### Step 2.1: Get Supabase Credentials
1. Go to [https://supabase.com](https://supabase.com) and create a project (or select an existing one).
2. Go to **Project Settings** → **Database**:
   - Scroll to **Connection string** → **URI**.
   - Select **Mode: Transaction (Port 6543)** (recommended for serverless/Vercel) or **Session (Port 5432)**.
   - Example connection string:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
3. Go to **Project Settings** → **API**:
   - Copy the **Project URL** (`SUPABASE_URL`).
   - Copy the **anon public key** (`SUPABASE_ANON_KEY`).
   - Copy the **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`).

### Step 2.2: Configure `.env`
In your local project root, create or update `.env`:
```env
PORT=5000
NODE_ENV=development
ADMIN_PASSCODE=YourStrongAdminPasscode2026
SESSION_SECRET=your_super_secret_session_key_minimum_32_characters

# Supabase Connection String (Transaction Pooler):
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Client API Keys:
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 2.3: Run Migration & Data Synchronization
Run the automated migration command:
```bash
npm run db:supabase:migrate
```
This command automatically:
- Connects securely with SSL to Supabase.
- Executes `migrations/001_initial_schema.sql` (Users, Sessions, Certificates, Courses, Events, Team, Inquiries, Audit logs).
- Executes `migrations/002_products_and_orders.sql` (Store products and customer orders).
- Seeds initial data from `data/*.json` directly into your Supabase database.

### Step 2.4: Verify Supabase Database
To verify database connectivity and row counts anytime:
```bash
npm run db:supabase:verify
```

---

## 3. Vercel Deployment

The project is structured so that:
- **Frontend**: Vite builds all HTML/CSS/JS and static assets to `dist/`, served globally by Vercel Edge CDN.
- **Backend API**: Serverless Express function located at `api/index.js` handles all `/api/*` endpoints.

### Step 3.1: Deploy with Vercel Web Dashboard
1. Go to [https://vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository (`robotree`).
3. Vercel will detect configuration automatically via `vercel.json`:
   - **Framework Preset**: Vite (or Other)
   - **Build Command**: `npm run build && npm run backend:build`
   - **Output Directory**: `dist`
4. In the **Environment Variables** section, add:
   - `DATABASE_URL`: Your Supabase pooler connection string.
   - `ADMIN_PASSCODE`: Your admin password.
   - `SESSION_SECRET`: Your secret signing key.
   - `SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_ANON_KEY`: Your Supabase anon key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.
   - `NODE_ENV`: `production`
5. Click **Deploy**!

### Step 3.2: Deploy via Vercel CLI (Alternative)
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login and deploy
vercel
```

---

## 4. Architecture Summary

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Vite + HTML5 / CSS3 / Vanilla JS | High performance static site, loaded from Vercel Edge CDN |
| **Backend API** | Node.js + Express 5 (TypeScript) | Serverless microservice on Vercel handling `/api/*` |
| **Database** | Supabase (PostgreSQL 15+) | Scalable managed relational database with SSL pooling |
| **ORM / Client** | `pg` Pool + `@supabase/supabase-js` | Parameterized SQL queries, repository pattern, optional SDK client |
| **Security** | Argon2id / PBKDF2, Helmet, CSRF Guard, Same-Origin Protection | Multi-layer enterprise security with audit trails |
