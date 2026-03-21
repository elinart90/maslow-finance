"use client";
import Link from "next/link";
import { Flame } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Receipt, PieChart, Target, CreditCard,
  TrendingUp, Calendar, Settings, Triangle, X, Menu, LogOut,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { TIER_CONFIG } from "@/lib/constants";
import { detectCurrentTier, sumTransactions, getExpensesForMonth, getCurrentMonthKey } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/foundation", icon: Flame, label: "30-Day Foundation" },
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
  const [signingOut, setSigningOut] = useState(false);
  const { profile, transactions, debts, signOut } = useStore();

  const monthKey = getCurrentMonthKey();
  const monthExpenses = sumTransactions(getExpensesForMonth(transactions, monthKey));
  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
  const tier = detectCurrentTier(profile.monthlyIncome, monthExpenses, 0, totalDebt);
  const tc = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      // Clear onboarding flag so next login goes through onboarding check fresh
      if (typeof window !== "undefined") {
        localStorage.removeItem("maslow_onboarded");
        localStorage.removeItem("maslow_pending_name");
      }
      window.location.href = "/";
    } catch (e) {
      console.error("Sign out failed:", e);
      setSigningOut(false);
    }
  }

  // Avatar initials from profile name
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "MF";

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

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">

        {/* Current tier chip */}
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
          {/* Tier mini progress bar */}
          <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(tier / 5) * 100}%`, backgroundColor: tc.color }}
            />
          </div>
        </div>

        {/* User profile row + sign out */}
        <div className="flex items-center gap-2 px-1 pt-1">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: tc.color + "33", color: tc.color }}
          >
            {initials}
          </div>

          {/* Name + email truncated */}
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">
              {profile.name || "My Account"}
            </div>
            <div className="text-gray-500 text-[10px] truncate">
              Tier {tier} · {tc.name}
            </div>
          </div>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
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
        <div className="flex items-center gap-3">
          {/* Mobile sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-gray-400 hover:text-white disabled:opacity-50"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
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