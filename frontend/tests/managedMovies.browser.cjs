// Vite must be running on localhost:5173. All API writes are intercepted fixtures.
const assert = require('node:assert/strict');
const { runBrowserCheck } = require('./helpers/browser.cjs');
const admin = { _id: 'ui-admin', name: 'UI Admin', email: 'admin@example.com', role: 'super_admin', watchlist: [] };
const source = { _id: 'source-ui', slug: 'management-ui', name: 'Phim quản lý', origin_name: 'Source title', year: 2026, type: 'series',
  thumb_url: '/poster.jpg', poster_url: '/backdrop.jpg', category: [], country: [], actor: [], content: 'Source synopsis', tmdb: { id: '42', type: 'tv' } };
let managed;
const list = () => ({ success: true, data: managed ? [managed] : [], pagination: { page: 1, limit: 20, total: managed ? 1 : 0, pages: 1 } });
const publicMovie = () => ({ ...source, siteOverrides: managed?.overrides });
const ok = data => ({ body: { success: true, data } });
const emptyRows = () => ({ results: [] });
const api = request => {
  const { path, method, body } = request;
  if (method === 'GET') {
    if (path === '/api/auth/me') return ok(admin);
    if (path === '/api/settings/public') return ok({ site_name: 'RitoMovie' });
    if (path === '/api/phim/genres' || path === '/api/phim/countries') return ok([]);
    if (path === '/api/admin/movies') return { body: list() };
    if (path === '/api/admin/movies/source') return { body: { ...list(), data: [{ ...source, managedId: managed?._id }] } };
    if (path === '/api/phim/movie/management-ui') return managed?.isHidden
      ? { status: 404, body: { success: false, code: 'MOVIE_UNAVAILABLE', message: 'This movie is not available on this website.' } }
      : ok({ movie: publicMovie(), episodes: [], status: true });
    if (path === '/api/phim/home') return ok({ status: 'success', data: { items: [] } });
    if (path === '/api/home/batch') return ok({ trending: emptyRows(), popular: emptyRows(), topRated: emptyRows(),
      genres: { action: emptyRows(), comedy: emptyRows(), horror: emptyRows(), romance: emptyRows() },
      phim: { phimBo: { items: [] }, anime: { items: [] }, tvShows: { items: [] } },
      phimGenres: { action: { items: [] }, comedy: { items: [] } },
      managed: { featured: { items: managed?.isFeatured && !managed?.isHidden ? [publicMovie()] : [] }, trending: { items: managed?.isTrending && !managed?.isHidden ? [publicMovie()] : [] } },
    });
    if (path === '/api/users/watchlist' || path === '/api/users/history') return ok([]);
    if (path === '/api/movies/42') return ok({ id: 42, title: 'TMDB title', genres: [], production_countries: [] });
    if (path.includes('/comments/')) return ok({ comments: [], pagination: { total: 0, pages: 1 } });
    return ok([]);
  }
  if (path === '/api/admin/movies/import-phim' && method === 'POST') {
    assert.equal(body.slug, source.slug);
    managed ||= { _id: 'a'.repeat(24), source: 'phimapi', slug: source.slug, title: source.name, original_title: source.origin_name,
      snapshot: source, mediaType: 'tv', tmdb_id: 42, poster_path: source.thumb_url, genres: [],
      isHidden: false, isFeatured: false, isTrending: false, overrides: { titles: {}, overviews: {} } };
    return ok(managed);
  }
  if (path === `/api/admin/movies/${'a'.repeat(24)}` && method === 'PUT') {
    managed = { ...managed, ...body };
    managed.title = managed.overrides.titles.vi || source.name;
    return ok(managed);
  }
  if (path === '/api/admin/movies/bulk-action' && method === 'POST') {
    assert.deepEqual(body.movieIds, ['a'.repeat(24)]);
    if (body.action === 'remove') managed = undefined;
    else if (body.action === 'hide') managed.isHidden = true;
    else if (body.action === 'show') managed.isHidden = false;
    else throw new Error('Unexpected bulk action');
    return { body: { success: true, modifiedCount: 1 } };
  }
  throw new Error(`Unexpected write: ${method} ${path}`);
};

