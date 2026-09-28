'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle2, FileUp, Loader2, Save, AlertTriangle } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';

type Extracted = {
  patient_name:string; medication:string; strength:string; dosage_form:string; prescriber:string; instructions:string;
  refills_authorized:number; prescription_date:string; expiry_date:string; provider_organization:string;
  missing_fields:string[]; ambiguous_fields:string[]; confidence:Record<string,number>;
};

function toDateInputValue(value?:string|null){
  return value&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:'';
}

export default function NewPrescriptionPage(){
  const [file,setFile]=useState<File|null>(null), [text,setText]=useState(''), [busy,setBusy]=useState(false), [saving,setSaving]=useState(false), [message,setMessage]=useState('');
  const [data,setData]=useState<Extracted|null>(null);
  const [patientId,setPatientId]=useState(''), [providerId,setProviderId]=useState(''), [pharmacyId,setPharmacyId]=useState('');
  const [patients,setPatients]=useState<any[]>([]), [providers,setProviders]=useState<any[]>([]), [pharmacyName,setPharmacyName]=useState('');
  const [createRefill,setCreateRefill]=useState(true);

  // The server page that hosts this workflow already authorizes the pharmacy; this client fetches the scoped lookup lists.
  useEffect(()=>{loadLookups().catch(()=>{});},[]);

  async function extract(){
    setBusy(true);setMessage('');
    try{const f=new FormData();if(file)f.append('file',file);if(text.trim())f.append('text',text);const r=await fetch('/api/ai/extract',{method:'POST',body:f});const j=await r.json();if(!r.ok)throw new Error(j.error||'Extraction failed');const extracted=j.data as Extracted;setData({...extracted,prescription_date:toDateInputValue(extracted.prescription_date),expiry_date:toDateInputValue(extracted.expiry_date)});setMessage('AI extraction complete. Review every field before saving.');}
    catch(e:any){setMessage(e.message)}finally{setBusy(false)}
  }

  async function loadLookups(){
    const r=await fetch('/api/pharmacy/prescriptions?lookups=1'); const j=await r.json();
    if(r.ok){setPatients(j.patients||[]);setProviders(j.providers||[]);setPharmacyId(j.pharmacy?.id||'');setPharmacyName(j.pharmacy?.name||'');
      if(data?.patient_name){const p=(j.patients||[]).find((x:any)=>x.legal_name.toLowerCase()===data.patient_name.toLowerCase());if(p)setPatientId(p.id)}
      if(data?.provider_organization){const p=(j.providers||[]).find((x:any)=>x.name.toLowerCase()===data.provider_organization.toLowerCase());if(p)setProviderId(p.id)} }
  }
  async function save(){
    if(!data||!patientId||!pharmacyId)return setMessage('Select a registered patient and pharmacy before saving.');
    setSaving(true);setMessage('');
    try{const r=await fetch('/api/pharmacy/prescriptions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patient_id:patientId,pharmacy_id:pharmacyId,provider_organization_id:providerId||null,medication_name:data.medication,strength:data.strength,dosage_form:data.dosage_form,prescriber_name:data.prescriber,instructions:data.instructions,refills_authorized:data.refills_authorized,prescription_date:data.prescription_date||null,expiry_date:data.expiry_date||null,ai_confidence:Math.min(...Object.values(data.confidence).filter(Number.isFinite)),create_refill:createRefill,ai_ingested:true})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Save failed');setMessage(`Saved prescription${j.refill_id?' and created refill request':''}.`);}
    catch(e:any){setMessage(e.message)}finally{setSaving(false)}
  }
  const fields=data?Object.entries(data.confidence||{}):[];
  return <DashboardShell role="pharmacy" title="Create prescription / refill"><div className="mx-auto max-w-6xl"><Link href="/pharmacy" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={15}/> Back to pharmacy</Link>
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-3xl border border-line bg-white p-6"><div className="flex items-center gap-3"><div className="rounded-2xl bg-mint/10 p-3"><Bot className="text-mint"/></div><div><h2 className="text-xl font-bold">AI document ingestion</h2><p className="text-sm text-slate-500">Upload a prescription/fax or paste text. Gemini returns structured fields for human review.</p></div></div>
        <label className="mt-6 block rounded-2xl border-2 border-dashed border-line p-8 text-center cursor-pointer"><FileUp className="mx-auto text-slate-400"/><div className="mt-3 text-sm font-semibold">{file?file.name:'Choose PDF or image'}</div><div className="mt-1 text-xs text-slate-400">PDF, JPG, PNG, WebP, HEIC · up to 10 MB</div><input type="file" accept="application/pdf,image/*" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
        <div className="my-4 text-center text-xs text-slate-400">OR</div><textarea value={text} onChange={e=>setText(e.target.value)} rows={7} className="w-full rounded-2xl border border-line p-4 text-sm outline-none focus:ring-2 focus:ring-mint/30" placeholder="Paste prescription text here…"/>
        <button onClick={extract} disabled={busy||(!file&&!text.trim())} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 font-semibold text-white disabled:opacity-50">{busy?<><Loader2 className="animate-spin" size={17}/> Extracting…</>:<><Bot size={17}/> Extract with Gemini</>}</button>
        <p className="mt-3 text-xs leading-5 text-slate-400">Demo uses an external LLM API with synthetic data. AI extraction is advisory; pharmacy staff must verify the result.</p>
      </section>
      <section className="rounded-3xl border border-line bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Review before saving</h2><p className="text-sm text-slate-500">Correct anything uncertain or missing.</p></div>{data&&<CheckCircle2 className="text-mint"/>}</div>
        {!data?<div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Run extraction to populate this form.</div>:<>
        {(data.missing_fields.length||data.ambiguous_fields.length)&&<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"><div className="flex gap-2 font-semibold"><AlertTriangle size={16}/> Manual review required</div><div className="mt-2 text-amber-900">{[...data.missing_fields.map(x=>`Missing: ${x}`),...data.ambiguous_fields.map(x=>`Ambiguous: ${x}`)].join(' · ')}</div></div>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">{[['Patient',data.patient_name],['Medication',data.medication],['Strength',data.strength],['Dosage form',data.dosage_form],['Prescriber',data.prescriber],['Provider organization',data.provider_organization],['Instructions',data.instructions],['Authorized refills',String(data.refills_authorized)],['Prescription date',data.prescription_date],['Expiry date',data.expiry_date]].map(([label,value])=><label key={label} className="block"><span className="text-xs font-semibold text-slate-500">{label}</span><input type={label==='Prescription date'||label==='Expiry date'?'date':'text'} value={value} onChange={e=>setData({...data,[label==='Patient'?'patient_name':label==='Medication'?'medication':label==='Strength'?'strength':label==='Dosage form'?'dosage_form':label==='Prescriber'?'prescriber':label==='Provider organization'?'provider_organization':label==='Instructions'?'instructions':label==='Authorized refills'?'refills_authorized':label==='Prescription date'?'prescription_date':'expiry_date']:label==='Authorized refills'?Number(e.target.value):e.target.value} as Extracted)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"/></label>)}</div>
        <button onClick={loadLookups} className="mt-5 rounded-xl border border-line px-4 py-2 text-sm font-semibold">Load patient/provider matches</button>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-semibold text-slate-500">Registered patient</span><select value={patientId} onChange={e=>setPatientId(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"><option value="">Select patient</option>{patients.map(p=><option key={p.id} value={p.id}>{p.legal_name}</option>)}</select></label><label><span className="text-xs font-semibold text-slate-500">Registered provider</span><select value={providerId} onChange={e=>setProviderId(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm"><option value="">None / external provider</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
        <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={createRefill} onChange={e=>setCreateRefill(e.target.checked)}/> Create a refill request immediately</label>
        <button onClick={save} disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-mint px-4 py-3 font-semibold text-ink disabled:opacity-50">{saving?<><Loader2 className="animate-spin" size={17}/> Saving…</>:<><Save size={17}/> Save verified record</>}</button>
        </>}
        {message&&<div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</div>}
      </section>
    </div></div></DashboardShell>
}
