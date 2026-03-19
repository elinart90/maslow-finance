import { format, getWeek, getYear, getMonth } from "date-fns";
import type { Transaction, BudgetCategory } from "./types";
import { TIER_CONFIG } from "./constants";

export function fmt(amount: number, currency = "GH₵"): string {
  return `${currency} ${Math.abs(amount).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtShort(amount: number): string {
  if (amount >= 1_000_000) return `GH₵ ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `GH₵ ${(amount / 1_000).toFixed(1)}K`;
  return `GH₵ ${Math.round(amount).toLocaleString()}`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function getMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function getWeekKey(date: Date): string {
  return `${getYear(date)}-W${String(getWeek(date)).padStart(2, "0")}`;
}

export function getCurrentMonthKey(): string {
  return getMonthKey(new Date());
}

export function getTransactionsForMonth(
  transactions: Transaction[],
  monthKey: string
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(monthKey));
}

export function getExpensesForMonth(
  transactions: Transaction[],
  monthKey: string
): Transaction[] {
  return getTransactionsForMonth(transactions, monthKey).filter(
    (t) => t.type === "expense"
  );
}

export function getIncomeForMonth(
  transactions: Transaction[],
  monthKey: string
): Transaction[] {
  return getTransactionsForMonth(transactions, monthKey).filter(
    (t) => t.type === "income"
  );
}

export function sumTransactions(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

export function getSpendingByCategory(
  transactions: Transaction[],
  monthKey: string
): Record<string, number> {
  const expenses = getExpensesForMonth(transactions, monthKey);
  return expenses.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    },
    {} as Record<string, number>
  );
}

export function getBudgetUsage(
  transactions: Transaction[],
  categories: BudgetCategory[],
  monthKey: string
): Array<{ category: BudgetCategory; spent: number; pct: number; over: boolean }> {
  const spending = getSpendingByCategory(transactions, monthKey);
  return categories.map((cat) => {
    const spent = spending[cat.category] || 0;
    const pct = cat.monthlyLimit > 0 ? (spent / cat.monthlyLimit) * 100 : 0;
    return { category: cat, spent, pct, over: spent > cat.monthlyLimit };
  });
}

export function detectCurrentTier(
  income: number,
  monthlyExpenses: number,
  savings: number,
  totalDebt: number
): number {
  if (income === 0) return 1;
  const expRatio = monthlyExpenses / income;
  if (expRatio > 0.8 || savings < 1000) return 1;
  if (totalDebt > income * 3 || savings < monthlyExpenses * 3) return 2;
  if (savings < monthlyExpenses * 6) return 3;
  if (savings < monthlyExpenses * 24) return 4;
  return 5;
}

export function calcFireNumber(monthlyExpenses: number): number {
  return monthlyExpenses * 12 * 25;
}

export function calcNetWorth(savings: number, totalDebt: number): number {
  return savings - totalDebt;
}

export function calcMonthsToGoal(
  currentAmount: number,
  targetAmount: number,
  monthlyContribution: number
): number | null {
  if (monthlyContribution <= 0) return null;
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / monthlyContribution);
}

export function tierConfig(tier: number) {
  return TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
  }
  return months;
}

export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, "MMMM yyyy");
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
