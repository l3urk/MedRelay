import type { RefillStatus } from '@/types/refill';

export type WorkflowRisk = 'critical' | 'high' | 'low';

const scores: Partial<Record<RefillStatus, number>> = {
  WAITING_FOR_PROVIDER: 95,
  PROVIDER_AUTHORIZATION_REQUIRED: 95,
  INSURANCE_PROBLEM: 88,
  INFORMATION_REQUIRED: 82,
  VISIT_REQUIRED: 82,
  REQUESTED: 70,
  PHARMACY_REVIEW: 65,
  WAITING_FOR_INSURANCE: 62,
  INSURANCE_REQUIRED: 62,
  PROVIDER_APPROVED: 45,
  INSURANCE_APPROVED: 40,
  PHARMACY_PROCESSING: 30,
  READY_FOR_DISPENSE: 20,
  DISPENSED: 10,
  COMPLETED: 0,
  CANCELLED: 0,
};

export function getWorkflowRisk(status: RefillStatus, requestedAt?: string | null): { risk: WorkflowRisk; score: number } {
  let score = scores[status] ?? 50;
  if (requestedAt) {
    const ageHours = Math.max(0, (Date.now() - new Date(requestedAt).getTime()) / 36e5);
    if (ageHours >= 24 && score > 0) score += 10;
    else if (ageHours >= 8 && score > 0) score += 5;
  }
  score = Math.min(100, score);
  return { risk: score >= 85 ? 'critical' : score >= 60 ? 'high' : 'low', score };
}

export const riskStyles = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export function RiskBadge({ risk }: { risk: WorkflowRisk }) {
  const label = risk === 'critical' ? 'Critical' : risk === 'high' ? 'High' : 'Low';
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${riskStyles[risk]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}
