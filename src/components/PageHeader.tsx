"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Optional right-aligned actions (buttons, toggles, etc.). */
  actions?: ReactNode;
  className?: string;
};

/**
 * Consistent page header used across dashboard pages:
 * a red rounded icon tile + title (+ optional subtitle) and optional actions.
 */
export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className = "",
}: Props) {
  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </header>
  );
}
