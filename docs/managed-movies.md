# Managed PhimAPI catalog

This implementation is split into three modules so it can be reviewed incrementally.
Home section controls and automatic source previews are documented in `home-layout.md`.
TMDB-wide visibility settings from that screen also create typed records in this catalog.

1. **Catalog and admin API**: `ManagedMovie` stores a source slug, typed TMDB identity,
   source metadata snapshot, site overrides and visibility/home-section flags. The
   uploaded-video `Movie` model and `/api/videos` remain independent.
2. **Public projection**: `publicMoviePolicy` applies current database policies after
   upstream caches have been read. It filters lists and recommendations, rejects
   hidden detail/playback lookups, and adds visible featured/trending snapshots to
   `/api/home/batch`. It never changes the cached source objects.
3. **Admin UI**: separate source picker, editor and managed list. Import is idempotent;
   updates validate all writable fields. Bulk actions and removal are confirmed.

## Local review

Open `http://localhost:5173/admin/movies` as an admin or super admin.

- Use **Add from PhimAPI** to search the source or enter its slug. Saving an existing
  source again refreshes its source snapshot and opens its settings without resetting existing policies.
- Edit titles/descriptions independently for VI and EN, and optionally image URLs.
  Empty override fields restore source/TMDB behavior.
  Public PhimAPI search also includes matching site title overrides on its first page.
- Toggle Featured or Trending, then visit the home page. Up to 20 visible picks per
  section are shown, ordered by the latest management update.
  Curated rows use the stored source snapshot; use **Sync & edit** to refresh source metadata.
- Hide the film, then check home/catalog/search/recommendations and its direct detail
  and watch URLs. Show it again to restore access.
- Remove management settings to restore default source behavior. This does not delete
  the upstream film, comments, ratings or watch history.

All source content is visible by default until explicitly hidden. No automatic bulk
import or replacement of existing collections is performed. PhimAPI page totals still
describe the upstream catalog; filtering may reduce the number of entries on a page.
Source stream URLs already obtained externally cannot be revoked by a site setting.

TV seasons are identified by slug. TMDB IDs are qualified by movie/TV type. A canonical
TMDB entry is blocked only when all of its managed variants are hidden. The public
API rechecks current policies on fresh requests; an already open player's external
stream is not forcibly disconnected.

## Verification

- `cd frontend; npm.cmd test`
- `cd backend; npm.cmd run build`
- `cd backend; node --test tests/movieManagement.test.cjs`
- `cd backend; node --test tests/managedMovies.integration.cjs`
- `cd frontend; node tests/managedMovies.browser.cjs` (Chrome, Vite running; API fixtures only)

The integration check uses a new, uniquely named local test database and stubbed
upstream APIs. It checks permissions, validation, idempotent import, cached public
responses, season identity, home curation and preservation of user activity, then
removes only its own test database.

Deployment is pending the user's local approval. Content analytics for the legacy
uploaded-video catalog are a separate follow-up; dashboard movie counts now refer to
the managed PhimAPI catalog.
