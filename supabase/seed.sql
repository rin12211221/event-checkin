with inserted_event as (
  insert into public.events (
    slug, name, restaurant_name, offer, location_name, address, date_label
  ) values (
    'campus-free-food-demo',
    'Campus Free Food Night',
    'Demo Restaurant',
    'Free meal for registered students',
    'Demo Restaurant',
    '123 Campus Ave, San Jose, CA',
    'Thursday · 6:00–8:00 PM'
  )
  on conflict (slug) do update set name = excluded.name
  returning id
)
insert into public.clubs (event_id, name, slug)
select id, club.name, club.slug
from inserted_event
cross join (
  values ('KASA', 'kasa'), ('VSA', 'vsa'), ('KSA', 'ksa')
) as club(name, slug)
on conflict (event_id, slug) do nothing;
