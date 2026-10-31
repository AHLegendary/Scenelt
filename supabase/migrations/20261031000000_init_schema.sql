-- SceneIt initial schema: profiles, movies, rankings, watchlist, friendships.
--
-- Covers what the beta needs (accounts + head-to-head ranking + leaderboard).
-- Reviews, comments, reports and blends come in later migrations.
--
-- Rules this file follows (from the living doc):
--   * Every table has RLS enabled and explicit policies.
--   * Passwords live in Supabase Auth (auth.users), never in our tables.
--   * Users can only write their own rows.
--   * A user's rankings/watchlist are visible to everyone if their profile is
--     public, otherwise only to themselves and accepted friends.
--   * Scores and leaderboards are computed, not stored.


-- =========================================================== profiles

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  bio         text check (char_length(bio) <= 300),
  pronouns    text check (char_length(pronouns) <= 30),
  is_public   boolean not null default true,
  top_movies  integer[] not null default '{}' check (cardinality(top_movies) <= 3),
  created_at  timestamptz not null default now()
);

-- "Reil" and "reil" are the same username.
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- Every new auth user gets a profile. The client passes the username at signup:
--   supabase.auth.signUp({ email, password, options: { data: { username } } })
-- A missing/invalid/taken username makes the whole signup fail, so no account
-- is ever created without a profile.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =========================================================== movies
-- Cache of TMDb data, keyed by TMDb id. Anyone can read it. Only the server
-- (service role key, which skips RLS) and the seed file write to it, so users
-- can't put junk titles/posters in front of everyone else.

create table public.movies (
  tmdb_id       integer primary key,
  title         text not null,
  year          integer,
  poster_path   text,
  genres        text[] not null default '{}',
  overview      text not null default '',
  cached_at     timestamptz not null default now()
);


-- =========================================================== rankings
-- One row per (user, movie). `position` is the tier index, 0 = best.
-- Tied movies share a position, and positions are kept dense (0, 1, 2, ...)
-- by save_ranking / remove_ranking. That's the same shape as the tiers in
-- src/lib/localStore.js: [["a"], ["b","c"], ["d"]] = a:0, b:1, c:1, d:2.

create table public.rankings (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  movie_id    integer not null references public.movies (tmdb_id),
  position    integer not null check (position >= 0),
  created_at  timestamptz not null default now(),  -- first time it was ranked
  updated_at  timestamptz not null default now(),  -- last rank/rerank
  primary key (user_id, movie_id)
);

create index rankings_user_position_idx on public.rankings (user_id, position);
create index rankings_created_at_idx on public.rankings (created_at);


-- =========================================================== watchlist

create table public.watchlist (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  movie_id  integer not null references public.movies (tmdb_id),
  added_at  timestamptz not null default now(),
  primary key (user_id, movie_id)
);


-- =========================================================== friendships
-- One row per pair. requester sends, addressee accepts (status -> 'accepted')
-- or either side deletes the row to decline/unfriend.

create table public.friendships (
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  addressee_id  uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- Blocks a second request in the other direction (B -> A when A -> B exists).
create unique index friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id), greatest(requester_id, addressee_id)
);


-- =========================================================== access helpers
-- security definer so they can look at profiles/friendships without tripping
-- those tables' own RLS (which would recurse).

create function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- Can the current user see this user's profile, rankings and watchlist?
create function public.can_view_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target = auth.uid()
      or exists (select 1 from public.profiles p where p.id = target and p.is_public)
      or (auth.uid() is not null and public.are_friends(auth.uid(), target));
$$;