const bootstrap = `localStorage.setItem('i18nextLng', 'en'); localStorage.setItem('auth-storage', ${JSON.stringify(JSON.stringify({ state: {
  user: admin, token: 'fixture-only-token', isAuthenticated: true, rememberMe: true,
}, version: 0 }))});`;

runBrowserCheck(api, bootstrap, async ({ navigate, waitFor, click, fill, evaluate, requests }) => {
  const button = text => `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)})`;
  const element = selector => `document.querySelector(${JSON.stringify(selector)})`;
  await navigate('/admin/movies');
  await waitFor('document.body.innerText.includes("No managed movies yet")');
  await click(button('Add from PhimAPI'));
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Source title")');
  await fill('input[aria-label="Search PhimAPI"]', 'demo');
  await click(button('Search'));
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Source title")');
  await click(button('Add'));
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Edit movie")');
  await fill('input[name="title-en"]', 'Managed UI title');
  await fill('input[name="title-vi"]', 'Tên quản trị');
  await fill('textarea[name="overview-en"]', 'Managed UI synopsis');
  await click(button('Save changes'));
  await waitFor('!document.querySelector("[role=dialog]") && document.querySelector("table")?.textContent.includes("Tên quản trị")');
  assert.equal(managed.overrides.titles.en, 'Managed UI title');
  assert.equal(managed.overrides.overviews.en, 'Managed UI synopsis');
  console.log('PASS: source picker imports a movie and the editor saves bilingual metadata');

  await click(element('button[aria-label="Toggle featured"]'));
  await waitFor('document.querySelector("table")?.textContent.includes("Featured")');
  await click(element('button[aria-label="Hide movie"]'));
  await waitFor('document.querySelector("[role=alertdialog]")');
  await click(button('Confirm'));
  await waitFor('document.querySelector("table")?.textContent.includes("Hidden") && !document.querySelector("[role=alertdialog]")');
  await navigate('/watch/management-ui?type=tv');
  await waitFor('document.querySelector("[role=alert]")?.textContent.includes("not available")');
  assert.equal(await evaluate('Boolean(document.querySelector("video, iframe"))'), false);
  console.log('PASS: hidden source URLs show an unavailable message without a player');

  await navigate('/admin/movies');
  await waitFor('document.querySelector("table")?.textContent.includes("Hidden")');
  await click('document.querySelector("table input[type=checkbox]")');
  await waitFor('document.body.innerText.includes("1 selected")');
  await click(button('show'));
  await waitFor('document.querySelector("[role=alertdialog]")');
  await click(button('Confirm'));
  await waitFor('document.querySelector("table")?.textContent.includes("Visible")');
  await click(element('button[aria-label="Toggle trending"]'));
  await waitFor('document.querySelector("table")?.textContent.includes("Trending")');
  await navigate('/');
  await waitFor('document.body.innerText.includes("Featured on RitoMovie") && document.body.innerText.includes("Managed UI title") && document.body.innerText.includes("Trending on RitoMovie")');
  console.log('PASS: bulk show and home section flags affect the public UI');

  await navigate('/admin/movies');
  await waitFor('document.querySelector("table")?.textContent.includes("Tên quản trị")');
  await click(element('button[aria-label="Remove management settings"]'));
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("does not delete")');
  await click(button('Confirm'));
  await waitFor('document.body.innerText.includes("No managed movies yet")');
  assert.equal(managed, undefined);
  assert.ok(requests.filter(request => !['GET', 'OPTIONS'].includes(request.method)).every(request => request.path.startsWith('/api/admin/movies')));
  console.log('PASS: removal is confirmed and issues no activity deletion requests');
}).catch(error => { console.error(error); process.exitCode = 1; });
