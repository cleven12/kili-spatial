# KiliSpatial

Open-source 3D trekking viewer for **Mount Kilimanjaro's Marangu Route**, from Marangu Gate (1,860 m) to Uhuru Peak (5,895 m).

> **MVP.** Not for navigation. The trail is an approximation, and weather and oxygen values are simulated estimates derived from altitude. Trek with a licensed guide and official maps.

## Features

- Full 3D terrain (MapLibre GL JS) with a glowing, terrain-draped route
- Altitude-badge markers for each hut and summit point, with cinematic fly-to
- Stage navigator (day-by-day segments) with camp orbit
- Scrubbable SVG elevation profile synced to a marker on the 3D map
- 40-second cinematic "Play / Trek" fly-through with live altitude, distance, O₂ and weather readouts
- Responsive dark glass UI built with Flowbite Svelte (bottom drawer for stages on mobile)

## Stack

SvelteKit 3 · Svelte 5 (runes) · TypeScript · Tailwind CSS v4 · Flowbite Svelte · MapLibre GL JS · lucide-svelte · pnpm

## Getting started

Requires Node 22.17+ and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # svelte-check, must stay at 0 errors / 0 warnings
pnpm build        # static SPA in ./build
```

## Project layout

```
src/lib/data/maranguRoute.ts   waypoints, GeoJSON trail, elevation profile
src/lib/data/route.ts          distance/interpolation helpers, stages, oxygen, weather
src/lib/state/trek.svelte.ts   shared rune state (scrub, playback, camera commands)
src/lib/components/            Map3D, HeaderBar, StatsHud, StageSelector, ElevationChart, ...
```

## Data sources and attribution

- Imagery: © Esri, Maxar, Earthstar Geographics (Esri World Imagery)
- Terrain: Mapzen / AWS Terrain Tiles (Terrarium)

Both are loaded from third-party tile servers and are subject to their own terms. For production or high-traffic use, review those terms and consider swapping in your own tile provider (`style` in `src/lib/components/Map3D.svelte`).

## Roadmap

- Route JSON schema and loader (`?route=` / `?src=`), so any route can be shown
- `/embed` mode with `postMessage` sync for use inside itinerary pages
- Real GPX-based trail geometry
- Performance pass (shared terrain source, throttled progress updates, mobile quality cap)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
