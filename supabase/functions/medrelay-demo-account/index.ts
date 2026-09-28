import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "patient" | "pharmacy" | "provider";

function isValidEmail(value: string) {
  const email = value.trim();
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;
  const domain = email.slice(at + 1);
  return domain.length >= 3 && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const role = body?.role as Role;
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const organizationName = String(body?.organization_name ?? "").trim();
    const displayName = String(body?.name ?? "Demo Patient").trim() || "Demo Patient";

    if (!["patient", "pharmacy", "provider"].includes(role)) throw new Error("Choose patient, pharmacy, or provider.");
    if (!isValidEmail(email)) throw new Error("Enter a valid email-style identifier.");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (role !== "patient" && organizationName.length < 2) throw new Error("Organization name is required.");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, role },
    });
    if (error) throw error;
    const userId = created.user.id;

    const { error: roleError } = await admin.from("users").update({ username: email.split("@")[0], role }).eq("id", userId);
    if (roleError) throw roleError;

    if (role === "pharmacy") {
      await admin.from("patients").delete().eq("user_id", userId);
      const { data: pharmacy, error: pharmacyError } = await admin.from("pharmacies").insert({ name: organizationName, registration_status: "active" }).select("id").single();
      if (pharmacyError) throw pharmacyError;
      const { error: membershipError } = await admin.from("pharmacy_memberships").insert({ user_id: userId, pharmacy_id: pharmacy.id });
      if (membershipError) throw membershipError;
    }

    if (role === "provider") {
      await admin.from("patients").delete().eq("user_id", userId);
      const { data: provider, error: providerError } = await admin.from("provider_organizations").insert({ name: organizationName, organization_type: "Physician Organization", registration_status: "active" }).select("id").single();
      if (providerError) throw providerError;
      const { error: membershipError } = await admin.from("provider_memberships").insert({ user_id: userId, provider_organization_id: provider.id });
      if (membershipError) throw membershipError;
    }

    if (role === "patient") {
      const { error: patientError } = await admin.from("patients").insert({ user_id: userId, legal_name: displayName });
      if (patientError) throw patientError;
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId, role, message: "Account created. You can sign in now." }), { status: 201, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create account.";
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
