// Public Supabase connection settings for this hackathon demo.
// These values are safe for browser use; never put a service-role/secret key here.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ycqhylvglofmywiumktc.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_iW--5ua3FAoQR95a3E2ohQ_Nnohi8vC';

export const DEMO_ACCOUNT_FUNCTION_URL =
  `${SUPABASE_URL}/functions/v1/medrelay-demo-account`;
