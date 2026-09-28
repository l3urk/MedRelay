import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_BYTES = 10 * 1024 * 1024;

const extractionSchema = {
  type: 'object',
  properties: {
    patient_name: { type: 'string' },
    medication: { type: 'string' },
    strength: { type: 'string' },
    dosage_form: { type: 'string' },
    prescriber: { type: 'string' },
    instructions: { type: 'string' },
    refills_authorized: { type: 'integer' },
    prescription_date: { type: 'string' },
    expiry_date: { type: 'string' },
    provider_organization: { type: 'string' },
    missing_fields: { type: 'array', items: { type: 'string' } },
    ambiguous_fields: { type: 'array', items: { type: 'string' } },
    confidence: {
      type: 'object',
      properties: {
        patient_name: { type: 'number' }, medication: { type: 'number' },
        strength: { type: 'number' }, dosage_form: { type: 'number' },
        prescriber: { type: 'number' }, instructions: { type: 'number' },
        refills_authorized: { type: 'number' }, prescription_date: { type: 'number' },
        expiry_date: { type: 'number' }, provider_organization: { type: 'number' }
      }
    }
  },
  required: ['patient_name','medication','strength','dosage_form','prescriber','instructions','refills_authorized','prescription_date','expiry_date','provider_organization','missing_fields','ambiguous_fields','confidence']
};

export async function POST(request: Request) {
  await requireRole('pharmacy');
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to the server environment.' }, { status: 503 });

  const form = await request.formData();
  const file = form.get('file');
  const text = String(form.get('text') || '').trim();
  let parts: Array<Record<string, unknown>> = [];

  if (file instanceof File) {
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Document is too large. Maximum size is 10 MB.' }, { status: 413 });
    const mimeType = file.type || 'application/octet-stream';
    if (!['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(mimeType)) {
      return NextResponse.json({ error: 'Upload a PDF or image (JPG, PNG, WebP, HEIC).' }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');
    parts.push({ inlineData: { mimeType, data: bytes, displayName: file.name } });
  }

  if (text) parts.unshift({ text: `Prescription text supplied by the pharmacy:\n${text}` });
  if (!parts.length) return NextResponse.json({ error: 'Upload a prescription document or paste prescription text.' }, { status: 400 });

  parts.push({ text: `You are MedRelay's document-understanding assistant. Extract only information actually present in the prescription/document. Never invent missing values. Return empty strings for unavailable scalar fields, list every missing or ambiguous important field, and provide field-level confidence from 0 to 1. This is extraction, not clinical decision-making: do not recommend dosage, changes, approval, or whether medication should be supplied. The pharmacy must review and correct the result before it is saved.` });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: extractionSchema }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: `Gemini extraction failed (${response.status}).`, detail: detail.slice(0, 2000) }, { status: response.status === 429 ? 429 : 502 });
  }
  const payload = await response.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
  if (!raw) return NextResponse.json({ error: 'Gemini returned no structured extraction.' }, { status: 502 });
  try { return NextResponse.json({ data: JSON.parse(raw), model: MODEL }); }
  catch { return NextResponse.json({ error: 'Gemini returned invalid JSON.' }, { status: 502 }); }
}
