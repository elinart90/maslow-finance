"use client";
import { useState, useMemo } from "react";
import { Plus, Trash2, Search, Filter, Receipt } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  fmt, generateId, getCurrentMonthKey, getTransactionsForMonth,
  sumTransactions, getExpensesForMonth, getIncomeForMonth,
  formatMonthKey, todayISO,
} from "@/lib/utils";
import { CATEGORY_LABELS, MONTHS } from "@/lib/constants";
import {
  PageHeader, Modal, EmptyState, TierBadge, MetricCard,
} from "@/components/ui";
import type { TransactionCategory, TransactionType } from "@/lib/types";

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS).sort((a, b) =>
  a[1].localeCompare(b[1])
);

export default function ExpensesPage() {
  const { transactions, addTransaction, deleteTransaction, budgetCategories } = useStore();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const monthKey = `${selYear}-${String(selMonth).padStart(2, "0")}`;

  // Form state
  const [form, setForm] = useState({
    date: todayISO(),
    amount: "",
    category: "food" as TransactionCategory,
    description: "",
    type: "expense" as TransactionType,
  });

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

  function handleAdd() {
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) return;
    addTransaction({
      date: form.date,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description.trim(),
      type: form.type,
    });
    setForm({ date: todayISO(), amount: "", category: "food", description: "", type: "expense" });
    setShowForm(false);
  }

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Track every cedi in and out"
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add transaction
          </button>
        }
      />

      {/* Month selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selMonth}
          onChange={(e) => setSelMonth(+e.target.value)}
          className="input w-36"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selYear}
          onChange={(e) => setSelYear(+e.target.value)}
          className="input w-28"
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2, now.getFullYear() + 3].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total income" value={fmt(totalIncome)} accent="#16A34A" />
        <MetricCard label="Total expenses" value={fmt(totalExpenses)} accent="#DC2626" />
        <MetricCard
          label="Net surplus"
          value={fmt(Math.abs(surplus))}
          sub={surplus < 0 ? "Deficit" : "Surplus"}
          accent={surplus >= 0 ? "#2563EB" : "#DC2626"}
        />
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search transactions..."
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

      {/* Transaction list */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No transactions"
          description={`No ${filterType !== "all" ? filterType + " " : ""}transactions found for ${formatMonthKey(monthKey)}.`}
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Add first transaction
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txns]) => (
            <div key={date} className="card">
              <div className="text-xs font-semibold text-gray-400 mb-3">
                {new Date(date + "T00:00:00").toLocaleDateString("en-GH", {
                  weekday: "long", month: "long", day: "numeric",
                })}
              </div>
              <div className="divide-y divide-gray-50">
                {txns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-semibold text-gray-500 flex-shrink-0 uppercase">
                        {CATEGORY_LABELS[t.category]?.slice(0, 2) || "TX"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {t.description || CATEGORY_LABELS[t.category]}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <Modal
          title="Add transaction"
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd}>Save transaction</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-2 border border-gray-200 rounded-lg overflow-hidden">
              {(["expense", "income"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      type,
                      category: type === "income" ? "salary" : "food",
                    }))
                  }
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
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Amount (GH₵)</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TransactionCategory }))}
              >
                {ALL_CATEGORIES.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="What was this for?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
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
              <button
                className="btn-danger"
                onClick={() => {
                  deleteTransaction(deleteId);
                  setDeleteId(null);
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this transaction? This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
