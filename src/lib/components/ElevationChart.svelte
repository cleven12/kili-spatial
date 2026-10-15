<script lang="ts">
	import { t, i18n } from '#lib/i18n/index.svelte.ts';
	import { oxygenAtElevation } from '#lib/data/environment.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	const PAD = { l: 44, r: 16, t: 14, b: 26 };
	// Vegetation zone boundaries, drawn as labelled rules like a printed section.
	const ZONES = [
		{ at: 2800, label: 'zone.forest' as const },
		{ at: 4000, label: 'zone.moorland' as const },
		{ at: 5000, label: 'zone.desert' as const }
	];
	const PRIORITY = { summit: 0, gate: 1, hut: 2, camp: 2, lodging: 3 } as const;

	let width = $state(800);
	let height = $state(180);
	let svg: SVGSVGElement | undefined = $state();

	const track = $derived(trek.track);
	const route = $derived(trek.route);
	const total = $derived(track?.total ?? 1);

	const yMin = $derived(route ? Math.floor((route.stats.minElevation - 150) / 500) * 500 : 0);
	const yMax = $derived(route ? Math.ceil((route.stats.maxElevation + 100) / 500) * 500 : 1);
	const ticks = $derived.by(() => {
		const step = yMax - yMin > 3500 ? 1000 : 500;
		const out: number[] = [];
		for (let t = Math.ceil(yMin / step) * step; t <= yMax; t += step) out.push(t);
		return out;
	});

	const plotW = $derived(Math.max(1, width - PAD.l - PAD.r));
	const plotH = $derived(Math.max(1, height - PAD.t - PAD.b));
	const x = (km: number) => PAD.l + (km / total) * plotW;
	const y = (m: number) => PAD.t + (1 - (m - yMin) / (yMax - yMin)) * plotH;

	const linePath = $derived(
		route && track
			? route.coordinates.map((c, i) => `${i ? 'L' : 'M'}${x(track.km[i]).toFixed(1)},${y(c[2]).toFixed(1)}`).join(' ')
			: ''
	);
	const areaPath = $derived(linePath ? `${linePath} L${x(total)},${y(yMin)} L${x(0)},${y(yMin)} Z` : '');

	/** Profile segment between two km marks, for highlighting trail gaps. */
	function segment(a: number, b: number): string {
		if (!track || !route) return '';
		const pts: [number, number][] = [[a, track.elevationAt(a)]];
		route.coordinates.forEach((c, i) => {
			if (track.km[i] > a && track.km[i] < b) pts.push([track.km[i], c[2]]);
		});
		pts.push([b, track.elevationAt(b)]);
		return pts.map(([km, e], i) => `${i ? 'L' : 'M'}${x(km).toFixed(1)},${y(e).toFixed(1)}`).join(' ');
	}

	// Stop labels, placed greedily by importance so they never overlap.
	const labels = $derived.by(() => {
		if (!route) return [];
		const stops = route.marks
			.filter((m) => m.kind === 'stop')
			.map((m) => ({ mark: m, place: trek.placeById.get(m.place)! }))
			.filter((s) => s.place)
			.sort((a, b) => PRIORITY[a.place.kind] - PRIORITY[b.place.kind] || a.mark.km - b.mark.km);
		const taken: [number, number][] = [];
		const placed: { id: string; name: string; km: number; elevation: number; px: number; anchor: 'start' | 'middle' | 'end' }[] = [];
		for (const { mark, place } of stops) {
			const px = x(mark.km);
			const w = place.name.length * 6.6 + 8;
			// Decide the anchor first so the occupied interval matches what is drawn.
			const anchor = px - w / 2 < PAD.l - 24 ? 'start' : px + w / 2 > width - 6 ? 'end' : 'middle';
			const lo = anchor === 'start' ? px : anchor === 'end' ? px - w : px - w / 2;
			const hi = lo + w;
			if (taken.some(([a, b]) => lo < b + 6 && hi > a - 6)) continue;
			taken.push([lo, hi]);
			placed.push({ id: `${place.id}-${mark.km}`, name: place.name, km: mark.km, elevation: track!.elevationAt(mark.km), px, anchor });
		}
		return placed;
	});

	const cursor = $derived.by(() => {
		if (trek.scrubKm === null || !track) return null;
		const ele = track.elevationAt(trek.scrubKm);
		return { km: trek.scrubKm, ele, cx: x(trek.scrubKm), cy: y(ele) };
	});

	function kmFromEvent(e: PointerEvent): number {
		const rect = svg!.getBoundingClientRect();
		const px = ((e.clientX - rect.left) / rect.width) * width;
		return ((px - PAD.l) / plotW) * total;
	}

	function onpointer(e: PointerEvent) {
		if (!track) return;
		if (trek.playing) trek.playing = false;
		trek.scrubbing = true;
		trek.setScrub(kmFromEvent(e));
	}

	function onleave(e: PointerEvent) {
		trek.scrubbing = false;
		// Mouse hover is transient; touch keeps the last position.
		if (e.pointerType === 'mouse' && !trek.playing) trek.setScrub(null);
	}

	function onkey(e: KeyboardEvent) {
		const step = e.shiftKey ? 2 : 0.5;
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			trek.playing = false;
			trek.setScrub((trek.scrubKm ?? 0) + (e.key === 'ArrowRight' ? step : -step));
		} else if (e.key === 'Escape') {
			trek.setScrub(null);
		}
	}
