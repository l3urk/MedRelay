'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

type DemoRole = 'patient' | 'pharmacy' | 'provider';

const demoAccounts: Record<
  DemoRole,
  {
    label: string;
    email: string;
    password: string;
    icon: typeof UserRound;
  }
> = {
  patient: {
    label: 'Patient',
    email: 'patient@demo.com',
    password: 'PatientDemoPass2026',
    icon: UserRound,
  },
  pharmacy: {
    label: 'Pharmacy',
    email: 'pharmacy@demo.com',
    password: 'PharmacyDemoPass2026',
    icon: Building2,
  },
  provider: {
    label: 'Provider',
    email: 'provider@demo.com',
    password: 'ProviderDemoPass2026',
    icon: Stethoscope,
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState<DemoRole | null>(null);
  const [error, setError] = useState('');

  async function signIn(
    loginEmail: string,
    loginPassword: string,
    role?: DemoRole
  ) {
    setError('');

    if (role) {
      setDemoBusy(role);
    } else {
      setBusy(true);
    }

    const supabase = createClient();

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      setDemoBusy(null);
      return;
    }

    const userRole =
      role || (data.user?.user_metadata?.role as DemoRole) || 'patient';

    window.location.href = `/${userRole}`;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await signIn(email, password);
  }

  async function loginWithDemo(role: DemoRole) {
    const account = demoAccounts[role];

    await signIn(account.email, account.password, role);
  }

  return (
    <main className="min-h-screen bg-mist px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">
            M
          </span>
          Med<span className="text-mint">Relay</span>
        </Link>

        <div className="mx-auto mt-16 grid max-w-4xl overflow-hidden rounded-[32px] border border-line bg-white shadow-xl md:grid-cols-[.9fr_1.1fr]">
          {/* Left panel */}
          <div className="hidden bg-ink p-10 text-white md:block">
            <div className="text-sm font-bold uppercase tracking-widest text-mint">
              Secure workspace
            </div>

            <h1 className="display mt-6 text-4xl font-extrabold">
              See the refill. See the next action.
            </h1>

            <p className="mt-5 leading-7 text-slate-300">
              Sign in to your role-specific MedRelay workspace. Access is
              controlled by Supabase Auth and server-side authorization.
            </p>

            <div className="mt-12 space-y-4 text-sm text-slate-300">
              <div className="flex gap-3">
                <ShieldCheck className="text-mint" size={18} />
                Role-aware workspace routing
              </div>

              <div className="flex gap-3">
                <LockKeyhole className="text-mint" size={18} />
                Passwords handled by Supabase Auth
              </div>
            </div>
          </div>

          {/* Login panel */}
          <div className="p-7 md:p-10">
            <div className="text-sm font-bold uppercase tracking-widest text-mint">
              Welcome back
            </div>

            <h2 className="display mt-2 text-3xl font-extrabold">
              Sign in
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Use your MedRelay account credentials to continue.
            </p>

            {/* Demo accounts */}
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Demo accounts
                </span>

                <span className="text-xs text-slate-400">
                  Instant sign in
                </span>
              </div>

              <div className="grid gap-2">
                {(Object.keys(demoAccounts) as DemoRole[]).map((role) => {
                  const account = demoAccounts[role];
                  const Icon = account.icon;
                  const isLoading = demoBusy === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => loginWithDemo(role)}
                      disabled={busy || demoBusy !== null}
                      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left transition hover:border-mint hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink">
                        <Icon size={17} />
                      </span>

                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          {isLoading
                            ? 'Signing in…'
                            : `Login as ${account.label}`}
                        </span>

                        <span className="block text-xs text-slate-400">
                          {account.email}
                        </span>
                      </span>

                      {!isLoading && (
                        <ArrowRight
                          size={16}
                          className="text-slate-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                or sign in manually
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            {/* Normal login */}
            <form onSubmit={submit} className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold">
                  Email / identifier
                </span>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-line px-4">
                  <Mail size={17} className="text-slate-400" />

                  <input
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full py-3.5 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold">
                  Password
                </span>

                <input
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-xl border border-line px-4 py-3.5 outline-none focus:border-mint"
                  placeholder="Enter your password"
                />
              </label>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                disabled={busy || demoBusy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Signing in…' : 'Sign in'}
                <ArrowRight size={17} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Need an account?{' '}
              <Link
                className="font-semibold text-ink hover:underline"
                href="/register"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
