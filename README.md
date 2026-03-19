# Maslow Finance — Life Savings System

A complete personal finance tracker built on **Abraham Maslow's Hierarchy of Needs**. Tracks expenses, budget, savings goals, debts, tier milestones, and weekly/monthly/annual execution cadence.

---

## Features

- **Dashboard** — Monthly KPIs, tier status, spending chart, top actions
- **Expenses** — Full transaction log with monthly view, categories, search
- **Budget** — Per-category limits vs actuals, tier allocation breakdown
- **Savings Goals** — Track all savings targets with progress rings
- **Debts** — Avalanche method tracker with payoff projections
- **Tier Progress** — Maslow milestone system across all 5 tiers
- **Cadence** — Weekly (Mon/Wed/Fri) + monthly + annual review checklists
- **Settings** — Profile, export/import JSON backup, data reset

All data is stored locally in your browser (localStorage). No backend, no database, no account required.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Build for production

```bash
npm run build
npm start
```

---

## Deploy to Vercel (one click)

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. No environment variables needed.

### Option B — GitHub + Vercel Dashboard

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import the repository
4. Framework: **Next.js** (auto-detected)
5. Click **Deploy**

No environment variables required. The app is fully client-side.

---

## Maslow's 5 Financial Tiers

| Tier | Name | Allocation | Goal |
|------|------|-----------|------|
| 1 | Physiological | 50% | Essentials ≤50% income, GH₵1,000 buffer |
| 2 | Safety | 20% | 6-month emergency fund, zero high-interest debt |
| 3 | Love & Belonging | 10% | Family obligations budgeted, education fund |
| 4 | Esteem | 15% | Investment portfolio, second income stream |
| 5 | Self-Actualization | 5% | FIRE target, legacy portfolio, estate plan |

---

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state + localStorage persistence)
- **Recharts** (charts)
- **date-fns** (date utilities)
- **lucide-react** (icons)

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Dashboard
│   ├── expenses/page.tsx   # Transaction tracker
│   ├── budget/page.tsx     # Budget vs actuals
│   ├── savings/page.tsx    # Savings goals
│   ├── debts/page.tsx      # Debt tracker (avalanche)
│   ├── tiers/page.tsx      # Maslow milestone tracker
│   ├── cadence/page.tsx    # Weekly/monthly/annual reviews
│   ├── settings/page.tsx   # Profile + data management
│   └── globals.css
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── ui.tsx              # Reusable UI components
└── lib/
    ├── types.ts            # TypeScript interfaces
    ├── constants.ts        # Tiers, categories, milestones, cadence
    ├── utils.ts            # Helper functions
    └── store.ts            # Zustand store
```

---

Built for the Ghanaian market with local instruments (GH₵, MoMo, T-Bills, SSNIT, NHIS, GSE) and cultural context (family obligations, Homowo, Q4 family spending).