</script>

<div class="relative h-full w-full" bind:clientWidth={width} bind:clientHeight={height}>
	{#if !track}
		<p class="grid h-full place-items-center px-6 text-center text-sm text-ink-soft">
			{t('chart.empty')}
		</p>
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<svg
			bind:this={svg}
			viewBox="0 0 {width} {height}"
			class="block size-full touch-none select-none"
			role="slider"
			tabindex="0"
			aria-label={t('chart.scrubber')}
			aria-valuemin={0}
			aria-valuemax={Math.round(total)}
			aria-valuenow={Math.round(trek.scrubKm ?? 0)}
			aria-valuetext={cursor ? `${cursor.km.toFixed(1)} kilometres, ${Math.round(cursor.ele)} metres` : 'Not scrubbing'}
			onpointerdown={onpointer}
			onpointermove={onpointer}
			onpointerleave={onleave}
			onpointerup={onleave}
			onkeydown={onkey}
		>
			<defs>
				<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="5" stroke="#1f1b16" stroke-opacity="0.16" stroke-width="1" />
				</pattern>
				<clipPath id="plot-clip"><rect x={PAD.l} y={PAD.t} width={plotW} height={plotH} /></clipPath>
			</defs>

			{#each ticks as t (t)}
				<line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke="#d3c8b2" stroke-width="1" />
				<text x={PAD.l - 6} y={y(t) + 3.5} text-anchor="end" class="fill-ink-soft text-[10px]">
					{t.toLocaleString()}
				</text>
			{/each}

			{#each ZONES.filter((z) => z.at > yMin && z.at < yMax) as z (z.at)}
				<line x1={PAD.l} x2={width - PAD.r} y1={y(z.at)} y2={y(z.at)} stroke="#62594b" stroke-opacity="0.5" stroke-dasharray="2 4" />
				<text x={width - PAD.r - 2} y={y(z.at) - 4} text-anchor="end" class="display fill-ink-soft text-[10px] italic">
					{t(z.label)}
				</text>
			{/each}

			<path d={areaPath} fill="url(#hatch)" clip-path="url(#plot-clip)" />
			<path d={linePath} fill="none" stroke="#1f1b16" stroke-width="1.75" stroke-linejoin="round" />
			{#each route?.gaps ?? [] as [a, b] (a)}
				<path d={segment(a, b)} fill="none" stroke="#c4571f" stroke-width="2.5" stroke-dasharray="1 4" stroke-linecap="round" />
			{/each}

			{#each labels as l (l.id)}
				<line x1={l.px} x2={l.px} y1={y(l.elevation)} y2={y(yMin)} stroke="#1f1b16" stroke-opacity="0.25" />
				<circle cx={l.px} cy={y(l.elevation)} r="3.5" fill="#f4eee2" stroke="#1f1b16" stroke-width="1.5" />
				<text x={Math.min(Math.max(l.px, PAD.l), width - PAD.r - 4)} y={height - 8} text-anchor={l.anchor} class="fill-ink text-[10px]">
					{l.name}
				</text>
			{/each}

			{#if cursor}
				<line x1={cursor.cx} x2={cursor.cx} y1={PAD.t} y2={PAD.t + plotH} stroke="#c4571f" stroke-width="1.5" />
				<circle cx={cursor.cx} cy={cursor.cy} r="5" fill="#c4571f" stroke="#f4eee2" stroke-width="2" />
			{/if}
		</svg>

		{#if cursor}
			<div
				class="pointer-events-none absolute top-1 rounded-[2px] bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-paper tabular-nums"
				style="left: {Math.min(Math.max(cursor.cx + 12, PAD.l), width - 200)}px"
			>
				<strong class="font-semibold">{i18n.n(Math.round(cursor.ele))} m</strong>
				<span class="text-paper/60"> · </span>{cursor.km.toFixed(1)} km
				<span class="text-paper/60"> · </span>{oxygenAtElevation(cursor.ele)}% O₂
			</div>
		{/if}
	{/if}
</div>
