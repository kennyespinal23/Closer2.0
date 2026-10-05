-- Public editorial content; only dashboard/service-role administrators may write.
create table public.community_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  watch_url text not null check (watch_url ~ '^https://'),
  thumbnail_url text not null check (thumbnail_url ~ '^https://'),
  synopsis text,
  instagram_url text check (instagram_url is null or instagram_url ~ '^https://'),
  tiktok_url text check (tiktok_url is null or tiktok_url ~ '^https://'),
  youtube_url text check (youtube_url is null or youtube_url ~ '^https://'),
  published_at timestamptz not null default now(),
  is_published boolean not null default false
);
alter table public.community_videos enable row level security;
revoke all on public.community_videos from anon, authenticated;
grant select on public.community_videos to anon, authenticated;
create policy "Published videos are public" on public.community_videos
  for select to anon, authenticated
  using (is_published = true and published_at <= now());
create index community_videos_latest on public.community_videos (published_at desc, id desc) where is_published = true;
