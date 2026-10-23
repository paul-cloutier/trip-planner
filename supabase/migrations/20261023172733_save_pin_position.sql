-- Where we put the pin, when it differs from where Google put the place.
-- On the save rather than the place: places are shared across spaces, and
-- moving our pin must not move anyone else's.

alter table public.saves
  add column pin_lat double precision check (pin_lat between -90 and 90),
  add column pin_lng double precision check (pin_lng between -180 and 180),
  add constraint saves_pin_both_or_neither check ((pin_lat is null) = (pin_lng is null));
