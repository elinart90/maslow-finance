"use client";
import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Calendar, Clock } from "lucide-react";
import { getWeek, getYear, getMonth, getDate } from "date-fns";
import { useStore } from "@/lib/store";
import { DEFAULT_CADENCE_ITEMS } from "@/lib/constants";
import { PageHeader, SectionCard } from "@/components/ui";

type Tab = "weekly" | "monthly" | "annual";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEK_COLORS = {
  weekly_mon: { bg: "#FEF2F2", text: "#991B1B", border: "#DC2626", label: "Monday" },
  weekly_wed: { bg: "#FFF7ED", text: "#9A3412", border: "#EA580C", label: "Wednesday" },
  weekly_fri: { bg: "#FFFBEB", text: "#92400E", border: "#D97706", label: "Friday" },
};

function getWeekKey(date: Date) {
  return `${getYear(date)}-W${String(getWeek(date)).padStart(2, "0")}`;
}

function getMonthKey(date: Date) {
  return `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, "0")}`;
}

function getAnnualKey(date: Date) {
  return `${getYear(date)}`;
}

export default function CadencePage() {
  const { cadenceCompletions, completeCadenceItem, uncompleteCadenceItem } = useStore();
  const [tab, setTab] = useState<Tab>("weekly");

  const now = new Date();
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);
  const annualKey = getAnnualKey(now);
  const currentMonth = getMonth(now) + 1; // 1-indexed

  const weeklyMon = DEFAULT_CADENCE_ITEMS.filter((i) => i.frequency === "weekly_mon");
  const weeklyWed = DEFAULT_CADENCE_ITEMS.filter((i) => i.frequency === "weekly_wed");
  const weeklyFri = DEFAULT_CADENCE_ITEMS.filter((i) => i.frequency === "weekly_fri");
  const monthly = DEFAULT_CADENCE_ITEMS.filter((i) => i.frequency === "monthly");
  const annual = DEFAULT_CADENCE_ITEMS.filter((i) => i.frequency === "annual");

  function isDone(itemId: string, periodKey: string) {
    return cadenceCompletions.some((c) => c.itemId === itemId && c.periodKey === periodKey);
  }

  function toggle(itemId: string, periodKey: string) {
    if (isDone(itemId, periodKey)) {
      uncompleteCadenceItem(itemId, periodKey);
    } else {
      completeCadenceItem(itemId, periodKey);
    }
  }

  // Stats
  const weeklyItems = [...weeklyMon, ...weeklyWed, ...weeklyFri];
  const weeklyDone = weeklyItems.filter((i) => isDone(i.id, weekKey)).length;
  const monthlyDone = monthly.filter((i) => isDone(i.id, monthKey)).length;
  const annualDone = annual.filter((i) => isDone(i.id, annualKey)).length;

  function ChecklistItem({ itemId, periodKey, title, description }: {
    itemId: string; periodKey: string; title: string; description: string;
  }) {
    const done = isDone(itemId, periodKey);
    return (
      <button
        onClick={() => toggle(itemId, periodKey)}
        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
      >
        {done ? (
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-200 group-hover:text-gray-300" />
        )}
        <div>
          <div className={`text-sm font-medium ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
            {title}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</div>
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execution Cadence"
        subtitle="Your financial review system — weekly, monthly, annually"
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-sm text-center">
          <div className="text-2xl font-semibold text-gray-900">{weeklyDone}/{weeklyItems.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">This week</div>
          <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${weeklyItems.length > 0 ? (weeklyDone / weeklyItems.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl font-semibold text-gray-900">{monthlyDone}/{monthly.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">This month</div>
          <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${monthly.length > 0 ? (monthlyDone / monthly.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="card-sm text-center">
          <div className="text-2xl font-semibold text-gray-900">{annualDone}/{annual.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">This year</div>
          <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${annual.length > 0 ? (annualDone / annual.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white w-fit">
        {(["weekly", "monthly", "annual"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Weekly tab */}
      {tab === "weekly" && (
        <div className="space-y-4">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Week {getWeek(now)} · {now.toLocaleDateString("en-GH", { month: "long", day: "numeric", year: "numeric" })}
          </div>

          {([
            { freq: "weekly_mon" as const, items: weeklyMon },
            { freq: "weekly_wed" as const, items: weeklyWed },
            { freq: "weekly_fri" as const, items: weeklyFri },
          ]).map(({ freq, items }) => {
            const c = WEEK_COLORS[freq];
            const doneCount = items.filter((i) => isDone(i.id, weekKey)).length;
            return (
              <div
                key={freq}
                className="card"
                style={{ borderLeft: `3px solid ${c.border}`, borderRadius: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: c.bg, color: c.text }}
                  >
                    {c.label}
                  </div>
                  <span className="text-xs text-gray-400">{doneCount}/{items.length} done</span>
                </div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <ChecklistItem
                      key={item.id}
                      itemId={item.id}
                      periodKey={weekKey}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly tab */}
      {tab === "monthly" && (
        <div className="space-y-4">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            {now.toLocaleDateString("en-GH", { month: "long", year: "numeric" })}
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Monthly financial rituals</h2>
              <span className="text-xs text-gray-400">{monthlyDone}/{monthly.length} done</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${monthly.length > 0 ? (monthlyDone / monthly.length) * 100 : 0}%` }} />
            </div>
            <div className="space-y-1">
              {monthly.map((item) => (
                <ChecklistItem
                  key={item.id}
                  itemId={item.id}
                  periodKey={monthKey}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </div>

          <div className="card bg-gray-50">
            <div className="section-title">The monthly P&L mindset</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your month-end review is a board meeting with yourself. Total income vs total spend.
              Actual savings rate vs target. What was the biggest unplanned expense? What will you
              do differently next month? 30 minutes of honest reflection is worth more than any
              budgeting app.
            </p>
          </div>
        </div>
      )}

      {/* Annual tab */}
      {tab === "annual" && (
        <div className="space-y-4">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            {now.getFullYear()} annual calendar
          </div>
          <div className="space-y-3">
            {annual.map((item) => {
              const done = isDone(item.id, annualKey);
              const isCurrent = item.month === currentMonth;
              const isPast = (item.month || 0) < currentMonth;
              const isFuture = (item.month || 0) > currentMonth;

              return (
                <div
                  key={item.id}
                  className={`card transition-all ${isCurrent ? "border-gray-900 border" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 ${
                      done ? "bg-green-50" : isCurrent ? "bg-gray-900" : isPast ? "bg-gray-50" : "bg-gray-50"
                    }`}>
                      <div className={`text-lg font-bold leading-none ${
                        done ? "text-green-600" : isCurrent ? "text-white" : "text-gray-300"
                      }`}>
                        {String(item.month).padStart(2, "0")}
                      </div>
                      <div className={`text-[9px] font-medium mt-0.5 ${
                        done ? "text-green-500" : isCurrent ? "text-gray-300" : "text-gray-300"
                      }`}>
                        {MONTH_NAMES[(item.month || 1) - 1]?.slice(0, 3).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                          {isCurrent && <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-full">This month</span>}
                        </div>
                        <button onClick={() => toggle(item.id, annualKey)} className="flex-shrink-0">
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className={`w-5 h-5 ${isFuture ? "text-gray-100" : "text-gray-200 hover:text-gray-300"}`} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