-- Username lookup for sending friend requests. Returns only id + username,
-- so private profiles can still be found without exposing anything else.
create function public.search_users(q text)
returns table (id uuid, username text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username
  from public.profiles p
  where auth.uid() is not null
    and char_length(trim(q)) >= 2
    and p.username ilike replace(replace(replace(trim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by p.username
  limit 20;
$$;


-- =========================================================== RLS

alter table public.profiles    enable row level security;
alter table public.movies      enable row level security;
alter table public.rankings    enable row level security;
alter table public.watchlist   enable row level security;
alter table public.friendships enable row level security;

-- profiles
create policy "profiles: visible if public, own, or friend"
  on public.profiles for select
  using (public.can_view_user(id));

create policy "profiles: users update their own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
-- No insert policy (the signup trigger creates rows) and no delete policy
-- (deleting the auth user cascades).

-- movies
create policy "movies: anyone can read"
  on public.movies for select
  using (true);

-- rankings
create policy "rankings: visible if owner is visible"
  on public.rankings for select
  using (public.can_view_user(user_id));

create policy "rankings: users insert their own"
  on public.rankings for insert
  with check (user_id = auth.uid());

create policy "rankings: users update their own"
  on public.rankings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "rankings: users delete their own"
  on public.rankings for delete
  using (user_id = auth.uid());

-- watchlist
create policy "watchlist: visible if owner is visible"
  on public.watchlist for select
  using (public.can_view_user(user_id));

create policy "watchlist: users insert their own"
  on public.watchlist for insert
  with check (user_id = auth.uid());

create policy "watchlist: users delete their own"
  on public.watchlist for delete
  using (user_id = auth.uid());

-- friendships
create policy "friendships: visible to both people"
  on public.friendships for select
  using (auth.uid() in (requester_id, addressee_id));

create policy "friendships: send a request as yourself"
  on public.friendships for insert
  with check (requester_id = auth.uid() and status = 'pending');

create policy "friendships: addressee accepts"
  on public.friendships for update
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid() and status = 'accepted');

create policy "friendships: either person removes"
  on public.friendships for delete
  using (auth.uid() in (requester_id, addressee_id));

-- Accepting a request may only change `status`, not who the request is between.
revoke update on public.friendships from anon, authenticated;
grant update (status) on public.friendships to authenticated;

-- Profiles: users can't rename their id or backdate created_at.
revoke update on public.profiles from anon, authenticated;
grant update (username, bio, pronouns, is_public, top_movies) on public.profiles to authenticated;


-- =========================================================== ranking functions
-- These run as the calling user (security invoker), so RLS still applies.
-- A per-user advisory lock serializes saves, so two tabs ranking at once
-- can't leave gaps or duplicate positions.

-- Puts a movie where head-to-head placement landed it. Moves it if it's
-- already ranked (that's how reranking saves). Mirrors placeMovie() in
-- src/lib/localStore.js:
--   tied = false: becomes its own tier at p_position (0 = best)
--   tied = true:  joins the existing tier at p_position
-- p_position past the end is clamped to the bottom.
create function public.save_ranking(p_movie_id integer, p_position integer, p_tied boolean default false)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  old_pos integer;
  first_ranked timestamptz;
  tier_count integer;
  at integer;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if p_position is null or p_position < 0 then
    raise exception 'Position must be 0 or more' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));

  -- Take it out first if it's already ranked, closing the gap if its tier
  -- is now empty.
  delete from public.rankings
  where user_id = uid and movie_id = p_movie_id
  returning position, created_at into old_pos, first_ranked;

  if old_pos is not null and not exists (
    select 1 from public.rankings where user_id = uid and position = old_pos
  ) then
    update public.rankings set position = position - 1
    where user_id = uid and position > old_pos;
  end if;

  select coalesce(max(position) + 1, 0) into tier_count
  from public.rankings where user_id = uid;

  at := least(p_position, tier_count);

  -- New tier: shift everything at or below it down one.
  if not (p_tied and at < tier_count) then
    update public.rankings set position = position + 1
    where user_id = uid and position >= at;
  end if;

  insert into public.rankings (user_id, movie_id, position, created_at, updated_at)
  values (uid, p_movie_id, at, coalesce(first_ranked, now()), now());
end;
$$;

-- Removes a movie from the current user's list and closes the gap.
create function public.remove_ranking(p_movie_id integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  old_pos integer;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));

  delete from public.rankings
  where user_id = uid and movie_id = p_movie_id
  returning position into old_pos;

  if old_pos is not null and not exists (
    select 1 from public.rankings where user_id = uid and position = old_pos
  ) then
    update public.rankings set position = position - 1
    where user_id = uid and position > old_pos;
  end if;
end;
$$;


-- =========================================================== leaderboard
-- Community leaderboard for movies ranked in the last week or month.
--
-- Each user's score for a movie uses the same formula as
-- src/features/ranking/scores.js: top of their list = 10, bottom = 1, ties
-- share the average of the positions they cover. Lists with fewer than 2
-- movies are skipped (no meaningful score). A movie's community score is the
-- average across users; `rankers` is how many users ranked it in the period.
--
-- security definer because it aggregates over everyone's rankings, including
-- private users. Only per-movie averages and counts come out, never who
-- ranked what.

create function public.get_leaderboard(
  p_period text default 'weekly',
  p_category text default 'highest',
  p_limit integer default 10
)
returns table (
  movie_id     integer,
  title        text,
  year         integer,
  poster_path  text,
  score        numeric,
  rankers      bigint,
  rank         bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with per_user as (
    select
      r.user_id,
      r.movie_id,
      r.created_at,
      count(*) over (partition by r.user_id) as total,
      count(*) over (partition by r.user_id, r.position) as tier_size,
      count(*) over (partition by r.user_id order by r.position
                     range between unbounded preceding and current row) as through_tier
    from public.rankings r
  ),
  scored as (
    select
      movie_id,
      user_id,
      1 + 9 * (1 - ((through_tier - tier_size) + (tier_size - 1) / 2.0) / (total - 1)) as user_score
    from per_user
    where total >= 2
      and created_at >= now() - case p_period
                                  when 'weekly' then interval '7 days'
                                  when 'monthly' then interval '30 days'
                                end
  ),
  agg as (
    select movie_id, round(avg(user_score), 1) as score, count(*) as rankers
    from scored
    group by movie_id
  )
  select
    m.tmdb_id, m.title, m.year, m.poster_path, a.score, a.rankers,
    row_number() over (
      order by
        case when p_category = 'watched' then a.rankers end desc nulls last,
        a.score desc,
        a.rankers desc,
        m.title
    ) as rank
  from agg a
  join public.movies m on m.tmdb_id = a.movie_id
  order by rank
  limit least(greatest(coalesce(p_limit, 10), 1), 100);
$$;


-- =========================================================== function access
-- Postgres lets everyone execute new functions by default; tighten that.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.save_ranking(integer, integer, boolean) from public, anon;
revoke execute on function public.remove_ranking(integer) from public, anon;
revoke execute on function public.search_users(text) from public, anon;
grant execute on function public.save_ranking(integer, integer, boolean) to authenticated;
grant execute on function public.remove_ranking(integer) to authenticated;
grant execute on function public.search_users(text) to authenticated;
grant execute on function public.get_leaderboard(text, text, integer) to anon, authenticated;
