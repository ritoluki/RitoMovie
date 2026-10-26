# Home section management

Open `/admin/home-layout` as an admin or super admin. The Movies and Home sections
tabs link to each other. All 17 existing sections are prefilled from the same raw
TMDB/PhimAPI batch used by the public home page; no bulk movie import is required.

## Controls

- Enable/disable sections and move them up/down. The hero stays at the top and can
  be disabled. Section ordering includes empty sections so positions survive source outages.
- Hide/show movies in one section. This does not affect another section or detail/playback.
- Pin movies at the front, reorder pins, and reorder current unpinned movies.
- Automatic order clears manual ordering and retains pins. Reset section clears its
  pins and local hidden settings. Reset home restores the default layout.
- Website visibility is a separate, confirmed action. It creates/updates a managed
  PhimAPI or typed TMDB rule, including canonical TMDB rules for matching source seasons.
  Layout resets never clear these rules. Globally configured entries are also shown
  in the existing movie catalog.

Pins retain a server-captured metadata snapshot when a movie leaves the current source
list. Current source metadata takes precedence whenever it is available. Manual ordering
does not force an unpinned movie to remain after a source rotation. References used by
pins, hiding and order are retained for restoration; obsolete unreferenced snapshots are pruned.
Snapshots outside a language's current source list retain their captured metadata; normal
TMDB detail lookups still load the requested language when the movie is opened.

## Implementation

- `utils/homeSections.ts`: default registry, typed identities, ordering and validation.
- `models/HomeLayout.ts`: singleton settings with an optimistic revision counter.
- `services/homeDataService.ts`: shared cached raw batch, including recently updated films.
- `services/homeLayoutService.ts` and `controllers/admin/homeLayoutController.ts`: preview
  and validated writes. Movie snapshots are selected on the server, never trusted from clients.
- `publicMoviePolicy`: applies global rules and home settings after reading raw caches.
- `HomeSectionRenderer`: retains hero, normal rows, PhimAPI rows and both Top 10 styles,
  with lazy rendering after the first visible rows.

Concurrent stale writes return HTTP 409. The admin refreshes the current revision rather
than silently overwriting another session. Saves invalidate public React Query caches;
the home query checks invalidated data when returning through SPA navigation.

## Local verification

1. Backend build and `node --test tests/homeSections.test.cjs tests/movieManagement.test.cjs`.
2. `node --test tests/managedMovies.integration.cjs`: newly created local test database,
   stubbed upstream sources, real routes/permissions/revisions, then database cleanup.
3. `node tests/homeLayout.browser.cjs` from frontend with Vite running: fixtures intercept
   all API writes while testing the actual admin controls and public rendering.

Production deployment remains pending the user's local review.
