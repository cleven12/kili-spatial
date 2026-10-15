# Embedding KiliSpatial

Embed the viewer in any page (for example an Astro itinerary page) with an iframe:

```html
<iframe
  src="https://YOUR-DEPLOY/embed?route=machame"
  title="Machame route in 3D"
  loading="lazy"
  allow="fullscreen"
  style="width:100%; aspect-ratio:16/10; min-height:420px; border:0"
></iframe>
```

The viewer is responsive to the iframe's own size: day chips scroll, and the profile hides when the frame is short.

## URL parameters

| Parameter | Values | Meaning |
|---|---|---|
| `route` | `marangu`, `machame`, `lemosho`, `rongai`, `umbwe`, `northern-circuit`, `shira`, `all` | Route to show |
| `day` | `1`... | Open an itinerary day |
| `drone` | `1` | Start the drone orbit |
| `chart` | `0` | Hide the elevation profile |
| `days` | `0` | Hide the day chips |

## Allowing your site

Two things need your domain, both set at deploy time:

1. **Who may frame the viewer.** Edit `static/_headers` (`frame-ancestors`). Without a matching rule browsers still allow framing on hosts that do not send the header, so set it.
2. **Who may control it.** Set `VITE_EMBED_ORIGINS=https://yoursite.com` when building (see `.env.example`). The viewer only accepts messages from its direct parent whose origin is on that list, and only replies to that origin.

## postMessage API

All messages are objects with `source: 'kilispatial'`. Commands go from your page to the iframe:

```js
const frame = document.querySelector('iframe');
const send = (msg) =>
  frame.contentWindow.postMessage({ source: 'kilispatial', ...msg }, 'https://YOUR-DEPLOY');

send({ type: 'selectRoute', id: 'lemosho' });
send({ type: 'focusDay', day: 3 });
send({ type: 'focusPlace', id: 'barranco-camp' });
send({ type: 'showRoute' });
send({ type: 'drone', on: true });
send({ type: 'play', on: true });
send({ type: 'scrub', km: 12.5 });
```

Events come back to your page. Check the origin and the `source` field:

```js
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://YOUR-DEPLOY' || e.data?.source !== 'kilispatial') return;
  // { type: 'ready', routes: [{ id, name, days }] }
  // { type: 'route', id }          { type: 'day', day }
  // { type: 'place', id }          { type: 'progress', km, elevation }
});
```

Typical use: highlight the matching itinerary row in your page on `day` events, and send `focusDay` when a row is clicked.

Place ids are in `/data/places.json`.
