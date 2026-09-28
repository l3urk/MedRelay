import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';


export async function GET(request: Request) {
  const { user, supabase } = await requireRole('pharmacy');
  const url = new URL(request.url);
  if (url.searchParams.get('lookups') !== '1') return NextResponse.json({ error: 'Unsupported query.' }, { status: 400 });
  const { data: membership } = await supabase.from('pharmacy_memberships').select('pharmacy_id, pharmacies(id,name)').eq('user_id', user.id).maybeSingle();
  const { data: patients } = await supabase.from('patients').select('id,legal_name').order('legal_name');
  const { data: providers } = await supabase.from('provider_organizations').select('id,name').order('name');
  return NextResponse.json({ pharmacy: membership?.pharmacies || null, patients: patients || [], providers: providers || [] });
}

export async function POST(request: Request) {
  const { user, supabase } = await requireRole('pharmacy');
  const body = await request.json();
  const required = ['patient_id','medication_name','pharmacy_id'];
  for (const key of required) if (!body[key]) return NextResponse.json({ error: `${key} is required.` }, { status: 400 });

  const { data: membership } = await supabase.from('pharmacy_memberships').select('pharmacy_id').eq('user_id', user.id).eq('pharmacy_id', body.pharmacy_id).maybeSingle();
  if (!membership) return NextResponse.json({ error: 'You are not authorized for this pharmacy.' }, { status: 403 });

  let medicationId = body.medication_id || null;
  if (!medicationId) {
    const { data: existing } = await supabase.from('medications').select('id').ilike('name', body.medication_name).eq('strength', body.strength || '').eq('dosage_form', body.dosage_form || '').limit(1).maybeSingle();
    if (existing) medicationId = existing.id;
    else {
      const { data: created, error } = await supabase.from('medications').insert({ name: body.medication_name, strength: body.strength || null, dosage_form: body.dosage_form || null }).select('id').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      medicationId = created.id;
    }
  }

  const { data: rx, error: rxError } = await supabase.from('prescriptions').insert({
    patient_id: body.patient_id, medication_id: medicationId, pharmacy_id: body.pharmacy_id,
    provider_organization_id: body.provider_organization_id || null,
    prescriber_name: body.prescriber_name || null, instructions: body.instructions || null,
    refills_authorized: Number(body.refills_authorized || 0), refills_used: 0,
    prescription_date: body.prescription_date || null, expiry_date: body.expiry_date || null,
    ai_confidence: body.ai_confidence ?? null, source_document_id: body.source_document_id || null
  }).select('id').single();
  if (rxError) return NextResponse.json({ error: rxError.message }, { status: 400 });

  let refillId: string | null = null;
  if (body.create_refill) {
    const status = body.provider_organization_id ? 'REQUESTED' : 'PHARMACY_REVIEW';
    const { data: refill, error: refillError } = await supabase.from('refill_requests').insert({
      prescription_id: rx.id, status, requested_by: user.id,
      current_blocker: body.provider_organization_id ? null : null,
      next_action: 'Pharmacy: review and process this refill request.'
    }).select('id').single();
    if (refillError) return NextResponse.json({ error: refillError.message }, { status: 400 });
    refillId = refill.id;
    await supabase.from('refill_events').insert({ refill_request_id: refillId, actor_type: 'pharmacy', actor_id: user.id, event_type: 'PHARMACY_REFILL_CREATED', description: 'Pharmacy created a refill request from a new prescription record.', metadata: { ai_ingested: Boolean(body.ai_ingested) } });
  }

  if (body.source_document) {
    await supabase.from('documents').update({ extraction_status: 'completed', extracted_data: body.source_document.extracted_data, extraction_confidence: body.source_document.extraction_confidence }).eq('id', body.source_document.id).eq('uploaded_by', user.id);
  }
  await supabase.from('audit_logs').insert({ actor_id: user.id, actor_role: 'pharmacy', action: 'CREATE_PRESCRIPTION', resource_type: 'prescription', resource_id: rx.id, metadata: { refill_id: refillId, ai_ingested: Boolean(body.ai_ingested) } });

  return NextResponse.json({ prescription_id: rx.id, refill_id: refillId });
}
