import type { BudgetCategory, TierMilestone, CadenceItem } from "./types";

export const TIER_CONFIG = {
  1: {
    name: "Physiological",
    short: "Survival",
    color: "#DC2626",
    light: "#FEF2F2",
    dark: "#991B1B",
    pct: 50,
    description:
      "Master your survival budget: essentials ≤50% income, GH₵1,000 buffer, every cedi tracked.",
  },
  2: {
    name: "Safety",
    short: "Security",
    color: "#EA580C",
    light: "#FFF7ED",
    dark: "#9A3412",
    pct: 20,
    description:
      "Build your 6-month emergency fund, eliminate high-interest debt, secure insurance.",
  },
  3: {
    name: "Love & Belonging",
    short: "Family",
    color: "#D97706",
    light: "#FFFBEB",
    dark: "#92400E",
    pct: 10,
    description:
      "Budget family obligations, align with partner, open education fund.",
  },
  4: {
    name: "Esteem",
    short: "Wealth",
    color: "#16A34A",
    light: "#F0FDF4",
    dark: "#14532D",
    pct: 15,
    description:
      "Build investment portfolio, create a second income stream, grow net worth.",
  },
  5: {
    name: "Self-Actualization",
    short: "Legacy",
    color: "#2563EB",
    light: "#EFF6FF",
    dark: "#1E3A8A",
    pct: 5,
    description:
      "Achieve financial independence, build legacy portfolio, formalize giving.",
  },
} as const;

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { category: "housing", name: "Housing / Rent", monthlyLimit: 1500, tier: 1, color: "#DC2626" },
  { category: "food", name: "Food & Groceries", monthlyLimit: 750, tier: 1, color: "#EF4444" },
  { category: "transport", name: "Transport", monthlyLimit: 500, tier: 1, color: "#F87171" },
  { category: "utilities", name: "Utilities", monthlyLimit: 200, tier: 1, color: "#FCA5A5" },
  { category: "airtime", name: "Airtime & Data", monthlyLimit: 100, tier: 1, color: "#FECACA" },
  { category: "health", name: "Health & Meds", monthlyLimit: 150, tier: 2, color: "#EA580C" },
  { category: "insurance", name: "Insurance", monthlyLimit: 200, tier: 2, color: "#F97316" },
  { category: "debt_payment", name: "Debt Payments", monthlyLimit: 500, tier: 2, color: "#FB923C" },
  { category: "savings_transfer", name: "Savings Transfer", monthlyLimit: 1000, tier: 2, color: "#FCA5A5" },
  { category: "family", name: "Family Obligations", monthlyLimit: 500, tier: 3, color: "#D97706" },
  { category: "education", name: "Education", monthlyLimit: 200, tier: 3, color: "#F59E0B" },
  { category: "investment", name: "Investments", monthlyLimit: 750, tier: 4, color: "#16A34A" },
  { category: "business", name: "Business Expenses", monthlyLimit: 300, tier: 4, color: "#22C55E" },
  { category: "entertainment", name: "Entertainment", monthlyLimit: 150, tier: 1, color: "#94A3B8" },
  { category: "clothing", name: "Clothing", monthlyLimit: 100, tier: 1, color: "#CBD5E1" },
  { category: "other", name: "Other", monthlyLimit: 200, tier: 1, color: "#9CA3AF" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  housing: "Housing / Rent",
  food: "Food & Groceries",
  transport: "Transport",
  utilities: "Utilities",
  airtime: "Airtime & Data",
  health: "Health & Meds",
  insurance: "Insurance",
  family: "Family Obligations",
  education: "Education",
  entertainment: "Entertainment",
  clothing: "Clothing",
  business: "Business",
  investment: "Investments",
  debt_payment: "Debt Payments",
  savings_transfer: "Savings Transfer",
  salary: "Salary",
  side_income: "Side Income",
  other: "Other",
};

