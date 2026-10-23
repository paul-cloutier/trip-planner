-- Places found by name come from OpenStreetMap (via Photon). OSM's data is
-- open (ODbL), so unlike Google or Mapbox search results we may keep it.
-- An OSM object is identified by its type (N node, W way, R relation) and id.

alter table public.places
  add column osm_type text check (osm_type in ('N', 'W', 'R')),
  add column osm_id bigint,
  add column osm_tag text check (char_length(osm_tag) <= 80),
  add constraint places_osm_both_or_neither check ((osm_type is null) = (osm_id is null)),
  add constraint places_osm_unique unique (osm_type, osm_id);
