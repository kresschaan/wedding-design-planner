-- Venue setting for layouts (ballroom reception, church ceremony, outdoor garden).
-- Apply after init migration. Safe to re-run.

alter table public.layouts
  add column if not exists venue_setting text not null default 'ballroom';

alter table public.layouts
  drop constraint if exists layouts_venue_setting_check;

alter table public.layouts
  add constraint layouts_venue_setting_check
  check (venue_setting in ('ballroom', 'church', 'outdoor_garden'));

comment on column public.layouts.venue_setting is
  'Preset category: ballroom (reception), church (ceremony), outdoor_garden (tented / lawn).';
