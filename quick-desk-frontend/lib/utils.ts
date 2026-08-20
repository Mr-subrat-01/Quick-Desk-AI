import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPriorityBadgeClass(priority?: string | null): string {
  switch (priority) {
    case 'HIGH':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'MEDIUM':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'LOW':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export function getStatusBadgeClass(status?: string | null): string {
  return status === 'RESOLVED'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
}
