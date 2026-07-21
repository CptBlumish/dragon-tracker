-- Broader Discord bot submission types for breeder workflows.

alter table public.discord_bot_submissions
  drop constraint if exists discord_bot_submissions_submission_type_check;

alter table public.discord_bot_submissions
  add constraint discord_bot_submissions_submission_type_check
  check (submission_type in (
    'dragon',
    'map_pin',
    'note',
    'egg_request',
    'upstat',
    'brood_pouch',
    'current_nest'
  ));
