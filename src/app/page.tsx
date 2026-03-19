"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Plus, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  fmt, fmtShort, getCurrentMonthKey, sumTransactions,
  getExpensesForMonth, getIncomeForMonth, detectCurrentTier,
  calcFireNumber, formatMonthKey, getLastNMonths, getSpendingByCategory,
} from "@/lib/utils";
import { TIER_CONFIG, CATEGORY_LABELS } from "@/lib/constants";
import { MetricCard, TierBadge, BudgetBar, SectionCard, ProgressRing } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function Dashboard() {
  const { profile, transactions, debts, savingsGoals, budgetCategories } = useStore();

  const monthKey = getCurrentMonthKey();
  const income = profile.monthlyIncome;

  const monthExpenses = useMemo(
    () => sumTransactions(getExpensesForMonth(transactions, monthKey)),
    [transactions, monthKey]
  );
  const monthIncome = useMemo(
    () => sumTransactions(getIncomeForMonth(transactions, monthKey)),
    [transactions, monthKey]
  );
  const surplus = (monthIncome || income) - monthExpenses;
  const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : 0;
  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + g.current, 0);
  const netWorth = totalSaved - totalDebt;
  const tier = detectCurrentTier(income, monthExpenses, totalSaved, totalDebt);
  const tc = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
  const fireNumber = calcFireNumber(income * 0.5);

  // Spending chart - last 6 months
  const last6 = getLastNMonths(6);
  const chartData = useMemo(
    () =>
      last6.map((mk) => ({
        month: mk.slice(5),
        expenses: Math.round(sumTransactions(getExpensesForMonth(transactions, mk))),
        income: Math.round(sumTransactions(getIncomeForMonth(transactions, mk)) || income),
      })),
    [transactions, last6, income]
  );

  // Category breakdown this month
  const spending = useMemo(
    () => getSpendingByCategory(transactions, monthKey),
    [transactions, monthKey]
  );
  const topCategories = useMemo(
    () =>
      Object.entries(spending)
        .map(([cat, amt]) => ({
          cat,
          label: CATEGORY_LABELS[cat] || cat,
          amt,
          budget: budgetCategories.find((b) => b.category === cat)?.monthlyLimit || 0,
          color: budgetCategories.find((b) => b.category === cat)?.color || "#9CA3AF",
        }))
        .sort((a, b) => b.amt - a.amt)
        .slice(0, 6),
    [spending, budgetCategories]
  );

  // Recent transactions
  const recent = transactions.slice(0, 8);

  // Tier milestones for urgency actions
  const urgencies = useMemo(() => {
    const actions: string[] = [];
    if (monthExpenses / income > 0.8)
      actions.push("Essentials over 80% of income — identify and cut one large expense this week.");
    if (totalDebt > 0)
      actions.push(`You have ${fmt(totalDebt)} in debt. Use the avalanche method in Debts page.`);
    const efGoal = savingsGoals.find((g) => g.name.toLowerCase().includes("emergency"));
    if (efGoal && efGoal.current < efGoal.target)
      actions.push(`Emergency fund is ${Math.round((efGoal.current / efGoal.target) * 100)}% funded. Keep contributing monthly.`);
    if (savingsRate < 20)
      actions.push(`Savings rate is ${savingsRate}%. Target 20% — find GH₵${Math.max(0, Math.round(income * 0.2 - surplus)).toLocaleString()} more monthly.`);
    if (actions.length === 0)
      actions.push("Review your investment allocation and consider opening a GSE brokerage account.");
    return actions.slice(0, 3);
  }, [income, monthExpenses, totalDebt, savingsGoals, savingsRate, surplus]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {profile.name ? `Hello, ${profile.name}` : "Your Financial Dashboard"}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{formatMonthKey(monthKey)}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly surplus"
          value={fmtShort(surplus)}
          sub={`${savingsRate}% savings rate`}
          accent={surplus >= 0 ? "#16A34A" : "#DC2626"}
        />
        <MetricCard
          label="Net worth"
          value={fmtShort(netWorth)}
          sub={`${totalDebt > 0 ? fmt(totalDebt) + " debt" : "No debt"}`}
          accent={netWorth >= 0 ? "#2563EB" : "#DC2626"}
        />
        <MetricCard
          label="Monthly spend"
          value={fmtShort(monthExpenses)}
          sub={`${Math.round((monthExpenses / income) * 100)}% of income`}
        />
        <MetricCard
          label="FIRE target"
          value={fmtShort(fireNumber)}
          sub="25× annual expenses"
        />
      </div>

      {/* Tier status + urgencies */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center justify-center text-center py-8">
          <ProgressRing pct={(tier / 5) * 100} size={88} stroke={7} color={tc.color}>
            <span className="text-2xl font-bold" style={{ color: tc.color }}>{tier}</span>
          </ProgressRing>
          <div className="mt-3">
            <TierBadge tier={tier} label={`Tier ${tier}: ${tc.name}`} size="lg" />
          </div>
          <p className="text-xs text-gray-400 mt-2 max-w-[160px] leading-relaxed">
            {tc.description}
          </p>
          <Link href="/tiers" className="btn-ghost text-xs mt-3 flex items-center gap-1">
            View all tiers <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="card md:col-span-2">
          <div className="section-title">Top actions for you right now</div>
          <div className="space-y-3">
            {urgencies.map((u, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: tc.light, color: tc.dark }}
                >
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{u}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
            <Link href="/expenses" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add expense
            </Link>
            <Link href="/budget" className="btn-secondary text-xs">
              View budget
            </Link>
          </div>
        </div>
      </div>

      {/* Chart + recent transactions */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Income vs expenses — last 6 months">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400 text-sm">
              <AlertCircle className="w-8 h-8 mb-2" />
              Add transactions to see your chart
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={18} barGap={4}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }}
                  formatter={(v: number) => [`GH₵ ${v.toLocaleString()}`, ""]}
                />
                <Bar dataKey="income" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" />Income</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-900 inline-block" />Expenses</span>
          </div>
        </SectionCard>

        <SectionCard
          title="This month's spending"
          action={<Link href="/expenses" className="text-xs text-gray-400 hover:text-gray-600">See all →</Link>}
        >
          {topCategories.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400 text-sm">
              <AlertCircle className="w-8 h-8 mb-2" />
              No expenses logged this month
            </div>
          ) : (
            <div className="space-y-1">
              {topCategories.map(({ cat, label, amt, budget, color }) => (
                <BudgetBar key={cat} label={label} spent={amt} limit={budget || amt * 1.2} color={color} compact />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent transactions */}
      <SectionCard
        title="Recent transactions"
        action={<Link href="/expenses" className="text-xs text-gray-400 hover:text-gray-600">View all →</Link>}
      >
        {recent.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No transactions yet. <Link href="/expenses" className="text-gray-600 underline">Add your first one.</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                    {CATEGORY_LABELS[t.category]?.slice(0, 2).toUpperCase() || "TX"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{t.description || CATEGORY_LABELS[t.category]}</div>
                    <div className="text-xs text-gray-400">{t.date} · {CATEGORY_LABELS[t.category]}</div>
                  </div>
                </div>
                <span className={`text-sm font-medium ${t.type === "income" ? "text-green-600" : "text-gray-900"}`}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
