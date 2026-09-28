import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock3, FilePlus2, Pill, ShieldAlert, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth/require-role';
import { getWorkflowRisk, RiskBadge } from '@/lib/workflow/risk';
import type { RefillStatus } from '@/types/refill';

export const dynamic = 'force-dynamic';

export default async function Pharmacy() {
  const { supabase } = await requireRole('pharmacy');
  const { data } = await supabase.from('refill_requests').select('id,status,current_blocker,next_action,requested_at,updated_at,prescriptions(id,patients(legal_name),medications(name,strength))').order('updated_at', { ascending: false });
  const rows = (data ?? []).map((r: any) => ({ ...r, ...getWorkflowRisk(r.status as RefillStatus, r.requested_at) })).sort((a: any, b: any) => b.score - a.score);
  const top = rows.slice(0, 5);
  const active = rows.filter((r: any) => !['COMPLETED', 'CANCELLED', 'DISPENSED'].includes(r.status));
  const critical = active.filter((r: any) => r.risk === 'critical').length;
  const high = active.filter((r: any) => r.risk === 'high').length;
  const moving = active.filter((r: any) => ['PHARMACY_PROCESSING', 'READY_FOR_DISPENSE', 'PROVIDER_APPROVED', 'INSURANCE_APPROVED'].includes(r.status)).length;
  return <DashboardShell role="pharmacy" title="Refill operations">
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(16,32,51,.06)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><Sparkles size={14}/> Refill command center</div><h2 className="display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Keep every refill moving.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">See the cases that need attention first, understand what is blocking them, and move each refill to its next step.</p></div>
          <Link href="/pharmacy/prescriptions/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"><FilePlus2 size={17}/> Create prescription / refill</Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Active refills</span><Clock3 className="text-slate-400" size={18}/></div><div className="mt-3 text-3xl font-extrabold text-slate-900">{active.length}</div><div className="mt-1 text-xs text-slate-400">Current refill queue</div></div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-rose-700">Critical attention</span><ShieldAlert className="text-rose-500" size={18}/></div><div className="mt-3 text-3xl font-extrabold text-slate-900">{critical}</div><div className="mt-1 text-xs text-rose-600">Highest workflow urgency</div></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-amber-700">Needs attention</span><AlertTriangle className="text-amber-500" size={18}/></div><div className="mt-3 text-3xl font-extrabold text-slate-900">{high}</div><div className="mt-1 text-xs text-amber-600">Blocked or awaiting action</div></div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-emerald-700">Moving forward</span><CheckCircle2 className="text-emerald-500" size={18}/></div><div className="mt-3 text-3xl font-extrabold text-slate-900">{moving}</div><div className="mt-1 text-xs text-emerald-600">Approved, processing or ready</div></div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.55fr_.8fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="display text-xl font-bold text-slate-900">Workflow risk overview</h3><p className="mt-1 text-xs text-slate-500">Top 5 cases by workflow urgency and blockers — not a clinical risk score.</p></div><Link href="/pharmacy/refills" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">View all refills <ArrowRight size={14}/></Link></div>
          <div className="mt-5 space-y-3">
            {top.length ? top.map((item: any) => <Link key={item.id} href={`/pharmacy/refills/${item.id}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-mint/30"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><RiskBadge risk={item.risk}/><span className="text-[11px] font-semibold text-slate-400">{item.id.slice(0,8)} · {new Date(item.requested_at).toLocaleString()}</span></div><div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900"><Pill size={15} className="text-mint"/>{item.prescriptions?.medications?.name} {item.prescriptions?.medications?.strength ?? ''}</div><div className="mt-1 text-xs text-slate-500">{item.prescriptions?.patients?.legal_name} · {item.current_blocker || 'No blocker recorded'}</div></div><div className="w-full rounded-xl bg-slate-50 p-3 md:max-w-sm"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next action</div><div className="mt-1 text-xs font-semibold text-slate-700">{item.next_action || 'Review refill status'}</div></div></div></Link>) : <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No active refill cases yet.</div>}
          </div>
        </div>
        <div className="space-y-6"><div className="rounded-[24px] border border-slate-200 bg-white p-6"><div className="flex items-center gap-2"><Sparkles size={17} className="text-mint"/><h3 className="display text-lg font-bold">MedRelay insight</h3></div><p className="mt-4 text-sm leading-6 text-slate-600">The overview surfaces the cases most likely to slow the refill journey. Open a case to see its blocker, timeline and next action.</p><Link href="/pharmacy/refills" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ink hover:text-mint">View all refills <ArrowRight size={15}/></Link></div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6"><h3 className="display text-lg font-bold">Refill journey</h3><div className="mt-5 space-y-4">{[['Requested',active.filter((r:any)=>['REQUESTED','PHARMACY_REVIEW'].includes(r.status)).length],['Provider review',active.filter((r:any)=>['PROVIDER_AUTHORIZATION_REQUIRED','WAITING_FOR_PROVIDER'].includes(r.status)).length],['Insurance',active.filter((r:any)=>['INSURANCE_REQUIRED','WAITING_FOR_INSURANCE','INSURANCE_PROBLEM'].includes(r.status)).length],['Processing',active.filter((r:any)=>r.status==='PHARMACY_PROCESSING').length],['Ready',active.filter((r:any)=>r.status==='READY_FOR_DISPENSE').length]].map(([label,count],i)=><div key={label} className="flex items-center gap-3"><div className={`grid h-8 w-8 place-items-center rounded-full ${Number(count)>0?'bg-ink text-white':'bg-slate-100 text-slate-500'} text-xs font-bold`}>{count}</div><div className="flex-1"><div className="text-xs font-semibold text-slate-700">{label}</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${Number(count)>0?'w-3/4 bg-mint':'w-1/4 bg-slate-300'}`} /></div></div></div>)}</div></div></div>
      </section>
    </div>
  </DashboardShell>
}
