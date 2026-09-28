import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, Eye, GitBranch, ShieldCheck, Sparkles, UsersRound, Workflow, Zap } from 'lucide-react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

const steps = [
  ['01', 'Request', 'A patient or pharmacy starts the refill request.'],
  ['02', 'Review', 'The pharmacy sees what is known and what is missing.'],
  ['03', 'Authorize', 'Clinical action is routed to the provider organization.'],
  ['04', 'Resolve', 'Insurance, information and processing blockers become explicit next actions.'],
  ['05', 'Complete', 'Ready, dispensed and completed states close the loop.'],
];

const roles = [
  ['Pharmacy', 'Operations', 'Turn scattered follow-ups into visible refill cases.'],
  ['Provider', 'Authorization', 'See exactly which cases need authorized clinical action.'],
  ['Patient', 'Visibility', 'Know what is happening, what is blocking progress and what comes next.'],
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <section className="relative overflow-hidden border-b border-line bg-mist">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-mint/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="container-x relative grid min-h-[700px] items-center gap-14 py-20 lg:grid-cols-[.94fr_1.06fr] lg:py-24">
            <div className="reveal">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-mint shadow-sm">
                <Sparkles size={14} /> Refill coordination layer
              </div>
              <h1 className="display max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-.04em] md:text-7xl">
                Close the refill <span className="text-mint">gap.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 md:text-xl">
                One shared operational view for pharmacies, provider organizations and patients — with the current state, blocker, owner, next action and history in one place.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/login" className="group flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-semibold text-white shadow-lg shadow-ink/10 transition hover:-translate-y-0.5">
                  Open working demo <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </Link>
                <Link href="/register" className="flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 font-semibold shadow-sm transition hover:border-slate-300 hover:-translate-y-0.5">
                  Create workspace <ArrowRight size={17} />
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-mint" /> Pharmacy + provider + patient</span>
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-mint" /> Human-controlled clinical decisions</span>
              </div>
            </div>

            <div className="relative reveal" style={{ animationDelay: '120ms' }}>
              <div className="soft overflow-hidden rounded-[30px] border border-line bg-white">
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-400">Live workflow</div>
                    <div className="mt-1 text-lg font-extrabold">Refill request #R-4821</div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">Waiting for provider</span>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <div className="rounded-2xl bg-mist p-4"><div className="text-xs font-medium text-slate-400">Patient</div><div className="mt-1 font-bold">Aarav Sharma</div></div>
                  <div className="rounded-2xl bg-mist p-4"><div className="text-xs font-medium text-slate-400">Medication</div><div className="mt-1 font-bold">Metformin 500 mg</div></div>
                </div>
                <div className="mx-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-600 shadow-sm"><Clock3 size={18} /></div>
                    <div><div className="text-sm font-bold text-slate-800">Current blocker</div><div className="text-sm text-slate-600">Provider authorization required.</div></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Journey</span><span className="text-xs font-semibold text-slate-400">4 of 5</span></div>
                  <div className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-line">
                    {['Request received', 'Pharmacy review', 'Provider request sent', 'Waiting for provider', 'Next: processing'].map((x, i) => (
                      <div key={x} className="relative flex items-center gap-4">
                        <div className={`z-10 h-3.5 w-3.5 rounded-full border-2 ${i < 3 ? 'border-mint bg-mint' : i === 3 ? 'border-amber-400 bg-amber-400 ring-4 ring-amber-50' : 'border-slate-200 bg-white'}`} />
                        <span className={`text-sm ${i < 4 ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>{x}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-7 -left-7 hidden rounded-2xl border border-line bg-white p-4 shadow-xl sm:block">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-mist text-mint"><Eye size={18} /></div><div><div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Core idea</div><div className="font-bold">One source of truth</div></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-white">
          <div className="container-x grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {roles.map(([title, label, text]) => (
              <div key={title} className="px-0 py-8 md:px-8 first:md:pl-0 last:md:pr-0">
                <div className="text-xs font-bold uppercase tracking-[.18em] text-mint">{title} · {label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="container-x scroll-mt-24 py-24 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-mint">The workflow</div>
              <h2 className="display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">A refill becomes a trackable journey.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">Instead of making each team reconstruct the story, MedRelay carries the operational state from request to completion.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {steps.map(([n, t, d]) => (
              <div key={n} className="group rounded-3xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-mint">{n}</span><ArrowRight size={15} className="text-slate-300 transition group-hover:text-mint" /></div>
                <h3 className="display mt-7 text-xl font-bold">{t}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-mist py-24 md:py-28">
          <div className="container-x">
            <div className="max-w-2xl">
              <div className="text-sm font-bold uppercase tracking-widest text-mint">Built around accountability</div>
              <h2 className="display mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">The product is the handoff.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Every meaningful transition keeps the case understandable for the next person who touches it.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                [Workflow, 'Shared workflow', 'One refill object carries state, blocker, owner and next action.'],
                [GitBranch, 'Human handoffs', 'The system coordinates work without replacing authorized clinical judgment.'],
                [Zap, 'Operational signals', 'Missing information, waiting states and next steps are surfaced where teams work.'],
                [ShieldCheck, 'Verified history', 'Meaningful transitions become events that can be reviewed later.'],
              ].map(([I, t, d]) => {
                const Icon = I as typeof Workflow;
                return <article key={t as string} className="rounded-3xl border border-line bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-mist text-mint"><Icon size={22} /></div><h3 className="display mt-6 text-xl font-bold">{t as string}</h3><p className="mt-3 leading-7 text-slate-500">{d as string}</p></article>;
              })}
            </div>
          </div>
        </section>

        <section className="container-x py-24 md:py-28">
          <div className="rounded-[32px] bg-ink px-7 py-12 text-white md:px-12 md:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div>
                <div className="text-sm font-bold uppercase tracking-widest text-mint">Working demo</div>
                <h2 className="display mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Three workspaces. One refill story.</h2>
                <p className="mt-5 max-w-2xl leading-8 text-slate-300">Use the preloaded Patient, Pharmacy or Provider organization demo account. The login screen fills the credentials for the judges.</p>
                <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-ink transition hover:-translate-y-0.5"><ArrowRight size={17} /> Launch demo</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {roles.map(([t, d]) => <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5"><UsersRound size={18} className="text-mint" /><div className="mt-5 font-bold">{t}</div><div className="mt-1 text-sm text-slate-400">{d}</div></div>)}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
