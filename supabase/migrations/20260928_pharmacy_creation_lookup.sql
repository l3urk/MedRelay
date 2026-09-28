-- Pharmacy staff need scoped lookup access to associate a new prescription with
-- an existing synthetic patient/provider during the demo. In production this
-- should be replaced with minimum-necessary patient matching/search controls.
drop policy if exists patients_select_pharmacy_directory on public.patients;
create policy patients_select_pharmacy_directory
on public.patients for select to authenticated
using (exists (select 1 from public.pharmacy_memberships pm where pm.user_id=(select auth.uid())));

drop policy if exists provider_orgs_select_pharmacy_directory on public.provider_organizations;
create policy provider_orgs_select_pharmacy_directory
on public.provider_organizations for select to authenticated
using (exists (select 1 from public.pharmacy_memberships pm where pm.user_id=(select auth.uid())));
