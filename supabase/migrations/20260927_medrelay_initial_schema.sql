-- MedRelay production-oriented starter schema. No seed/demo data.
-- Applied to the connected Supabase project by the implementation workflow.
create extension if not exists pgcrypto;

create table if not exists public.users (id uuid primary key references auth.users(id) on delete cascade, username text, role text not null default 'patient' check (role in ('pharmacy','provider','patient')), created_at timestamptz not null default now());
create table if not exists public.pharmacies (id uuid primary key default gen_random_uuid(), name text not null, registration_status text not null default 'active', created_at timestamptz not null default now());
create table if not exists public.provider_organizations (id uuid primary key default gen_random_uuid(), name text not null, organization_type text, registration_status text not null default 'active', created_at timestamptz not null default now());
create table if not exists public.pharmacy_memberships (user_id uuid primary key references public.users(id) on delete cascade, pharmacy_id uuid not null references public.pharmacies(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.provider_memberships (user_id uuid primary key references public.users(id) on delete cascade, provider_organization_id uuid not null references public.provider_organizations(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.patients (id uuid primary key default gen_random_uuid(), user_id uuid unique references public.users(id) on delete cascade, legal_name text not null, date_of_birth date, created_at timestamptz not null default now());
create table if not exists public.medications (id uuid primary key default gen_random_uuid(), name text not null, strength text, dosage_form text, created_at timestamptz not null default now());
create table if not exists public.documents (id uuid primary key default gen_random_uuid(), file_name text not null, storage_path text not null unique, document_type text not null default 'prescription', uploaded_by uuid not null references public.users(id) on delete restrict, extraction_status text not null default 'pending' check (extraction_status in ('pending','processing','review_required','completed','failed')), extracted_data jsonb, extraction_confidence numeric check (extraction_confidence is null or (extraction_confidence between 0 and 1)), created_at timestamptz not null default now());
create table if not exists public.prescriptions (id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patients(id) on delete restrict, medication_id uuid not null references public.medications(id) on delete restrict, pharmacy_id uuid references public.pharmacies(id) on delete restrict, provider_organization_id uuid references public.provider_organizations(id) on delete restrict, prescriber_name text, instructions text, refills_authorized int not null default 0 check (refills_authorized >= 0), refills_used int not null default 0 check (refills_used >= 0), refills_remaining int generated always as (greatest(refills_authorized - refills_used, 0)) stored, prescription_date date, expiry_date date, source_document_id uuid references public.documents(id) on delete set null, ai_confidence numeric check (ai_confidence is null or (ai_confidence between 0 and 1)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.refill_requests (id uuid primary key default gen_random_uuid(), prescription_id uuid not null references public.prescriptions(id) on delete restrict, status text not null default 'REQUESTED' check (status in ('REQUESTED','PHARMACY_REVIEW','PROVIDER_AUTHORIZATION_REQUIRED','WAITING_FOR_PROVIDER','PROVIDER_APPROVED','PROVIDER_REJECTED','VISIT_REQUIRED','INFORMATION_REQUIRED','INSURANCE_REQUIRED','WAITING_FOR_INSURANCE','INSURANCE_APPROVED','INSURANCE_PROBLEM','PHARMACY_PROCESSING','READY_FOR_DISPENSE','DISPENSED','COMPLETED','CANCELLED')), current_blocker text, next_action text, requested_by uuid not null references auth.users(id) on delete restrict, requested_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz);
create table if not exists public.refill_events (id uuid primary key default gen_random_uuid(), refill_request_id uuid not null references public.refill_requests(id) on delete cascade, actor_type text not null check (actor_type in ('patient','pharmacy','provider','system')), actor_id uuid, event_type text not null, description text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null, actor_role text, action text not null, resource_type text not null, resource_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.access_requests (id uuid primary key default gen_random_uuid(), email text not null, requested_role text not null check (requested_role in ('pharmacy','provider')), organization_name text not null, message text, status text not null default 'pending' check (status in ('pending','approved','rejected')), created_at timestamptz not null default now());

create index if not exists prescriptions_patient_id_idx on public.prescriptions(patient_id);
create index if not exists prescriptions_pharmacy_id_idx on public.prescriptions(pharmacy_id);
create index if not exists prescriptions_provider_org_id_idx on public.prescriptions(provider_organization_id);
create index if not exists refill_requests_prescription_id_idx on public.refill_requests(prescription_id);
create index if not exists refill_requests_status_idx on public.refill_requests(status);
create index if not exists refill_events_request_id_created_idx on public.refill_events(refill_request_id, created_at);
create index if not exists audit_logs_resource_idx on public.audit_logs(resource_type, resource_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.users(id,username,role) values(new.id,split_part(coalesce(new.email,''),'@',1),'patient') on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists prescriptions_touch_updated_at on public.prescriptions;
create trigger prescriptions_touch_updated_at before update on public.prescriptions for each row execute function public.touch_updated_at();
drop trigger if exists refill_requests_touch_updated_at on public.refill_requests;
create trigger refill_requests_touch_updated_at before update on public.refill_requests for each row execute function public.touch_updated_at();

create or replace function public.is_pharmacy_member(p_pharmacy_id uuid) returns boolean language sql stable security invoker as $$ select exists(select 1 from public.pharmacy_memberships where user_id=(select auth.uid()) and pharmacy_id=p_pharmacy_id); $$;
create or replace function public.is_provider_member(p_provider_organization_id uuid) returns boolean language sql stable security invoker as $$ select exists(select 1 from public.provider_memberships where user_id=(select auth.uid()) and provider_organization_id=p_provider_organization_id); $$;
create or replace function public.is_patient_owner(p_patient_id uuid) returns boolean language sql stable security invoker as $$ select exists(select 1 from public.patients where id=p_patient_id and user_id=(select auth.uid())); $$;

alter table public.users enable row level security;
alter table public.pharmacies enable row level security;
alter table public.provider_organizations enable row level security;
alter table public.pharmacy_memberships enable row level security;
alter table public.provider_memberships enable row level security;
alter table public.patients enable row level security;
alter table public.medications enable row level security;
alter table public.documents enable row level security;
alter table public.prescriptions enable row level security;
alter table public.refill_requests enable row level security;
alter table public.refill_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.access_requests enable row level security;

grant select on public.users, public.pharmacies, public.provider_organizations, public.pharmacy_memberships, public.provider_memberships, public.patients, public.medications, public.documents, public.prescriptions, public.refill_requests, public.refill_events, public.audit_logs to authenticated;
grant insert,update on public.documents to authenticated;
grant insert,update on public.prescriptions, public.refill_requests to authenticated;
grant insert on public.refill_requests, public.refill_events, public.audit_logs to authenticated;
grant insert on public.access_requests to anon,authenticated;

-- Users are read-only to the client. Role is provisioned by trusted admin/onboarding logic.
drop policy if exists users_update_own on public.users;
create policy users_select_own on public.users for select to authenticated using ((select auth.uid())=id);
create policy pharmacies_select_member on public.pharmacies for select to authenticated using (public.is_pharmacy_member(id));
create policy provider_orgs_select_member on public.provider_organizations for select to authenticated using (public.is_provider_member(id));
create policy pharmacy_memberships_select_own on public.pharmacy_memberships for select to authenticated using ((select auth.uid())=user_id);
create policy provider_memberships_select_own on public.provider_memberships for select to authenticated using ((select auth.uid())=user_id);
create policy patients_select_self on public.patients for select to authenticated using (user_id=(select auth.uid()));
create policy patients_select_pharmacy on public.patients for select to authenticated using (exists(select 1 from public.prescriptions p where p.patient_id=id and p.pharmacy_id is not null and public.is_pharmacy_member(p.pharmacy_id)));
create policy patients_select_provider on public.patients for select to authenticated using (exists(select 1 from public.prescriptions p where p.patient_id=id and p.provider_organization_id is not null and public.is_provider_member(p.provider_organization_id)));
create policy medications_select_authenticated on public.medications for select to authenticated using (true);
create policy documents_select_uploader on public.documents for select to authenticated using (uploaded_by=(select auth.uid()));
create policy documents_insert_uploader on public.documents for insert to authenticated with check (uploaded_by=(select auth.uid()));
create policy documents_update_uploader on public.documents for update to authenticated using (uploaded_by=(select auth.uid())) with check (uploaded_by=(select auth.uid()));
create policy prescriptions_select_patient on public.prescriptions for select to authenticated using (public.is_patient_owner(patient_id));
create policy prescriptions_select_pharmacy on public.prescriptions for select to authenticated using (pharmacy_id is not null and public.is_pharmacy_member(pharmacy_id));
create policy prescriptions_select_provider on public.prescriptions for select to authenticated using (provider_organization_id is not null and public.is_provider_member(provider_organization_id));
create policy prescriptions_insert_pharmacy on public.prescriptions for insert to authenticated with check (pharmacy_id is not null and public.is_pharmacy_member(pharmacy_id));
create policy prescriptions_update_pharmacy on public.prescriptions for update to authenticated using (pharmacy_id is not null and public.is_pharmacy_member(pharmacy_id)) with check (pharmacy_id is not null and public.is_pharmacy_member(pharmacy_id));
create policy refill_select_patient on public.refill_requests for select to authenticated using (exists(select 1 from public.prescriptions p where p.id=prescription_id and public.is_patient_owner(p.patient_id)));
create policy refill_select_pharmacy on public.refill_requests for select to authenticated using (exists(select 1 from public.prescriptions p where p.id=prescription_id and p.pharmacy_id is not null and public.is_pharmacy_member(p.pharmacy_id)));
create policy refill_select_provider on public.refill_requests for select to authenticated using (exists(select 1 from public.prescriptions p where p.id=prescription_id and p.provider_organization_id is not null and public.is_provider_member(p.provider_organization_id)));
create policy refill_insert_patient on public.refill_requests for insert to authenticated with check (requested_by=(select auth.uid()) and exists(select 1 from public.prescriptions p where p.id=prescription_id and public.is_patient_owner(p.patient_id)));
create policy refill_insert_pharmacy on public.refill_requests for insert to authenticated with check (requested_by=(select auth.uid()) and exists(select 1 from public.prescriptions p where p.id=prescription_id and p.pharmacy_id is not null and public.is_pharmacy_member(p.pharmacy_id)));
create policy refill_update_pharmacy on public.refill_requests for update to authenticated using (exists(select 1 from public.prescriptions p where p.id=prescription_id and p.pharmacy_id is not null and public.is_pharmacy_member(p.pharmacy_id))) with check (exists(select 1 from public.prescriptions p where p.id=prescription_id and p.pharmacy_id is not null and public.is_pharmacy_member(p.pharmacy_id)));
create policy refill_update_provider on public.refill_requests for update to authenticated using (exists(select 1 from public.prescriptions p where p.id=prescription_id and p.provider_organization_id is not null and public.is_provider_member(p.provider_organization_id))) with check (exists(select 1 from public.prescriptions p where p.id=prescription_id and p.provider_organization_id is not null and public.is_provider_member(p.provider_organization_id)));
create policy events_select_visible on public.refill_events for select to authenticated using (exists(select 1 from public.refill_requests rr join public.prescriptions p on p.id=rr.prescription_id where rr.id=refill_request_id and (public.is_patient_owner(p.patient_id) or (p.pharmacy_id is not null and public.is_pharmacy_member(p.pharmacy_id)) or (p.provider_organization_id is not null and public.is_provider_member(p.provider_organization_id)))));
create policy events_insert_authenticated on public.refill_events for insert to authenticated with check (actor_id=(select auth.uid()));
create policy audit_insert_authenticated on public.audit_logs for insert to authenticated with check (actor_id=(select auth.uid()));
create policy audit_select_own on public.audit_logs for select to authenticated using (actor_id=(select auth.uid()));
create policy access_requests_insert_anyone on public.access_requests for insert to anon,authenticated with check (email<>'' and organization_name<>'');

insert into storage.buckets(id,name,public) values('prescription-documents','prescription-documents',false) on conflict(id) do nothing;
drop policy if exists documents_storage_select on storage.objects;
drop policy if exists documents_storage_insert on storage.objects;
drop policy if exists documents_storage_update on storage.objects;
create policy documents_storage_select on storage.objects for select to authenticated using (bucket_id='prescription-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy documents_storage_insert on storage.objects for insert to authenticated with check (bucket_id='prescription-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy documents_storage_update on storage.objects for update to authenticated using (bucket_id='prescription-documents' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='prescription-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