export const DEFAULT_MILESTONES: TierMilestone[] = [
  // Tier 1
  { id: "t1m1", tier: 1, text: "List and categorize all monthly expenses", completed: false },
  { id: "t1m2", tier: 1, text: "Essential expenses ≤50% of monthly income", completed: false },
  { id: "t1m3", tier: 1, text: "GH₵1,000 cash buffer saved", completed: false },
  { id: "t1m4", tier: 1, text: "Zero-based budget built and followed 30 days", completed: false },
  { id: "t1m5", tier: 1, text: "All income and expenses tracked for 60+ days", completed: false },
  // Tier 2
  { id: "t2m1", tier: 2, text: "3-month emergency fund complete", completed: false },
  { id: "t2m2", tier: 2, text: "All debts above 20% interest rate eliminated", completed: false },
  { id: "t2m3", tier: 2, text: "NHIS registration active", completed: false },
  { id: "t2m4", tier: 2, text: "Life insurance policy in force", completed: false },
  { id: "t2m5", tier: 2, text: "SSNIT contributions verified and current", completed: false },
  { id: "t2m6", tier: 2, text: "6-month emergency fund complete", completed: false },
  // Tier 3
  { id: "t3m1", tier: 3, text: "Family obligation budget created and funded monthly", completed: false },
  { id: "t3m2", tier: 3, text: "Partner financial alignment conversation completed", completed: false },
  { id: "t3m3", tier: 3, text: "Children's education fund opened", completed: false },
  { id: "t3m4", tier: 3, text: "Annual family obligation estimate calculated", completed: false },
  { id: "t3m5", tier: 3, text: "Joint savings goal with named target set", completed: false },
  // Tier 4
  { id: "t4m1", tier: 4, text: "Investment account opened with first deposit", completed: false },
  { id: "t4m2", tier: 4, text: "Side income stream generating GH₵500+/month", completed: false },
  { id: "t4m3", tier: 4, text: "Net worth tracked monthly and growing", completed: false },
  { id: "t4m4", tier: 4, text: "Professional certification or skill upgrade completed", completed: false },
  { id: "t4m5", tier: 4, text: "Investment portfolio at 12 months of salary", completed: false },
  // Tier 5
  { id: "t5m1", tier: 5, text: "FIRE number calculated with detailed model", completed: false },
  { id: "t5m2", tier: 5, text: "Net worth ≥ 3 years of expenses", completed: false },
  { id: "t5m3", tier: 5, text: "Will and beneficiary designations complete", completed: false },
  { id: "t5m4", tier: 5, text: "Side income ≥ 40% of expenses (semi-independence)", completed: false },
  { id: "t5m5", tier: 5, text: "Portfolio generates income without depleting capital", completed: false },
];

export const DEFAULT_CADENCE_ITEMS: CadenceItem[] = [
  {
    id: "wm1", frequency: "weekly_mon",
    title: "Money check-in (10 min)",
    description: "Check MoMo wallet, bank balance, this week's budget. Note any weekend overspend.",
  },
  {
    id: "wm2", frequency: "weekly_mon",
    title: "Review last week's spending",
    description: "Categorize every transaction from the past 7 days. Flag any unplanned spend.",
  },
  {
    id: "wm3", frequency: "weekly_mon",
    title: "Set this week's spending ceiling",
    description: "Based on remaining envelope balances, set hard limits for food, transport, airtime.",
  },
  {
    id: "ww1", frequency: "weekly_wed",
    title: "Mid-week savings transfer",
    description: "Move planned savings to a separate account before it disappears.",
  },
  {
    id: "ww2", frequency: "weekly_wed",
    title: "Debt tracker update",
    description: "Note any debt payment made this week. Recalculate balance.",
  },
  {
    id: "ww3", frequency: "weekly_wed",
    title: "Investment check (Tier 4+)",
    description: "5-minute portfolio review. No panic selling. Only add or hold.",
  },
  {
    id: "wf1", frequency: "weekly_fri",
    title: "Weekend budget lock",
    description: "Decide exactly how much is available for weekend spending. Withdraw cash if helpful.",
  },
  {
    id: "wf2", frequency: "weekly_fri",
    title: "One financial education action",
    description: "Read one article or listen to one podcast chapter. 20 min maximum.",
  },
  {
    id: "wf3", frequency: "weekly_fri",
    title: "Goal progress check",
    description: "Are you on track for this month's savings target? If behind, what can you cut?",
  },
  {
    id: "me1", frequency: "monthly",
    title: "Full income & expense statement",
    description: "Total income vs total spend. Calculate actual savings rate. Compare to target.",
  },
  {
    id: "me2", frequency: "monthly",
    title: "Tier progress review",
    description: "Are you meeting tier milestones? What's the single bottleneck? Adjust allocation.",
  },
  {
    id: "me3", frequency: "monthly",
    title: "Net worth update",
    description: "Update your net worth estimate. Project forward 12 months at current rate.",
  },
  {
    id: "me4", frequency: "monthly",
    title: "Pay yourself first",
    description: "Transfer savings on Day 1 before paying anyone else.",
  },
  {
    id: "an1", frequency: "annual", month: 1,
    title: "Annual financial reset (January)",
    description: "Set 12-month savings target. Review insurance. Update budget for income changes.",
  },
  {
    id: "an2", frequency: "annual", month: 3,
    title: "Tax & pension audit (March)",
    description: "Confirm SSNIT contributions. File returns if applicable. Review tax-efficient savings.",
  },
  {
    id: "an3", frequency: "annual", month: 6,
    title: "Mid-year review (June)",
    description: "50% toward annual savings goal? Adjust H2 strategy. Review investment performance.",
  },
  {
    id: "an4", frequency: "annual", month: 8,
    title: "Family obligations review (August)",
    description: "Review school fees, funeral fund, festival budget. Adjust for Q4 family spending.",
  },
  {
    id: "an5", frequency: "annual", month: 10,
    title: "Q4 preparation (October)",
    description: "Budget for Christmas, Homowo, end-of-year. Pre-fund December.",
  },
  {
    id: "an6", frequency: "annual", month: 12,
    title: "Annual review & vision (December)",
    description: "Calculate year's net worth change. Celebrate wins. Set next year's targets.",
  },
];

export const INCOME_CATEGORIES: string[] = ["salary", "side_income"];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
