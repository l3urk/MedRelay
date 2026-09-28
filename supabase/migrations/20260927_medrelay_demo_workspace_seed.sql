-- Hackathon-only synthetic demo workspace data and automatic demo-case seeding.
-- No real PHI. Demo accounts are created by the medrelay-demo-account Edge Function.
insert into public.pharmacies(id,name,registration_status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DemoCare Pharmacy','active')
on conflict(id) do update set name=excluded.name;
insert into public.provider_organizations(id,name,organization_type,registration_status)
values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','DemoCare Medical Group','Physician Organization','active')
on conflict(id) do update set name=excluded.name;
insert into public.medications(id,name,strength,dosage_form)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Atorvastatin','20 mg','Tablet')
on conflict(id) do update set name=excluded.name;

create or replace function public.seed_demo_patient_data()
returns trigger language plpgsql security definer set search_path=''
as $$
declare prescription_id uuid; refill_id uuid;
begin
  insert into public.prescriptions(patient_id,medication_id,pharmacy_id,provider_organization_id,prescriber_name,instructions,refills_authorized,refills_used,prescription_date,expiry_date)
  select new.id,'dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Dr. Demo Provider','Take 1 tablet once daily',3,0,'2026-01-15','2027-01-15'
  where not exists(select 1 from public.prescriptions where patient_id=new.id)
  returning id into prescription_id;
  if prescription_id is not null then
    insert into public.refill_requests(prescription_id,status,current_blocker,next_action,requested_by)
    values(prescription_id,'WAITING_FOR_PROVIDER','Provider authorization required.','Provider organization reviews the refill request.',new.user_id)
    returning id into refill_id;
    insert into public.refill_events(refill_request_id,actor_type,actor_id,event_type,description) values
      (refill_id,'patient',new.user_id,'REQUESTED','Patient requested a refill.'),
      (refill_id,'pharmacy',null,'ROUTED_TO_PROVIDER','Pharmacy review routed the refill for provider authorization.');
  end if;
  return new;
end;
$$;
drop trigger if exists seed_demo_patient_data_trigger on public.patients;
create trigger seed_demo_patient_data_trigger after insert on public.patients for each row execute function public.seed_demo_patient_data();
revoke execute on function public.seed_demo_patient_data() from public,anon,authenticated;

create or replace function public.ensure_demo_workspace_membership()
returns trigger language plpgsql security definer set search_path=''
as $$
declare user_email text;
begin
  select email into user_email from auth.users where id=new.user_id;
  if lower(coalesce(user_email,''))='pharmacy@demo.test' then
    insert into public.pharmacy_memberships(user_id,pharmacy_id) values(new.user_id,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') on conflict(user_id) do nothing;
  elsif lower(coalesce(user_email,''))='provider@demo.test' then
    insert into public.provider_memberships(user_id,provider_organization_id) values(new.user_id,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') on conflict(user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists ensure_demo_workspace_membership_trigger on public.pharmacy_memberships;
create trigger ensure_demo_workspace_membership_trigger after insert on public.pharmacy_memberships for each row execute function public.ensure_demo_workspace_membership();
drop trigger if exists ensure_demo_provider_membership_trigger on public.provider_memberships;
create trigger ensure_demo_provider_membership_trigger after insert on public.provider_memberships for each row execute function public.ensure_demo_workspace_membership();
revoke execute on function public.ensure_demo_workspace_membership() from public,anon,authenticated;
