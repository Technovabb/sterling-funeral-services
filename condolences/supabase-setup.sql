-- Sterling condolences: live guestbook on Supabase.
--
-- Run this whole file once in the Supabase dashboard: SQL Editor -> New query
-- -> paste -> Run. It is safe to run again; it only creates what is missing
-- and replaces the functions.
--
-- Then set the removal passcode with the one line at the very bottom (run it
-- on its own, with your own passcode typed in place of the placeholder). The
-- passcode is stored only as a hash and never appears in this repository.
--
-- What visitors can do with the public key, and nothing more:
--   * read the messages that have not been removed (never the email address)
--   * post a message, which a trigger checks for spam before accepting
-- Removing a message needs the passcode, via hide_condolence().

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists public.condolences (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null,
  name         text not null,
  relationship text,
  email        text,
  message      text not null,
  created_at   timestamptz not null default now(),
  hidden       boolean not null default false,
  ip_hash      text
);
create index if not exists condolences_slug_idx on public.condolences (slug, created_at desc);

alter table public.condolences enable row level security;

-- Column-level grants: the email address and the IP hash can be written but
-- never read back through the public key.
revoke all on public.condolences from anon, authenticated;
grant select (id, slug, name, relationship, message, created_at) on public.condolences to anon, authenticated;
grant insert (slug, name, relationship, email, message) on public.condolences to anon, authenticated;

drop policy if exists "read visible" on public.condolences;
create policy "read visible" on public.condolences
  for select to anon, authenticated using (not hidden);

drop policy if exists "anyone may post" on public.condolences;
create policy "anyone may post" on public.condolences
  for insert to anon, authenticated with check (not hidden);

-- Spam and abuse checks, run on every new message.
create or replace function private.check_condolence() returns trigger
language plpgsql security definer set search_path = public, private, extensions as $$
declare
  ip text := split_part(coalesce(
    current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
begin
  new.name := btrim(new.name);
  new.relationship := nullif(btrim(coalesce(new.relationship, '')), '');
  new.email := nullif(btrim(coalesce(new.email, '')), '');
  new.message := btrim(new.message);
  new.hidden := false;
  new.created_at := now();
  new.ip_hash := case when ip = '' then null else encode(digest(ip, 'sha256'), 'hex') end;

  if new.slug !~ '^[a-z0-9-]{3,100}$' then raise exception 'bad slug'; end if;
  if length(new.name) not between 1 and 80 then raise exception 'name length'; end if;
  if length(coalesce(new.relationship, '')) > 80 then raise exception 'relationship length'; end if;
  if length(coalesce(new.email, '')) > 200 then raise exception 'email length'; end if;
  if length(new.message) not between 2 and 2000 then raise exception 'message length'; end if;
  -- Links are the signature of spam; a condolence never needs one.
  if (new.name || ' ' || coalesce(new.relationship, '') || ' ' || new.message) ~* '(https?:|://|www\.|\.(com|net|org|ru|xyz|top|info)\M)' then
    raise exception 'links are not allowed';
  end if;
  -- No more than 3 messages from one connection in 10 minutes.
  if new.ip_hash is not null and (
    select count(*) from public.condolences
    where ip_hash = new.ip_hash and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'too many messages';
  end if;
  -- The same message twice on one page is a double-tap, not a second condolence.
  if exists (select 1 from public.condolences
             where slug = new.slug and message = new.message and created_at > now() - interval '1 day') then
    raise exception 'duplicate';
  end if;
  return new;
end $$;

drop trigger if exists condolences_check on public.condolences;
create trigger condolences_check before insert on public.condolences
  for each row execute function private.check_condolence();

-- Removal passcode, stored as a hash, plus a log of wrong guesses so the
-- passcode cannot be guessed by brute force.
create table if not exists private.admin (passcode_hash text not null);
create table if not exists private.admin_attempts (at timestamptz not null default now());

create or replace function private.passcode_ok(p_key text) returns boolean
language plpgsql security definer set search_path = private, extensions as $$
begin
  if (select count(*) from private.admin_attempts where at > now() - interval '1 hour') >= 20 then
    raise exception 'too many attempts, try again in an hour';
  end if;
  if exists (select 1 from private.admin where passcode_hash = encode(digest(coalesce(p_key, ''), 'sha256'), 'hex')) then
    return true;
  end if;
  insert into private.admin_attempts default values;
  return false;
end $$;

create or replace function public.check_passcode(p_key text) returns boolean
language sql security definer set search_path = private as $$
  select private.passcode_ok(p_key);
$$;

create or replace function public.hide_condolence(p_id uuid, p_key text) returns boolean
language plpgsql security definer set search_path = public, private as $$
begin
  if not private.passcode_ok(p_key) then return false; end if;
  update public.condolences set hidden = true where id = p_id;
  return found;
end $$;

revoke all on function public.check_passcode(text) from public;
revoke all on function public.hide_condolence(uuid, text) from public;
grant execute on function public.check_passcode(text) to anon, authenticated;
grant execute on function public.hide_condolence(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Set the removal passcode. Run this line ON ITS OWN after the above, with
-- your own passcode in place of CHOOSE-A-PASSCODE (12+ characters). Running
-- it again replaces the old passcode.
--
-- delete from private.admin; insert into private.admin values (encode(extensions.digest('CHOOSE-A-PASSCODE', 'sha256'), 'hex'));
