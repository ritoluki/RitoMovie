// Vite must be running on localhost:5173. API writes are intercepted fixtures.
const assert = require('node:assert/strict');
const { runBrowserCheck } = require('./helpers/browser.cjs');
const en = require('../public/locales/en/translation.json');
const vi = require('../public/locales/vi/translation.json');
const user = {
  _id: 'a'.repeat(24),
  name: 'Test admin',
  email: 'test@example.com',
  role: 'super_admin',
  watchlist: [],
};
const author = {
  _id: 'b'.repeat(24),
  name: 'Other user',
  email: 'author@example.com',
};
const comment = {
  _id: 'c'.repeat(24),
  user: author,
  movie: 42,
  text: 'A comment to report',
  likes: [],
  dislikes: [],
  likesCount: 0,
  dislikesCount: 0,
  createdAt: new Date().toISOString(),
};
const source = {
  slug: 'report-ui',
  name: 'Report demo',
  origin_name: 'Report demo',
  type: 'series',
  year: 2026,
  category: [],
  country: [],
  actor: [],
  content: 'A report UI fixture',
  tmdb: { id: '42', type: 'tv' },
};
const episodes = [
  {
    server_name: 'Server A',
    server_data: [
      { name: '1', slug: 'ep-1' },
      { name: '2', slug: 'ep-2' },
    ],
  },
];
let reports = [];
const ok = (data) => ({ body: { success: true, data } });
const api = ({ path, method, body }) => {
  if (method === 'GET') {
    if (path === '/api/auth/me') return ok(user);
    if (path === '/api/settings/public')
      return ok({ site_name: 'RitoMovie', enable_comments: true });
    if (
      path === '/api/phim/movie/report-ui' ||
      path.startsWith('/api/phim/tmdb/')
    )
      return ok({ status: true, movie: source, episodes });
    if (path === '/api/movies/42')
      return ok({
        id: 42,
        title: source.name,
        genres: [],
        vote_average: 7,
        production_countries: [],
        production_companies: [],
      });
    if (path === '/api/comments/movie/42')
      return ok({
        comments: [
          comment,
          { ...comment, _id: 'f'.repeat(24), text: 'My own comment', user },
        ],
        pagination: { total: 2, pages: 1, page: 1, limit: 10 },
      });
    if (path === '/api/admin/reports')
      return {
        body: {
          success: true,
          data: reports,
          pagination: { page: 1, pages: 1, limit: 20, total: reports.length },
          statusCounts: reports.reduce(
            (acc, report) => ({
              ...acc,
              [report.status]: (acc[report.status] || 0) + 1,
            }),
            {},
          ),
        },
      };
    if (path.startsWith('/api/admin/reports/')) {
      const report = reports.find((item) => path.endsWith(item._id));
      assert.ok(report);
      return ok({
        report,
        target:
          report.type === 'COMMENT'
            ? { text: comment.text, isHidden: report.status === 'RESOLVED' }
            : null,
      });
    }
    if (path.includes('/credits')) return ok({ cast: [], crew: [] });
    if (path.includes('/images')) return ok({ backdrops: [], posters: [] });
    if (path.includes('/release-dates')) return ok({ results: [] });
    if (path.includes('/extras'))
      return ok({
        images: { backdrops: [], posters: [] },
        keywords: [],
        cast: [],
      });
    return ok([]);
  }
  if (path === '/api/reports' && method === 'POST') {
    if (
      reports.some(
        (item) =>
          item.type === body.type &&
          item.targetId === body.targetId &&
          item.status === 'PENDING',
      )
    ) {
      return {
        status: 409,
        body: {
          success: false,
          message: 'Duplicate',
          code: 'REPORT_DUPLICATE',
        },
      };
    }
    const report = {
      ...body,
      context: {
        ...body.context,
        ...(body.type === 'COMMENT'
          ? { authorName: author.name, commentText: comment.text }
          : {}),
      },
      _id: String(reports.length + 1).padStart(24, 'd'),
      reporter: user,
      priority: 'MEDIUM',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    reports.push(report);
    return {
      status: 201,
      ...ok({
        _id: report._id,
        status: report.status,
        createdAt: report.createdAt,
      }),
    };
  }
  if (path === '/api/admin/reports/bulk-action') {
    let modifiedCount = 0;
    for (const report of reports)
      if (
        body.reportIds.includes(report._id) &&
        ['PENDING', 'REVIEWING'].includes(report.status)
      ) {
        report.status = body.action === 'resolve' ? 'RESOLVED' : 'REJECTED';
        report.resolution = body.reason;
        modifiedCount++;
      }
    return { body: { success: true, modifiedCount } };
  }
  if (path.startsWith('/api/admin/reports/')) {
    const report = reports.find((item) => path.includes(item._id));
    assert.ok(report);
    if (path.endsWith('/status')) report.status = body.status;
    else if (path.endsWith('/priority')) report.priority = body.priority;
    else if (path.endsWith('/resolve')) {
      report.status = 'RESOLVED';
      report.resolution = body.resolution;
    } else if (path.endsWith('/reject')) {
      report.status = 'REJECTED';
      report.resolution = body.reason;
    } else throw Error(`Unexpected write: ${path}`);
    return ok(report);
  }
  throw Error(`Unexpected write: ${method} ${path}`);
};
const bootstrap = `if(!localStorage.getItem('i18nextLng')) localStorage.setItem('i18nextLng','en'); if(!sessionStorage.getItem('report-guest')) localStorage.setItem('auth-storage', ${JSON.stringify(JSON.stringify({ state: { user, token: 'fixture-only', isAuthenticated: true, rememberMe: true }, version: 0 }))});`;

runBrowserCheck(
  api,
  bootstrap,
  async ({ navigate, waitFor, click, fill, evaluate, requests, send }) => {
    const button = (text) =>
      `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)})`;
    const cool = () =>
      evaluate(`sessionStorage.removeItem('report-cooldown:${user._id}')`);
    const submitReport = async (text) => {
      await fill('[role=dialog] textarea', text);
      await waitFor(`!(${button(en.reporting.submit)})?.disabled`);
      await click(button(en.reporting.submit));
    };
    await navigate('/movie/42?phimSlug=report-ui&type=tv');
    await waitFor(
      `document.body.innerText.includes(${JSON.stringify(en.reporting.movieButton)})`,
    );
    await click(button(en.reporting.movieButton));
    await waitFor('document.querySelector("[role=dialog] textarea")');
    await submitReport('The player freezes and cannot start the video.');
    await waitFor('!document.querySelector("[role=dialog]")');
    assert.equal(reports[0].targetId, 'phim:report-ui');
    assert.equal(
      reports[0].context.pagePath,
      '/movie/42?phimSlug=report-ui&type=tv',
    );
    await waitFor(
      `Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()===${JSON.stringify(en.reporting.open)}).length === 1`,
    );
    await click(button(en.reporting.open));
    await waitFor('document.querySelector("[role=dialog] textarea")');
    await waitFor(
      `document.querySelector('[role=dialog]').innerText.includes('Wait ')`,
    );
    await cool();
    await submitReport('This comment includes unwanted advertising and spam.');
    await waitFor('!document.querySelector("[role=dialog]")');
    assert.equal(reports[1].targetId, comment._id);
    await cool();
    await click(button(en.reporting.open));
    await waitFor('document.querySelector("[role=dialog] textarea")');
    await submitReport('This is a duplicate report for the same comment.');
    await waitFor(
      `document.querySelector('[role=dialog] [role=alert]')?.textContent.includes(${JSON.stringify(en.reporting.duplicate)})`,
    );
    console.log(
      'PASS: movie/comment reporting, shared cooldown, own-comment protection and duplicate feedback',
    );

    await cool();
    await navigate('/watch/report-ui?episode=ep-2&server=0');
    await waitFor(
      `document.body.innerText.includes(${JSON.stringify(en.reporting.movieButton)})`,
    );
    await click(button(en.reporting.movieButton));
    await waitFor('document.querySelector("[role=dialog] textarea")');
    await submitReport('Episode two has the wrong subtitles and audio.');
    await waitFor(
      `!document.querySelector('[role=dialog]') || !!document.querySelector('[role=dialog] [role=alert]')`,
    );
    const playback = requests
      .filter(
        (request) =>
          request.path === '/api/reports' && request.method === 'POST',
      )
      .at(-1).body;
    assert.equal(playback.context.episode, '2');
    assert.equal(playback.context.server, 'Server A');
    // This is the same movie, so the fixture correctly leaves the duplicate dialog open.
    await navigate('/admin/reports');
    await waitFor(
      'document.querySelector("table")?.textContent.includes("Report demo")',
    );
    await click(button('Report demo'));
    await waitFor(
      `document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(en.adminReport.playbackContext)}) || document.querySelector('[role=dialog] textarea')`,
    );
    await click(`document.querySelector('[role=dialog] [role=combobox]')`);
    await waitFor('document.querySelector("[role=option]")');
    await click(
      `Array.from(document.querySelectorAll('[role=option]')).find(option=>option.textContent.includes(${JSON.stringify(en.admin.reportPriority.HIGH)}))`,
    );
    await waitFor(
      `document.querySelector('[role=dialog] [role=combobox]')?.textContent.includes(${JSON.stringify(en.admin.reportPriority.HIGH)})`,
    );
    await click(button(en.admin.reports.startReviewing));
    await waitFor(
      `document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(en.admin.reportStatus.REVIEWING)})`,
    );
    await fill(
      '[role=dialog] textarea',
      'Checked and repaired the source video.',
    );
    await click(button(en.admin.reports.resolve));
    await waitFor('!document.querySelector("[role=dialog]")');
    assert.equal(reports[0].status, 'RESOLVED');
    await click(button(author.name));
    await waitFor('document.querySelector("[role=dialog] textarea")');
    const comboboxes = await evaluate(
      `Array.from(document.querySelectorAll('[role=dialog] [role=combobox]')).length`,
    );
    assert.equal(comboboxes, 2);
    await click(
      `Array.from(document.querySelectorAll('[role=dialog] [role=combobox]')).at(-1)`,
    );
    await waitFor('document.querySelector("[role=option]")');
    await click(
      `Array.from(document.querySelectorAll('[role=option]')).find(option=>option.textContent.includes(${JSON.stringify(en.adminReport.hideComment)}))`,
    );
    await fill(
      '[role=dialog] textarea',
      'Spam confirmed, hide the reported comment.',
    );
    await click(button(en.admin.reports.resolve));
    await waitFor('!document.querySelector("[role=dialog]")');
    assert.ok(
      requests.some(
        (request) =>
          request.path.endsWith('/resolve') &&
          request.body.action === 'HIDE_COMMENT',
      ),
    );
    console.log(
      'PASS: admin details, recorded resolution and explicit comment-hiding action',
    );

    reports.push({
      ...reports[0],
      _id: 'e'.repeat(24),
      targetId: 'phim:another-movie',
      status: 'PENDING',
      resolution: undefined,
    });
    await navigate('/admin/reports');
    await waitFor('document.querySelectorAll("tbody tr").length === 3');
    await click(`document.querySelector('thead input[type=checkbox]')`);
    await click(button(en.admin.reports.resolveSelected));
    await waitFor('document.querySelector("[role=dialog] textarea")');
    await fill('[role=dialog] textarea', 'Reviewed the selected open reports.');
    await click(button(en.admin.reports.resolve));
    await waitFor('!document.querySelector("[role=dialog]")');
    assert.equal(reports[2].status, 'RESOLVED');
    console.log(
      'PASS: bulk report resolution updates only the selected open reports',
    );

    await evaluate("localStorage.setItem('i18nextLng','vi')");
    await navigate('/admin/reports');
    await waitFor(
      `document.body.innerText.includes(${JSON.stringify(vi.admin.reports.title)})`,
    );
    await click(button(author.name));
    await waitFor(
      `document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(vi.adminReport.resolution)})`,
    );
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    assert.ok(
      await evaluate(
        `(() => {const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.left>=0&&r.right<=window.innerWidth;})()`,
      ),
    );
    assert.equal(
      await evaluate(
        "/[A-Za-z]\\?[A-Za-z]/.test(document.querySelector('[role=dialog]').innerText)",
      ),
      false,
    );
    console.log('PASS: Vietnamese report moderation and mobile dialog layout');
    await evaluate(
      "sessionStorage.setItem('report-guest','1'); localStorage.removeItem('auth-storage'); sessionStorage.removeItem('auth-token')",
    );
    await navigate('/movie/42?phimSlug=report-ui&type=tv');
    await waitFor(
      `document.body.innerText.includes(${JSON.stringify(vi.reporting.movieButton)})`,
    );
    await click(button(vi.reporting.movieButton));
    await waitFor(`document.querySelector('[role=dialog] a[href="/login"]')`);
    assert.equal(
      await evaluate(
        'Boolean(document.querySelector("[role=dialog] textarea"))',
      ),
      false,
    );
    console.log(
      'PASS: signed-out users get a sign-in link before submitting a report',
    );
  },
).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
