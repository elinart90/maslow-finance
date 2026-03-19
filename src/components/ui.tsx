"use client";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "@/lib/utils";

// ─── MetricCard ───────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  accent?: string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, sub, trend, accent, icon }: MetricCardProps) {
  return (
    <div className="card flex flex-col gap-1 min-w-0">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gray-300">{icon}</span>}
        {trend && !icon && (
          <span className={`text-xs ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-400"}`}>
            {trend === "up" ? <TrendingUp className="w-4 h-4" /> : trend === "down" ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </span>
        )}
      </div>
      <div
        className="text-2xl font-semibold leading-tight mt-1 truncate"
        style={accent ? { color: accent } : {}}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── BudgetBar ────────────────────────────────────────────────────────────────
interface BudgetBarProps {
  label: string;
  spent: number;
  limit: number;
  color?: string;
  showAmounts?: boolean;
  compact?: boolean;
}

export function BudgetBar({ label, spent, limit, color = "#6B7280", showAmounts = true, compact = false }: BudgetBarProps) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit;
  const barColor = over ? "#DC2626" : color;

  return (
    <div className={compact ? "py-1" : "py-2"}>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
        {showAmounts && (
          <span className={`text-xs flex-shrink-0 ml-2 ${over ? "text-red-600 font-medium" : "text-gray-400"}`}>
            {over ? "OVER " : ""}GH₵{Math.round(spent).toLocaleString()} / GH₵{Math.round(limit).toLocaleString()}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ─── TierBadge ────────────────────────────────────────────────────────────────
interface TierBadgeProps {
  tier: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const TIER_COLORS: Record<number, { bg: string; text: string; name: string }> = {
  1: { bg: "#FEF2F2", text: "#991B1B", name: "Physiological" },
  2: { bg: "#FFF7ED", text: "#9A3412", name: "Safety" },
  3: { bg: "#FFFBEB", text: "#92400E", name: "Love & Belonging" },
  4: { bg: "#F0FDF4", text: "#14532D", name: "Esteem" },
  5: { bg: "#EFF6FF", text: "#1E3A8A", name: "Self-Actualization" },
};

export function TierBadge({ tier, label, size = "md" }: TierBadgeProps) {
  const colors = TIER_COLORS[tier] || TIER_COLORS[1];
  const text = label || `Tier ${tier}`;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm"
      )}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {text}
    </span>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProgressRing ─────────────────────────────────────────────────────────────
interface ProgressRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}

export function ProgressRing({ pct, size = 80, stroke = 6, color = "#111827", children }: ProgressRingProps) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
        type === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"
      }`}
    >
      {message}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
export function SectionCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
