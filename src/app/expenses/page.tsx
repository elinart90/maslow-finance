"use client";
import { useState, useMemo } from "react";
import {
  Plus, Trash2, Search, Receipt, TrendingDown,
  TrendingUp, Flame, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  fmt, getCurrentMonthKey, getTransactionsForMonth,
  sumTransactions, getExpensesForMonth, getIncomeForMonth,
  formatMonthKey, todayISO,
} from "@/lib/utils";
import { CATEGORY_LABELS, MONTHS } from "@/lib/constants";
import { PageHeader, Modal, EmptyState, TierBadge, MetricCard } from "@/components/ui";
import type { TransactionCategory, TransactionType } from "@/lib/types";

// ─── Quick-add categories with emoji indicators ───────────────────────────────
const QUICK_CATS: { category: TransactionCategory; label: string; emoji: string }[] = [
  { category: "food",        label: "Food",      emoji: "🍽" },
  { category: "transport",   label: "Transport", emoji: "🚌" },
  { category: "airtime",     label: "Airtime",   emoji: "📱" },
  { category: "utilities",   label: "Utilities", emoji: "💡" },
  { category: "housing",     label: "Housing",   emoji: "🏠" },
  { category: "health",      label: "Health",    emoji: "💊" },
  { category: "family",      label: "Family",    emoji: "👨‍👩‍👧" },
  { category: "education",   label: "School",    emoji: "📚" },
  { category: "business",    label: "Business",  emoji: "💼" },
  { category: "entertainment",label: "Fun",      emoji: "🎉" },
  { category: "clothing",    label: "Clothing",  emoji: "👕" },
  { category: "investment",  label: "Invest",    emoji: "📈" },
  { category: "salary",      label: "Salary",    emoji: "💰" },
  { category: "side_income", label: "Side $",    emoji: "🤑" },
  { category: "other",       label: "Other",     emoji: "📦" },
];

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS).sort((a, b) =>
  a[1].localeCompare(b[1])
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === todayISO()) return "Today";
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return d.toLocaleDateString("en-GH", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function dayStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(new Set(dates)).sort().reverse();
  let streak = 0;
  const today = todayISO();
  let cursor = today;
  for (const d of unique) {
    if (d === cursor) {
      streak++;
      const prev = new Date(cursor + "T00:00:00");
      prev.setDate(prev.getDate() - 1);
      cursor = prev.toISOString().slice(0, 10);
    } else break;
  }
  return streak;
}

