"use client";
import { useState, useMemo } from "react";
import { Edit2, PieChart as PieIcon, CheckCircle, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  getBudgetUsage, getCurrentMonthKey, formatMonthKey,
  sumTransactions, getExpensesForMonth, getIncomeForMonth,
} from "@/lib/utils";
import { TIER_CONFIG, MONTHS } from "@/lib/constants";
import { PageHeader, TierBadge, SectionCard, MetricCard } from "@/components/ui";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const TIER_ORDER = [1, 2, 3, 4, 5] as const;

export default function BudgetPage() {
  const { budgetCategories, transactions, updateBudgetLimit, profile } = useStore();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const monthKey = `${selYear}-${String(selMonth).padStart(2, "0")}`;
  const usage = useMemo(() => getBudgetUsage(transactions, budgetCategories, monthKey), [transactions, budgetCategories, monthKey]);

  const totalBudget = budgetCategories.reduce((s, c) => s + c.monthlyLimit, 0);
  const totalSpent = sumTransactions(getExpensesForMonth(transactions, monthKey));
  const totalIncome = sumTransactions(getIncomeForMonth(transactions, monthKey)) || profile.monthlyIncome;
  const overBudgetCount = usage.filter((u) => u.over).length;

  const pieData = useMemo(
    () =>
      usage
        .filter((u) => u.spent > 0)
        .map((u) => ({ name: u.category.name, value: Math.round(u.spent), color: u.category.color })),
    [usage]
  );

  const byTier = useMemo(
    () =>
      TIER_ORDER.map((tier) => {
        const cats = usage.filter((u) => u.category.tier === tier);
        const spent = cats.reduce((s, c) => s + c.spent, 0);
        const budget = cats.reduce((s, c) => s + c.category.monthlyLimit, 0);
        const tc = TIER_CONFIG[tier];
        return { tier, name: tc.name, color: tc.color, spent: Math.round(spent), budget: Math.round(budget) };
      }),
    [usage]
  );

  function saveEdit(cat: string) {
    const v = parseFloat(editVal);
    if (!isNaN(v) && v >= 0) updateBudgetLimit(cat, v);
    setEditingCat(null);
    setEditVal("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        subtitle="Set limits and track actuals by category"
      />

      {/* Month selector */}
      <div className="flex gap-3">
        <select value={selMonth} onChange={(e) => setSelMonth(+e.target.value)} className="input w-36">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={selYear} onChange={(e) => setSelYear(+e.target.value)} className="input w-28">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total budgeted" value={`GH₵ ${totalBudget.toLocaleString()}`} />
        <MetricCard label="Total spent" value={`GH₵ ${Math.round(totalSpent).toLocaleString()}`} accent={totalSpent > totalBudget ? "#DC2626" : undefined} />
        <MetricCard label="Remaining" value={`GH₵ ${Math.max(0, Math.round(totalBudget - totalSpent)).toLocaleString()}`} accent="#16A34A" />
        <MetricCard label="Over budget" value={`${overBudgetCount} categories`} accent={overBudgetCount > 0 ? "#DC2626" : "#16A34A"} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Spending by tier">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTier} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.split(" ")[0]} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`GH₵ ${v.toLocaleString()}`, ""]} />
              <Bar dataKey="budget" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                {byTier.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Spending breakdown">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`GH₵ ${v.toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No spending data for this month
            </div>
          )}
        </SectionCard>
      </div>

      {/* Category budget rows by tier */}
      {TIER_ORDER.map((tier) => {
        const tierUsage = usage.filter((u) => u.category.tier === tier);
        const tc = TIER_CONFIG[tier];
        if (tierUsage.length === 0) return null;
        return (
          <div key={tier} className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tc.color }} />
              <h2 className="text-sm font-semibold text-gray-700">Tier {tier} — {tc.name}</h2>
              <TierBadge tier={tier} size="sm" label={`${tc.pct}% allocation`} />
            </div>
            <div className="space-y-3">
              {tierUsage.map(({ category, spent, pct, over }) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {over ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingCat === category.category ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="input w-24 text-xs py-1"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(category.category);
                              if (e.key === "Escape") setEditingCat(null);
                            }}
                            autoFocus
                          />
                          <button
                            className="btn-primary text-xs py-1 px-2"
                            onClick={() => saveEdit(category.category)}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className={`text-xs ${over ? "text-red-600 font-medium" : "text-gray-400"}`}>
                            GH₵{Math.round(spent).toLocaleString()} / GH₵{category.monthlyLimit.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setEditingCat(category.category);
                              setEditVal(String(category.monthlyLimit));
                            }}
                            className="text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: over ? "#DC2626" : category.color,
                      }}
                    />
                  </div>
                  {over && (
                    <div className="text-xs text-red-500 mt-1">
                      Over by GH₵{Math.round(spent - category.monthlyLimit).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
