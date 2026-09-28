# MedRelay

> **Prescription refill coordination, from request to ready.**

MedRelay is a refill-coordination platform that connects **patients, pharmacies, and provider organizations** in one workflow. It helps make refill blockers visible, keeps the next action clear, and gives each role the tools they need to move a request forward.

## Why MedRelay?

A prescription refill can become fragmented across pharmacy processing, provider authorization, missing information, and insurance issues. Patients may not know what is happening, while pharmacies and providers have to coordinate across multiple steps.

MedRelay provides a shared workflow for:

**Request → Pharmacy Review → Provider Authorization → Insurance → Pharmacy Processing → Ready / Dispensed → Completed**

## What we built

### 🏥 Pharmacy
- Dashboard for active refill cases and workflow urgency
- Prescription creation and refill management
- Prescription document upload
- AI-assisted prescription information extraction
- Provider and patient association
- Refill status, blocker, next-action, and timeline tracking
- Insurance outcome tracking
- Ready / dispensed workflow

### 🩺 Provider Organization
- Review refill requests
- View relevant patient, prescription, and refill history
- Approve, reject, request information, or require a visit
- Track refill workflow and urgency

### 👤 Patient
- View medications and prescriptions
- Request refills
- See refill status and current blocker
- See the next step without exposing internal workflow scoring

### 🤖 AI-assisted document understanding
MedRelay can send a prescription document to Gemini and extract structured information such as:
- Patient
- Medication
- Strength
- Dosage form
- Prescriber
- Instructions
- Authorized refills
- Prescription / expiry dates
- Provider organization

AI is used for **document understanding and workflow assistance**, not clinical decision-making. Extracted information is intended for human review before use.

## Tech stack

- **Next.js 16** + React 19 + TypeScript
- **Tailwind CSS**
- **Supabase** — Auth, PostgreSQL, Row Level Security, Storage
- **Google Gemini API** — prescription document extraction
- **Vercel** — application deployment

## Project structure

```text
MedRelay/
├── app/
│   ├── api/
│   │   ├── ai/extract/              # Gemini prescription extraction
│   │   ├── pharmacy/prescriptions/  # Pharmacy prescription creation
│   │   ├── refills/                 # Refill APIs and transitions
│   │   └── access-requests/         # Pharmacy/provider access requests
│   ├── login/                       # Login
│   ├── register/                    # Registration
│   ├── pharmacy/                    # Pharmacy workspace
│   ├── provider/                    # Provider workspace
│   ├── patient/                     # Patient workspace
│   └── page.tsx                     # Landing page
├── components/                      # Shared UI
├── lib/                             # Auth, Supabase, workflow utilities
├── types/                            # TypeScript types
├── supabase/
│   ├── migrations/                  # Database migrations
│   └── functions/
│       └── medrelay-demo-account/   # Demo account provisioning
├── .env.example
├── package.json
└── README.md
```

## Run locally

### 1. Prerequisites

Install:

- Node.js 18+ (Node 20+ recommended)
- npm
- A Supabase project
- A Google Gemini API key

### 2. Clone the repository

```bash
git clone https://github.com/l3urk/MedRelay.git
cd MedRelay
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
```

### 5. Configure Supabase

The repository includes the database schema and migrations under `supabase/`.

For a fresh Supabase project, apply the migrations in order using the Supabase CLI or Supabase dashboard workflow.

The application expects Supabase Auth to be enabled.

> **Important:** Never put a Supabase service-role/secret key in a `NEXT_PUBLIC_*` variable or commit it to GitHub.

### 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 7. Production build

```bash
npm run build
npm run start
```

## Environment variables

| Variable | Required | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser Supabase client |
| `GEMINI_API_KEY` | Yes for AI extraction | Server-side Gemini API access |
| `GEMINI_MODEL` | Optional | Gemini model override |

For Vercel, configure the variables for the environments you deploy to and **redeploy after changing them**.


## Product scope

MedRelay is a **refill coordination layer**. It is not intended to replace:

- An EHR
- A pharmacy management system
- An insurer
- A prescribing system
- Clinical decision-making

Its purpose is to make the coordination between these actors clearer and more actionable.

## License

See [LICENSE](./LICENSE).
