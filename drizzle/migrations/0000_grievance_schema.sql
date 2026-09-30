create type public.app_role as enum ('admin','official');
create type public.complaint_status as enum ('submitted','received','assigned','in_progress','resolved','closed','reopened');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.bootstrap_first_official()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'official') then
    insert into public.user_roles(user_id, role) values (new.id, 'official');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_official after insert on auth.users
for each row execute function public.bootstrap_first_official();

create sequence public.complaint_seq start 4821;

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  phone text not null,
  village text not null,
  district text,
  description text not null,
  category text not null default 'other',
  department text not null default 'Block Development Office',
  ai_summary text,
  priority text not null default 'medium',
  latitude double precision,
  longitude double precision,
  location_text text,
  media jsonb not null default '[]'::jsonb,
  status complaint_status not null default 'submitted',
  sla_due timestamptz,
  action_taken text,
  resolution_notes text,
  before_media jsonb not null default '[]'::jsonb,
  after_media jsonb not null default '[]'::jsonb,
  citizen_confirmed boolean,
  citizen_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_complaint_code()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.code is null then
    new.code := 'GRV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.complaint_seq')::text, 6, '0');
  end if;
  return new;
end $$;
create trigger complaints_code before insert on public.complaints for each row execute function public.set_complaint_code();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
create trigger complaints_touch before update on public.complaints for each row execute function public.touch_updated_at();

grant select, update on public.complaints to authenticated;
grant all on public.complaints to service_role;
grant usage on sequence public.complaint_seq to service_role;
alter table public.complaints enable row level security;
create policy "officials read complaints" on public.complaints for select to authenticated using (public.has_role(auth.uid(),'official'));
create policy "officials update complaints" on public.complaints for update to authenticated using (public.has_role(auth.uid(),'official'));

create table public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status complaint_status not null,
  note text,
  actor text not null default 'system',
  created_at timestamptz not null default now()
);
grant select, insert on public.complaint_events to authenticated;
grant all on public.complaint_events to service_role;
alter table public.complaint_events enable row level security;
create policy "officials read events" on public.complaint_events for select to authenticated using (public.has_role(auth.uid(),'official'));
create policy "officials add events" on public.complaint_events for insert to authenticated with check (public.has_role(auth.uid(),'official'));

create policy "officials read evidence" on storage.objects for select to authenticated using (bucket_id = 'evidence' and public.has_role(auth.uid(),'official'));
create policy "officials upload evidence" on storage.objects for insert to authenticated with check (bucket_id = 'evidence' and public.has_role(auth.uid(),'official'));