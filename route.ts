import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_BYTES = 10 * 1024 * 1024;
const GEMINI_TIMEOUT_MS = 25_000;

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
        patient_name: { type: 'number' },
        medication: { type: 'number' },
        strength: { type: 'number' },
        dosage_form: { type: 'number' },
        prescriber: { type: 'number' },
        instructions: { type: 'number' },
        refills_authorized: { type: 'number' },
        prescription_date: { type: 'number' },
        expiry_date: { type: 'number' },
        provider_organization: { type: 'number' },
      },
    },
  },
  required: [
    'patient_name',
    'medication',
    'strength',
    'dosage_form',
    'prescriber',
    'instructions',
    'refills_authorized',
    'prescription_date',
    'expiry_date',
    'provider_organization',
    'missing_fields',
    'ambiguous_fields',
    'confidence',
  ],
};

function errorResponse(
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
) {
  console.error('[MedRelay AI]', message, extra);
  return NextResponse.json(
    {
      error: message,
      model: MODEL,
      ...extra,
    },
    { status },
  );
}

async function callGemini(
  apiKey: string,
  parts: Array<Record<string, unknown>>,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  const started = Date.now();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        MODEL,
      )}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: extractionSchema,
          },
        }),
        signal: controller.signal,
      },
    );

    const responseText = await response.text();
    let body: Record<string, unknown> | null = null;

    try {
      body = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Keep the raw response below when Gemini does not return JSON.
    }

    return {
      response,
      body,
      rawText: responseText,
      durationMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole('pharmacy');

    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

    if (!apiKey) {
      return errorResponse(
        'Gemini is not configured. GEMINI_API_KEY is missing from the server environment.',
        503,
        { configuration: 'missing_api_key' },
      );
    }

    const form = await request.formData();
    const file = form.get('file');
    const text = String(form.get('text') || '').trim();
    const parts: Array<Record<string, unknown>> = [];

    if (file instanceof File) {
      if (file.size > MAX_BYTES) {
        return errorResponse(
          'Document is too large. Maximum size is 10 MB.',
          413,
          { fileSize: file.size },
        );
      }

      const mimeType = file.type || 'application/octet-stream';

      if (
        ![
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/heic',
          'image/heif',
        ].includes(mimeType)
      ) {
        return errorResponse(
          'Upload a PDF or image (JPG, PNG, WebP, HEIC).',
          400,
          { mimeType },
        );
      }

      const bytes = Buffer.from(await file.arrayBuffer()).toString('base64');

      parts.push({
        inlineData: {
          mimeType,
          data: bytes,
          displayName: file.name,
        },
      });
    }

    if (text) {
      parts.unshift({
        text: `Prescription text supplied by the pharmacy:\n${text}`,
      });
    }

    if (!parts.length) {
      return errorResponse(
        'Upload a prescription document or paste prescription text.',
        400,
      );
    }

    parts.push({
      text: `You are MedRelay's document-understanding assistant.
Extract only information actually present in the prescription/document.
Never invent missing values.
Return empty strings for unavailable scalar fields.
List every missing or ambiguous important field.
Provide field-level confidence from 0 to 1.
This is extraction, not clinical decision-making: do not recommend dosage,
changes, approval, or whether medication should be supplied.
The pharmacy must review and correct the result before it is saved.`,
    });

    let result;

    try {
      result = await callGemini(apiKey, parts);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      if (message.toLowerCase().includes('abort')) {
        return errorResponse(
          `Gemini request timed out after ${GEMINI_TIMEOUT_MS / 1000} seconds.`,
          504,
          { provider: 'Google Gemini', timeoutMs: GEMINI_TIMEOUT_MS },
        );
      }

      return errorResponse(
        'Could not connect to the Gemini API.',
        502,
        { provider: 'Google Gemini', cause: message },
      );
    }

    const { response, body, rawText, durationMs } = result;

    if (!response.ok) {
      const googleError =
        body &&
        typeof body.error === 'object' &&
        body.error !== null
          ? body.error
          : null;

      const googleMessage =
        googleError &&
        'message' in googleError &&
        typeof googleError.message === 'string'
          ? googleError.message
          : rawText.slice(0, 2000);

      console.error('[MedRelay AI] Gemini API error', {
        status: response.status,
        statusText: response.statusText,
        model: MODEL,
        durationMs,
        googleError,
      });

      let status = 502;

      if (response.status === 400) status = 502;
      if (response.status === 401 || response.status === 403) status = 502;
      if (response.status === 429) status = 429;
      if (response.status === 503 || response.status === 504) status = 503;

      return errorResponse(
        `Gemini API rejected the extraction request (${response.status}).`,
        status,
        {
          provider: 'Google Gemini',
          providerStatus: response.status,
          providerStatusText: response.statusText,
          providerMessage: googleMessage,
          durationMs,
          model: MODEL,
        },
      );
    }

    if (!body) {
      return errorResponse(
        'Gemini returned an empty response.',
        502,
        {
          provider: 'Google Gemini',
          durationMs,
          model: MODEL,
        },
      );
    }

    const candidates = Array.isArray(body.candidates)
      ? body.candidates
      : [];

    const candidate = candidates[0] as
      | {
          content?: {
            parts?: Array<{ text?: string }>;
          };
          finishReason?: string;
          safetyRatings?: unknown;
        }
      | undefined;

    const raw = candidate?.content?.parts?.find(
      (part) => typeof part?.text === 'string' && part.text.length > 0,
    )?.text;

    if (!raw) {
      return errorResponse(
        'Gemini returned no structured extraction.',
        502,
        {
          provider: 'Google Gemini',
          durationMs,
          model: MODEL,
          finishReason: candidate?.finishReason || null,
          promptFeedback: body.promptFeedback || null,
          candidateCount: candidates.length,
          modelVersion: body.modelVersion || null,
          responseId: body.responseId || null,
        },
      );
    }

    try {
      const data = JSON.parse(raw);

      return NextResponse.json({
        data,
        model: MODEL,
        modelVersion: body.modelVersion || null,
        durationMs,
      });
    } catch (error) {
      return errorResponse(
        'Gemini returned text that was not valid JSON.',
        502,
        {
          provider: 'Google Gemini',
          durationMs,
          model: MODEL,
          finishReason: candidate?.finishReason || null,
          rawResponse: raw.slice(0, 3000),
          parseError:
            error instanceof Error ? error.message : String(error),
        },
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error('[MedRelay AI] Unexpected route error', error);

    return errorResponse(
      'The AI extraction route failed unexpectedly.',
      500,
      { cause: message },
    );
  }
}