// ─── Quick Add Bar ────────────────────────────────────────────────────────────
function QuickAddBar({ onAdd }: { onAdd: (amount: number, cat: TransactionCategory, desc: string, type: TransactionType, date: string) => void }) {
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<TransactionCategory>("food");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [date, setDate] = useState(todayISO());
  const [expanded, setExpanded] = useState(false);
  const [selectedQuick, setSelectedQuick] = useState<TransactionCategory | null>(null);

  function submit() {
    const v = parseFloat(amount);
    if (!v || v <= 0) return;
    onAdd(v, cat, desc, type, date);
    setAmount("");
    setDesc("");
    setSelectedQuick(null);
  }

  function pickQuick(c: TransactionCategory, t: TransactionType = "expense") {
    setCat(c);
    setType(t);
    setSelectedQuick(c);
    setExpanded(true);
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Type toggle + date */}
      <div className="flex items-center gap-0 border-b border-gray-100">
        <button
          onClick={() => setType("expense")}
          className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${type === "expense" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <TrendingDown className="w-3.5 h-3.5" /> Expense
        </button>
        <button
          onClick={() => setType("income")}
          className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${type === "income" ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Income
        </button>
      </div>

      {/* Quick category pills */}
      <div className="p-3 border-b border-gray-50">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick select</div>
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_CATS.filter(q =>
            type === "income"
              ? ["salary", "side_income", "business", "other"].includes(q.category)
              : !["salary", "side_income"].includes(q.category)
          ).map(({ category, label, emoji }) => (
            <button
              key={category}
              onClick={() => pickQuick(category, type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedQuick === category
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              <span style={{ fontSize: 12 }}>{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount + description row */}
      <div className="p-3">
        <div className="flex gap-2 items-stretch">
          {/* Amount */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">GH₵</span>
            <input
              type="number"
              className="input pl-10 text-lg font-semibold"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
          </div>
          {/* Add button */}
          <button
            onClick={submit}
            disabled={!amount || parseFloat(amount) <= 0}
            className={`px-5 rounded-lg font-semibold text-sm text-white transition-all disabled:opacity-40 ${type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-gray-900 hover:bg-gray-800"}`}
          >
            Add
          </button>
        </div>

        {/* Expand for more details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2 transition-all"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Less options" : "Add description, date & category"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={cat}
                  onChange={(e) => { setCat(e.target.value as TransactionCategory); setSelectedQuick(null); }}
                >
                  {ALL_CATEGORIES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Bought vegetables from market"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { transactions, addTransaction, deleteTransaction, budgetCategories, profile } = useStore();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([todayISO()]));
  const [showFullForm, setShowFullForm] = useState(false);

  // Full form state
  const [form, setForm] = useState({
    date: todayISO(),
    amount: "",
    category: "food" as TransactionCategory,
    description: "",
    type: "expense" as TransactionType,
  });

  const monthKey = `${selYear}-${String(selMonth).padStart(2, "0")}`;
  const isCurrentMonth = monthKey === getCurrentMonthKey();

  const monthTxns = useMemo(
    () => getTransactionsForMonth(transactions, monthKey),
    [transactions, monthKey]
  );

  const filtered = useMemo(
    () =>
      monthTxns
        .filter((t) => filterType === "all" || t.type === filterType)
        .filter(
          (t) =>
            !search ||
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            CATEGORY_LABELS[t.category]?.toLowerCase().includes(search.toLowerCase())
        ),
    [monthTxns, filterType, search]
  );

  const totalExpenses = sumTransactions(getExpensesForMonth(transactions, monthKey));
  const totalIncome = sumTransactions(getIncomeForMonth(transactions, monthKey));
  const surplus = totalIncome - totalExpenses;

  // Daily streak — days with at least one expense logged
  const expenseDates = useMemo(
    () => transactions.filter((t) => t.type === "expense").map((t) => t.date),
    [transactions]
  );
  const streak = dayStreak(expenseDates);

  // Days active this month
  const daysActiveThisMonth = useMemo(() => {
    const dates = new Set(monthTxns.filter(t => t.type === "expense").map(t => t.date));
    return dates.size;
  }, [monthTxns]);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const tierOf = (cat: string) =>
    budgetCategories.find((b) => b.category === cat)?.tier || 1;

  function handleQuickAdd(
    amount: number,
    cat: TransactionCategory,
    desc: string,
    type: TransactionType,
    date: string
  ) {
    addTransaction({ date, amount, category: cat, description: desc, type });
  }

  function handleFullAdd() {
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) return;
    addTransaction({
      date: form.date,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description.trim(),
      type: form.type,
    });
    setForm({ date: todayISO(), amount: "", category: "food", description: "", type: "expense" });
    setShowFullForm(false);
  }

  function toggleDay(date: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        subtitle={`Track every cedi in and out${profile.name ? ` · ${profile.name}` : ""}`}
        action={
          <button className="btn-secondary text-xs" onClick={() => setShowFullForm(true)}>
            <Plus className="w-3.5 h-3.5" /> Full form
          </button>
        }
      />

      {/* Month selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selMonth} onChange={(e) => setSelMonth(+e.target.value)} className="input w-36">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={selYear} onChange={(e) => setSelYear(+e.target.value)} className="input w-28">
          {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{formatMonthKey(monthKey)}</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total income" value={fmt(totalIncome)} accent="#16A34A" />
        <MetricCard label="Total expenses" value={fmt(totalExpenses)} accent="#DC2626" />
        <MetricCard
          label="Net surplus"
          value={fmt(Math.abs(surplus))}
          sub={surplus < 0 ? "Deficit this month" : "Surplus this month"}
          accent={surplus >= 0 ? "#2563EB" : "#DC2626"}
        />
        <div className="card">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Daily streak</div>
          <div className="flex items-center gap-1.5">
            <Flame className={`w-5 h-5 ${streak >= 3 ? "text-orange-500" : "text-gray-300"}`} />
            <span className="text-2xl font-semibold">{streak}</span>
            <span className="text-sm text-gray-400">days</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {daysActiveThisMonth} day{daysActiveThisMonth !== 1 ? "s" : ""} tracked this month
          </div>
        </div>
      </div>

      {/* Quick add — only show for current month */}
      {isCurrentMonth && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-600">Quick add — today, {new Date().toLocaleDateString("en-GH", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <QuickAddBar onAdd={handleQuickAdd} />
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 text-xs font-medium capitalize transition-all ${
                filterType === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Daily transaction groups */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No transactions"
          description={`No ${filterType !== "all" ? filterType + " " : ""}transactions found for ${formatMonthKey(monthKey)}.`}
          action={
            isCurrentMonth ? undefined : (
              <button className="btn-primary" onClick={() => setShowFullForm(true)}>
                <Plus className="w-4 h-4" /> Add transaction
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, txns]) => {
            const dayExpenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            const dayIncome = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const isExpanded = expandedDays.has(date);
            const isToday = date === todayISO();

            return (
              <div key={date} className={`card p-0 overflow-hidden ${isToday ? "border-gray-900 border" : ""}`}>
                {/* Day header — always visible, clickable to expand/collapse */}
                <button
                  onClick={() => toggleDay(date)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    {/* Day number pill */}
                    <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? "bg-gray-900" : "bg-gray-50"}`}>
                      <span className={`text-[10px] font-semibold leading-none ${isToday ? "text-gray-400" : "text-gray-400"}`}>
                        {new Date(date + "T00:00:00").toLocaleDateString("en-GH", { month: "short" }).toUpperCase()}
                      </span>
                      <span className={`text-base font-bold leading-none ${isToday ? "text-white" : "text-gray-900"}`}>
                        {new Date(date + "T00:00:00").getDate()}
                      </span>
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isToday ? "text-gray-900" : "text-gray-700"}`}>
                        {dayLabel(date)}
                        {isToday && <span className="ml-2 text-[10px] font-semibold text-white bg-gray-900 px-2 py-0.5 rounded-full">Today</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {txns.length} transaction{txns.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Day totals */}
                    <div className="text-right">
                      {dayExpenses > 0 && (
                        <div className="text-sm font-semibold text-gray-900">
                          -{fmt(dayExpenses)}
                        </div>
                      )}
                      {dayIncome > 0 && (
                        <div className="text-xs font-medium text-green-600">
                          +{fmt(dayIncome)}
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded transactions */}
                {isExpanded && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {txns.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-4 py-3 group hover:bg-gray-50">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Category icon */}
                          <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-base flex-shrink-0">
                            {QUICK_CATS.find(q => q.category === t.category)?.emoji || "📦"}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {t.description || CATEGORY_LABELS[t.category]}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-400">{CATEGORY_LABELS[t.category]}</span>
                              <TierBadge tier={tierOf(t.category)} size="sm" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-sm font-semibold ${t.type === "income" ? "text-green-600" : "text-gray-900"}`}>
                            {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                          </span>
                          <button
                            onClick={() => setDeleteId(t.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Quick add inside today's day group */}
                    {isToday && (
                      <div className="px-4 py-3 bg-gray-50">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">GH₵</span>
                            <input
                              type="number"
                              className="input pl-10 py-2 text-sm"
                              placeholder="Quick add amount..."
                              id={`quick-inline-${date}`}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <select
                            className="input w-32 py-2 text-sm"
                            id={`quick-cat-${date}`}
                            defaultValue="food"
                          >
                            {QUICK_CATS.filter(q => !["salary","side_income"].includes(q.category)).map(({ category, label, emoji }) => (
                              <option key={category} value={category}>{emoji} {label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const amtEl = document.getElementById(`quick-inline-${date}`) as HTMLInputElement;
                              const catEl = document.getElementById(`quick-cat-${date}`) as HTMLSelectElement;
                              const v = parseFloat(amtEl?.value || "");
                              if (!v || v <= 0) return;
                              addTransaction({
                                date,
                                amount: v,
                                category: catEl?.value as TransactionCategory || "other",
                                description: "",
                                type: "expense",
                              });
                              if (amtEl) amtEl.value = "";
                            }}
                            className="btn-primary text-xs px-3"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full add form modal */}
      {showFullForm && (
        <Modal
          title="Add transaction"
          onClose={() => setShowFullForm(false)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowFullForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleFullAdd}>Save transaction</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-2 border border-gray-200 rounded-lg overflow-hidden">
              {(["expense", "income"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setForm((f) => ({
                    ...f, type,
                    category: type === "income" ? "salary" : "food",
                  }))}
                  className={`flex-1 py-2.5 text-sm font-medium capitalize transition-all ${
                    form.type === type ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Amount (GH₵)</label>
              <input type="number" className="input" placeholder="0.00" min="0" step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TransactionCategory }))}>
                {ALL_CATEGORIES.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input type="text" className="input" placeholder="What was this for?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal
          title="Delete transaction"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { deleteTransaction(deleteId); setDeleteId(null); }}>Delete</button>
            </>
          }
        >
          <p className="text-sm text-gray-600">Are you sure you want to delete this transaction? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}