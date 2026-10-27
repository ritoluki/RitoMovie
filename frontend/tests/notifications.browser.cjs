// Serves the built frontend on a temporary port. All API traffic is intercepted.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { runBrowserCheck } = require('./helpers/browser.cjs');
const en = require('../public/locales/en/translation.json');
const vi = require('../public/locales/vi/translation.json');
const user = {
  _id: 'a'.repeat(24),
  name: 'Notification user',
  email: 'test@example.com',
  role: 'user',
  watchlist: [],
};
const root = {
  _id: 'b'.repeat(24),
  movie: 42,
  text: 'The parent comment linked from a notification',
  user,
  likes: [],
  dislikes: [],
  likesCount: 0,
  dislikesCount: 0,
  repliesCount: 0,
  createdAt: new Date().toISOString(),
};
const reply = {
  ...root,
  _id: 'c'.repeat(24),
  text: 'The linked reply',
  parentComment: root._id,
  user: { ...user, _id: 'd'.repeat(24), name: 'Another user' },
};
const source = {
  slug: 'notification-season',
  name: 'Notification demo movie',
  origin_name: 'Notification demo movie',
  type: 'single',
  year: 2026,
  category: [],
  country: [],
  actor: [],
  content: 'Test synopsis',
  tmdb: { id: '42', type: 'movie' },
};
const items = [];
let replyAvailable = false;
let failReaction = false;
let releaseReaction;
const waitingStreams = [];
const ok = (data) => ({ body: { success: true, data } });
const api = async ({ path: route, method, body, query }) => {
  if (method === 'PUT' && route.endsWith('/reaction')) {
    const target = route.includes(root._id) ? root : reply;
    await new Promise(resolve => { releaseReaction = resolve; });
    releaseReaction = null;
    if (failReaction) {
      failReaction = false;
      return { status: 503, body: { success: false, message: 'Temporary failure' } };
    }
    target.likes = target.likes.filter(id => id !== user._id);
    target.dislikes = target.dislikes.filter(id => id !== user._id);
    if (body.reaction === 'like') target.likes.push(user._id);
    if (body.reaction === 'dislike') target.dislikes.push(user._id);
    target.likesCount = target.likes.length;
    target.dislikesCount = target.dislikes.length;
    return ok({ reaction: body.reaction, likesCount: target.likesCount, dislikesCount: target.dislikesCount });
  }
  if (route === '/api/notifications/events') {
    if (!items.length)
      await new Promise((resolve) => {
        waitingStreams.push(resolve);
      });
    return {
      contentType: 'text/event-stream',
      body: `event: ready\ndata: {}\n\nevent: change\ndata: {"kind":"created","id":"${items[0]._id}"}\n\n`,
    };
  }
  if (method === 'GET') {
    if (route === '/api/auth/me') return ok(user);
    if (route === '/api/settings/public')
      return ok({ site_name: 'RitoMovie', enable_comments: true });
    if (route === '/api/notifications/unread-count')
      return ok({ unreadCount: items.filter((item) => !item.readAt).length });
    if (route === '/api/notifications') {
      const filtered = items.filter(
        (item) => query.get('unread') !== 'true' || !item.readAt,
      );
      return {
        body: {
          success: true,
          data: filtered,
          unreadCount: items.filter((item) => !item.readAt).length,
          pagination: { page: 1, pages: 1, total: filtered.length },
        },
      };
    }
    if (route.startsWith('/api/notifications/'))
      return ok(items.find((item) => route.endsWith(item._id)));
    if (
      route.startsWith('/api/phim/movie/notification-season') &&
      !route.endsWith('/extras')
    )
      return ok({ status: true, movie: source, episodes: [] });
    if (route === '/api/movies/42')
      return ok({
        id: 42,
        title: source.name,
        genres: [],
        production_countries: [],
        production_companies: [],
      });
    if (route.endsWith('/thread')) return ok(root);
    if (route.endsWith('/replies')) return ok(replyAvailable ? [reply] : []);
    if (route === '/api/comments/movie/42')
      return ok({ comments: [], pagination: { total: 1, page: 1, pages: 1 } });
    if (route.includes('/credits')) return ok({ cast: [], crew: [] });
    if (route.includes('/images')) return ok({ backdrops: [], posters: [] });
    if (route.includes('/release-dates')) return ok({ results: [] });
    if (route.includes('/extras'))
      return ok({
        images: { backdrops: [], posters: [] },
        keywords: [],
        cast: [],
      });
    return ok([]);
  }
  if (route === '/api/notifications/read-all') {
    items.forEach((item) => {
      item.readAt ||= new Date().toISOString();
    });
    return ok({});
  }
  if (route.startsWith('/api/notifications/') && route.endsWith('/read')) {
    const item = items.find((item) => route.includes(item._id));
    assert.ok(item);
    item.readAt ||= new Date().toISOString();
    return ok(item);
  }
  throw Error(`Unexpected write: ${method} ${route} ${JSON.stringify(body)}`);
};
const bootstrap = `if(!localStorage.getItem('i18nextLng')) localStorage.setItem('i18nextLng','en'); localStorage.setItem('auth-storage', ${JSON.stringify(JSON.stringify({ state: { user, token: 'fixture-only', isAuthenticated: true, rememberMe: true }, version: 0 }))});`;

