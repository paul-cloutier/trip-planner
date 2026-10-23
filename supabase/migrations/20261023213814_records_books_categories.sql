-- Records and Books become categories of their own; Do goes away.
--
-- Expand step only: the check still accepts 'do', so nothing that writes it
-- fails while this deploys. A later migration, in its own commit, drops 'do'
-- from the check once nothing uses it.

alter table public.saves drop constraint saves_category_check;
alter table public.saves add constraint saves_category_check
  check (category in ('eat', 'coffee', 'drink', 'shop', 'records', 'books', 'see', 'do', 'stay'));

-- Theatres, cinemas and arts centres sit with the sights.
update public.saves set category = 'see' where category = 'do';

-- Record shops and bookshops we already have, matched by name. Only saves
-- still filed as Shop or unsorted; anything sorted by hand stays where it is.
update public.saves s
set category = 'records'
from public.places p
where p.id = s.place_id
  and (s.category = 'shop' or s.category is null)
  and p.name ~* '(record|dischi|vinil|disco |rough trade|honest jon|sister ray|phonica)';

update public.saves s
set category = 'books'
from public.places p
where p.id = s.place_id
  and (s.category = 'shop' or s.category is null)
  and p.name ~* '(book|libri|libreria|librairie|bouquinist)';
