# IONIC

A venture marketplace platform where accredited investors can discover, bid on, and invest in individual startup fund listings — both primary and secondary.

## Features

- **Browse listings** — public-facing marketplace of startup fund opportunities
- **NDA flow** — investors sign a digital NDA (with signature pad) to unlock confidential deal details
- **Bid placement** — minimum $50,000 bids with admin-managed status progression
- **KYC verification** — investor identity verification (individual or entity)
- **Admin dashboard** — manage listings, review bids, upload documents, approve KYC
- **Email OTP auth** — passwordless sign-in via 6-digit code

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS · shadcn/ui (Radix primitives) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Email OTP |
| Storage | Supabase Storage |
| State | TanStack Query (React Query) |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/IONIC.git
cd IONIC
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migration: `supabase/migrations/001_initial_schema.sql` in your project's SQL editor
3. Create storage buckets: `documents`, `signatures`, `logos`
4. Enable Email OTP in Authentication → Providers → Email

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── auth/             # Login, OTP verify, KYC
│   ├── listings/         # Browse + detail pages
│   ├── bids/             # Investor bid management
│   ├── profile/          # Investor profile + KYC view
│   ├── admin/            # Admin dashboard, listings, bids, users, docs
│   └── api/              # API route handlers
├── components/           # Shared UI components
└── lib/                  # Supabase client, auth helpers, TypeScript types
supabase/
└── migrations/           # SQL schema migrations
```

## User Roles

| Role | Access |
|---|---|
| `investor` | Browse listings, sign NDAs, place bids, view own bids |
| `admin` | Full access — create/edit listings, review bids, approve KYC, upload documents |

## Bid Status Flow

```
placed → accepted → awaiting_payment → invested
placed → rejected
```
