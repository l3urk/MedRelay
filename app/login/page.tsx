'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowRight,Building2,LockKeyhole,Mail,ShieldCheck,UserRound,Warehouse} from 'lucide-react';
import {createClient} from '@/lib/supabase/browser';
import {DEMO_ACCOUNT_FUNCTION_URL,SUPABASE_PUBLISHABLE_KEY} from '@/lib/supabase/config';

type Role='patient'|'pharmacy'|'provider';
const demos={
  patient:{label:'Patient',email:'patient@demo.com',password:'PatientDemoPass2026',icon:UserRound,description:'Patient workspace'},
  pharmacy:{label:'Pharmacy',email:'pharmacy@demo.com',password:'PharmacyDemoPass2026',icon:Warehouse,description:'Pharmacy operations'},
  provider:{label:'Provider organization',email:'provider@demo.com',password:'ProviderDemoPass2026',icon:Building2,description:'Provider review workspace'},
} as const;

async function provisionDemo(role:Role){
  const d=demos[role];
  const res=await fetch(DEMO_ACCOUNT_FUNCTION_URL,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({role,email:d.email,password:d.password,organization_name:role==='pharmacy'?'DemoCare Pharmacy':role==='provider'?'DemoCare Medical Group':undefined,name:'Demo Patient'})});
  return res;
}

export default function Login(){
  const[role,setRole]=useState<Role>('patient');
  const[email,setEmail]=useState<string>(demos.patient.email);
  const[password,setPassword]=useState<string>(demos.patient.password);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[notice,setNotice]=useState('');
  function choose(next:Role){setRole(next);setEmail(demos[next].email);setPassword(demos[next].password);setError('');setNotice('');}
  async function signIn(selectedRole:Role,emailValue=email,passwordValue=password){
    setBusy(true);setError('');setNotice('');
    const supabase=createClient();
    const {data,error:loginError}=await supabase.auth.signInWithPassword({email:emailValue.trim(),password:passwordValue});
    if(loginError){setError(loginError.message);setBusy(false);return;}
    const {data:profile}=await supabase.from('users').select('role').eq('id',data.user.id).maybeSingle();
    if(!profile?.role){await supabase.auth.signOut();setError('This account is not provisioned for a MedRelay workspace yet.');setBusy(false);return;}
    if(profile.role!==selectedRole){await supabase.auth.signOut();setError(`This account is a ${profile.role} account. Choose that workspace above.`);setBusy(false);return;}
    window.location.href=`/${profile.role}`;
  }
  async function demoLogin(){
  const d=demos[role];
  await signIn(role,d.email,d.password);
}
  async function submit(e:React.FormEvent){e.preventDefault();await signIn(role,email,password)}
  const Icon=demos[role].icon;
  return <main className="min-h-screen bg-mist px-5 py-8 md:py-10"><div className="mx-auto max-w-6xl"><div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">M</span>Med<span className="text-mint">Relay</span></Link><Link href="/register" className="text-sm font-semibold text-slate-600">Create account</Link></div>
    <div className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-[32px] border border-line bg-white shadow-xl lg:grid-cols-[.82fr_1.18fr]">
      <aside className="bg-ink p-8 text-white md:p-10"><div className="text-sm font-bold uppercase tracking-widest text-mint">Working demo</div><h1 className="display mt-5 text-4xl font-extrabold leading-tight">Pick a workspace. Press demo login. Start exploring.</h1><p className="mt-5 leading-7 text-slate-300">The judge demo uses pre-defined credentials so nobody has to type or remember anything.</p><div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5"><div className="text-xs font-bold uppercase tracking-widest text-slate-400">Demo credentials</div><div className="mt-4 space-y-3 text-sm"><div><span className="text-slate-400">Patient</span><br/><span className="font-semibold">patient@demo.com</span> <span className="text-slate-400">/</span> <span className="font-semibold">PatientDemoPass2026</span></div><div><span className="text-slate-400">Pharmacy</span><br/><span className="font-semibold">pharmacy@demo.com</span> <span className="text-slate-400">/</span> <span className="font-semibold">PharmacyDemoPass2026</span></div><div><span className="text-slate-400">Provider</span><br/><span className="font-semibold">provider@demo.com</span> <span className="text-slate-400">/</span> <span className="font-semibold">ProviderDemoPass2026</span></div></div></div><div className="mt-7 space-y-3 text-sm text-slate-300"><div className="flex gap-3"><ShieldCheck className="text-mint" size={18}/> Role-aware workspace access</div><div className="flex gap-3"><LockKeyhole className="text-mint" size={18}/> Supabase Auth handles passwords</div><div className="flex gap-3"><Mail className="text-mint" size={18}/> Demo accounts do not require email confirmation</div></div></aside>
      <section className="p-7 md:p-10"><div className="text-sm font-bold uppercase tracking-widest text-mint">Welcome to MedRelay</div><h2 className="display mt-2 text-3xl font-extrabold md:text-4xl">Who are you logging in as?</h2><p className="mt-3 text-sm leading-6 text-slate-500">Choose the workspace first. Demo credentials are loaded automatically.</p>
        <div className="mt-7 grid gap-3 md:grid-cols-3">{(Object.keys(demos) as Role[]).map(r=>{const D=demos[r];const I=D.icon;return <button key={r} type="button" onClick={()=>choose(r)} className={`rounded-2xl border p-4 text-left transition ${role===r?'border-mint bg-mist shadow-sm':'border-line hover:border-slate-300'}`}><I size={20} className={role===r?'text-mint':'text-slate-400'}/><div className="mt-4 text-sm font-bold">{D.label}</div><div className="mt-1 text-xs text-slate-500">{D.description}</div></button>})}</div>
        <div className="mt-7 rounded-2xl border border-mint/30 bg-mist p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-mint"><Icon size={17}/></div><div><div className="text-sm font-bold">{demos[role].label} demo selected</div><div className="text-xs text-slate-500">{email} · password loaded automatically</div></div></div></div>
        <button type="button" onClick={demoLogin} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-mint py-3.5 font-bold text-ink disabled:opacity-60">{busy?'Opening demo…':'Login with demo account'} <ArrowRight size={17}/></button>
        <div className="my-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-line"/>or sign in manually<span className="h-px flex-1 bg-line"/></div>
        <form onSubmit={submit} className="space-y-5"><label className="block"><span className="text-sm font-semibold">Email / login identifier</span><div className="mt-2 flex items-center gap-3 rounded-xl border border-line px-4"><Mail size={17} className="text-slate-400"/><input required value={email} onChange={e=>setEmail(e.target.value)} type="text" className="w-full py-3.5 outline-none" placeholder="anything@example.com"/></div><span className="mt-1 block text-xs text-slate-400">Demo mode accepts any normal email-style domain, not just Gmail.</span></label><label className="block"><span className="text-sm font-semibold">Password</span><input required value={password} onChange={e=>setPassword(e.target.value)} type="password" className="mt-2 w-full rounded-xl border border-line px-4 py-3.5 outline-none focus:border-mint"/></label>{notice&&<div className="rounded-xl bg-mint/10 p-3 text-sm text-ink">{notice}</div>}{error&&<div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-3.5 font-semibold disabled:opacity-60">{busy?'Signing in…':'Sign in'} <ArrowRight size={17}/></button></form>
      </section></div></div></main>
}