(async () => {
  const dist = path.resolve(__dirname, '../dist');
  const server = http.createServer((request, response) => {
    const requested = path.resolve(
      dist,
      '.' + new URL(request.url, 'http://localhost').pathname,
    );
    const safe = requested.startsWith(dist + path.sep) || requested === dist;
    let file =
      safe && fs.existsSync(requested) && fs.statSync(requested).isFile()
        ? requested
        : path.join(dist, 'index.html');
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
    };
    response.setHeader(
      'Content-Type',
      types[path.extname(file)] || 'application/octet-stream',
    );
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, 'localhost', resolve));
  process.env.BROWSER_TEST_ORIGIN = `http://localhost:${server.address().port}`;
  try {
    await runBrowserCheck(
      api,
      bootstrap,
      async ({ navigate, waitFor, click, evaluate, send, requests }) => {
        const button = (text) =>
          `Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(text)})`;
        const bell = `document.querySelector('button[aria-label^="Notifications,"]')`;
        await navigate(
          `/movie/42?phimSlug=notification-season#comment-${root._id}`,
        );
        await waitFor(
          `document.getElementById('comment-${root._id}')?.textContent.includes(${JSON.stringify(root.text)})`,
        );
        while (
          !requests.some((request) =>
            request.path.endsWith(`/${root._id}/replies`),
          )
        )
          await new Promise((resolve) => setTimeout(resolve, 10));
        assert.equal(
          await evaluate(
            `document.getElementById('comment-${root._id}').textContent.includes(${JSON.stringify(reply.text)})`,
          ),
          false,
        );
        while (!waitingStreams.length)
          await new Promise((resolve) => setTimeout(resolve, 10));
        items.push({
          _id: 'e'.repeat(24),
          type: 'COMMENT_REPLY',
          data: { actorName: 'Another user', preview: reply.text },
          target: `/movie/42?phimSlug=notification-season#comment-${root._id}`,
          readAt: null,
          createdAt: new Date().toISOString(),
        });
        replyAvailable = true;
        root.repliesCount = 1;
        waitingStreams.splice(0).forEach((resolve) => resolve());
        await waitFor(
          `${bell}?.getAttribute('aria-label').includes('1 unread')`,
        );
        await waitFor(
          `document.body.innerText.includes(${JSON.stringify(en.notifications.types.COMMENT_REPLY.title)})`,
        );
        await waitFor(
          `document.getElementById('comment-${root._id}')?.textContent.includes(${JSON.stringify(reply.text)})`,
        );
        await click(
          `Array.from(document.querySelectorAll('[data-sonner-toast] button')).find(button=>button.textContent.includes(${JSON.stringify(en.notifications.types.COMMENT_REPLY.title)}))`,
        );
        await waitFor(
          `${bell}?.getAttribute('aria-label').includes('0 unread')`,
        );
        const originalPage = await evaluate(
          'location.pathname + location.search + location.hash',
        );
        await click(
          `Array.from(document.querySelectorAll('#comment-${root._id} button')).find(button=>button.textContent.trim()===${JSON.stringify(en.comments.oneReply)})`,
        );
        await waitFor(
          `!document.getElementById('comment-${root._id}').textContent.includes(${JSON.stringify(reply.text)})`,
        );
        await click(bell);
        await waitFor(
          `document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(reply.text)})`,
        );
        await click(
          `Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent.includes(${JSON.stringify(en.notifications.types.COMMENT_REPLY.title)}))`,
        );
        await waitFor(
          `document.getElementById('comment-${root._id}')?.textContent.includes(${JSON.stringify(reply.text)})`,
        );
        assert.equal(
          await evaluate('location.pathname + location.search + location.hash'),
          originalPage,
        );
        assert.equal(await evaluate('location.hash'), `#comment-${root._id}`);
        assert.ok(
          requests.some(
            (request) =>
              request.path.endsWith(`/${items[0]._id}/read`) &&
              request.method === 'PUT',
          ),
        );
        assert.ok(items[0].readAt);
        console.log(
          'PASS: new reply refreshes an already cached thread; toast body and reopening the same notification work without reloading',
        );

        // Root is rendered from a focused-thread cache, reply from the replies cache.
        for (const index of [0, 1]) {
          const reactionButton = label => `document.querySelectorAll('#comment-${root._id} button[aria-label="${label}"]')[${index}]`;
          const like = reactionButton(en.comments.like);
          const dislike = reactionButton(en.comments.dislike);
          for (const choice of ['like', 'dislike', null]) {
            const selected = choice === 'like' ? like : dislike;
            const before = requests.filter(request => request.path.endsWith('/reaction') && request.method === 'PUT').length;
            await click(selected);
            await click(selected);
            await waitFor(`${selected}?.disabled && ${selected}?.getAttribute('aria-pressed') === '${choice !== null}'`);
            assert.equal(await evaluate(`${selected}.textContent.trim()`), choice === null ? '0' : '1');
            await waitFor(`${like}?.disabled && ${dislike}?.disabled`);
            while (!releaseReaction) await new Promise(resolve => setTimeout(resolve, 10));
            assert.equal(requests.filter(request => request.path.endsWith('/reaction') && request.method === 'PUT').length, before + 1);
            releaseReaction();
            await waitFor(`!${like}?.disabled && !${dislike}?.disabled`);
            assert.equal(await evaluate(`${like}.getAttribute('aria-pressed')`), String(choice === 'like'));
            assert.equal(await evaluate(`${dislike}.getAttribute('aria-pressed')`), String(choice === 'dislike'));
          }
          failReaction = true;
          await click(like);
          await waitFor(`${like}?.getAttribute('aria-pressed') === 'true'`);
          while (!releaseReaction) await new Promise(resolve => setTimeout(resolve, 10));
          releaseReaction();
          await waitFor(`!${like}?.disabled && ${like}?.getAttribute('aria-pressed') === 'false'`);
          assert.equal(await evaluate(`${like}.textContent.trim()`), '0');
          await waitFor(`document.body.innerText.includes(${JSON.stringify(en.comments.reactionFailed)})`);
        }
        assert.equal(items.length, 1, 'reactions must not produce reply notifications');
        console.log('PASS: root and reply react immediately, switch/clear persist, duplicate clicks are blocked and failures roll back');

        items.push({
          _id: 'f'.repeat(24),
          type: 'COMMENT_RESTRICTED',
          data: {
            reason: 'Repeated spam',
            restrictionExpiresAt: new Date(Date.now() + 3600000).toISOString(),
          },
          target: '/profile',
          readAt: null,
          createdAt: new Date().toISOString(),
        });
        items.push({
          _id: '1'.repeat(24),
          type: 'REPORT_RESOLVED',
          data: { reportType: 'MOVIE' },
          target: '/profile',
          readAt: null,
          createdAt: new Date().toISOString(),
        });
        items.push({
          _id: '2'.repeat(24),
          type: 'REPORT_REJECTED',
          data: { reportType: 'MOVIE' },
          target: '/profile',
          readAt: null,
          createdAt: new Date().toISOString(),
        });
        await evaluate("localStorage.setItem('i18nextLng','vi')");
        await navigate('/notifications');
        await waitFor(
          `document.body.innerText.includes(${JSON.stringify(vi.notifications.types.COMMENT_RESTRICTED.title)})`,
        );
        await click(
          `document.querySelector('button[aria-label^="Thông báo,"]')`,
        );
        await waitFor(
          `document.querySelector('[role=dialog]')?.textContent.includes('Repeated spam')`,
        );
        await click(
          `Array.from(document.querySelectorAll('[role=dialog] button')).find(button=>button.textContent.includes(${JSON.stringify(vi.notifications.types.COMMENT_RESTRICTED.title)}))`,
        );
        await waitFor(
          `document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(vi.notifications.viewAccount)})`,
        );
        assert.ok(
          await evaluate(
            `document.querySelector('[role=dialog]').textContent.includes('Repeated spam')`,
          ),
        );
        assert.equal(await evaluate('location.pathname'), '/notifications');
        await click(button(vi.common.close));
        await waitFor(`!document.querySelector('[role=dialog]')`);
        await click(
          `Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes(${JSON.stringify(vi.notifications.types.REPORT_RESOLVED.title)}))`,
        );
        await waitFor(
          `document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(vi.notifications.types.REPORT_RESOLVED.title)})`,
        );
        assert.equal(
          await evaluate(
            `document.querySelector('[role=dialog]').textContent.includes(${JSON.stringify(vi.notifications.viewAccount)})`,
          ),
          false,
        );
        await click(button(vi.common.close));
        await click(button(vi.notifications.readAll));
        await waitFor(
          `document.querySelector('button[aria-label^="Thông báo,"]')?.getAttribute('aria-label').includes('0 chưa đọc')`,
        );
        await click(button(vi.notifications.unread));
        await waitFor(
          `document.body.innerText.includes(${JSON.stringify(vi.notifications.emptyUnread)})`,
        );
        await send('Emulation.setDeviceMetricsOverride', {
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await click(
          `document.querySelector('button[aria-label^="Thông báo,"]')`,
        );
        await waitFor('document.querySelector("[role=dialog]")');
        assert.ok(
          await evaluate(
            `(() => {const rect=document.querySelector('[role=dialog]').getBoundingClientRect();return rect.left >= 0 && rect.right <= innerWidth;})()`,
          ),
        );
        console.log(
          'PASS: notification rows open meaningful restriction/report dialogs; Vietnamese, read-all, unread filter and mobile layout',
        );
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
