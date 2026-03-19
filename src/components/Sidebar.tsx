"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Receipt, PieChart, Target, CreditCard,
  TrendingUp, Calendar, Settings, Triangle, X, Menu,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { TIER_CONFIG } from "@/lib/constants";
import { detectCurrentTier, sumTransactions, getExpensesForMonth, getCurrentMonthKey } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "/budget", icon: PieChart, label: "Budget" },
  { href: "/savings", icon: Target, label: "Savings" },
  { href: "/debts", icon: CreditCard, label: "Debts" },
  { href: "/tiers", icon: TrendingUp, label: "Tier Progress" },
  { href: "/cadence", icon: Calendar, label: "Cadence" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { profile, transactions, debts } = useStore();

  const monthKey = getCurrentMonthKey();
  const monthExpenses = sumTransactions(getExpensesForMonth(transactions, monthKey));
  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
  const tier = detectCurrentTier(profile.monthlyIncome, monthExpenses, 0, totalDebt);
  const tc = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <Triangle className="w-4 h-4 text-gray-900 fill-gray-900" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm">Maslow Finance</div>
          <div className="text-gray-400 text-xs">Life savings system</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Tier status at bottom */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-3 rounded-lg bg-gray-800">
          <div className="text-xs text-gray-400 mb-1">Current tier</div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tc.color }}
            />
            <span className="text-white text-sm font-medium">
              {tier}. {tc.short}
            </span>
          </div>
          {profile.name && (
            <div className="text-gray-400 text-xs mt-1 truncate">
              {profile.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 flex-shrink-0 h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <Triangle className="w-3 h-3 text-gray-900 fill-gray-900" />
          </div>
          <span className="text-white font-semibold text-sm">Maslow Finance</span>
        </div>
        <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-64 bg-gray-900 flex flex-col h-full shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
