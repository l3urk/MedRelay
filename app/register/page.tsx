'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEMO_ACCOUNT_FUNCTION_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/config';
import { ArrowRight, Building2, CheckCircle2, LockKeyhole, Mail, UserRound, Warehouse } from 'lucide-react';

type Role = 'patient' | 'pharmacy' | 'provider';

const options = [
  ['patient', 'Patient', UserRound, 'Personal workspace'],
  ['pharmacy', 'Pharmacy', Warehouse, 'Pharmacy operations'],
  ['provider', 'Provider organization', Building2, 'Provider review'],
] as const;

export default function Register() {
  const [role, setRole] = useState<Role>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage(''); setError('');
    try {
      const res = await fetch(DEMO_ACCOUNT_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ role, email, password, organization_name: organization, name: name || 'Demo Patient' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not create the account.');
      setMessage('Account created. You can sign in now — no email confirmation is required for this demo.');
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the account.');
    } finally { setBusy(false); }
  }

  const selected = options.find(([r]) => r === role);
  const SelectedIcon = selected?.[2] || UserRound;

  return (
    <main className="min-h-screen bg-mist px-5 py-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">M</span>Med<span className="text-mint">Relay</span></Link>
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-ink">Already have access? Sign in</Link>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-[32px] border border-line bg-white shadow-xl lg:grid-cols-[.82fr_1.18fr]">
          <aside className="bg-ink p-8 text-white md:p-10">
            <div className="text-sm font-bold uppercase tracking-widest text-mint">Create access</div>
            <h1 className="display mt-5 text-4xl font-extrabold leading-tight">Choose a workspace. Start with the same simple flow.</h1>
            <p className="mt-5 leading-7 text-slate-300">Create a demo account for the role you want to explore. You can switch between workspaces by signing out and signing in with another account.</p>

            <div className="mt-8 space-y-3">
              {options.map(([r, t, I, d]) => {
                const Icon = I;
                return <button key={r} type="button" onClick={() => { setRole(r); setMessage(''); setError(''); }} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${role === r ? 'border-mint bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/[.08]'}`}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${role === r ? 'bg-mint text-ink' : 'bg-white/10 text-slate-300'}`}><Icon size={19} /></div><div><div className="font-bold">{t}</div><div className="mt-0.5 text-xs text-slate-400">{d}</div></div></button>;
              })}
            </div>

            <div className="mt-8 space-y-4 text-sm text-slate-300">
              <div className="flex gap-3"><CheckCircle2 className="shrink-0 text-mint" size={18} /> Role-aware workspace access</div>
              <div className="flex gap-3"><LockKeyhole className="shrink-0 text-mint" size={18} /> Supabase Auth handles passwords</div>
              <div className="flex gap-3"><CheckCircle2 className="shrink-0 text-mint" size={18} /> No email confirmation in demo mode</div>
            </div>
          </aside>

          <section className="p-7 md:p-10">
            <div className="text-sm font-bold uppercase tracking-widest text-mint">Create your account</div>
            <h2 className="display mt-2 text-3xl font-extrabold md:text-4xl">Set up your {selected?.[1].toLowerCase()} workspace.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Choose a role on the left, then enter the details below.</p>

            <div className="mt-7 rounded-2xl border border-mint/30 bg-mist p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-mint"><SelectedIcon size={17} /></div>
                <div><div className="text-sm font-bold">{selected?.[1]} selected</div><div className="text-xs text-slate-500">{selected?.[3]}</div></div>
              </div>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold">Email / login identifier</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-line px-4 focus-within:border-mint">
                  <Mail size={17} className="text-slate-400" /><input required type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full py-3.5 outline-none" placeholder="anything@example.com" />
                </div>
                <span className="mt-1 block text-xs text-slate-400">Any normal email-style domain works in this demo.</span>
              </label>

              {role === 'patient' && <label className="block"><span className="text-sm font-semibold">Name</span><input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3.5 outline-none focus:border-mint" placeholder="Your name" /></label>}

              {role !== 'patient' && <label className="block"><span className="text-sm font-semibold">{role === 'pharmacy' ? 'Pharmacy name' : 'Provider organization name'}</span><input required value={organization} onChange={e => setOrganization(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3.5 outline-none focus:border-mint" placeholder={role === 'pharmacy' ? 'Example Pharmacy' : 'Example Medical Group'} /></label>}

              <label className="block">
                <span className="text-sm font-semibold">Password</span>
                <input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3.5 outline-none focus:border-mint" placeholder="At least 8 characters" />
              </label>

              {message && <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{message}</div>}
              {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                {busy ? 'Creating account…' : 'Create account'} <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-7 border-t border-line pt-6 text-center text-sm text-slate-500">
              Already have an account? <Link href="/login" className="font-bold text-ink hover:text-mint">Sign in</Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
