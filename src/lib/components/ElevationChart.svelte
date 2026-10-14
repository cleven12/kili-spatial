<script lang="ts">
	import { MARANGU_ELEVATION_PROFILE, MARANGU_WAYPOINTS } from '#lib/data/maranguRoute.ts';
	import { TOTAL_KM, elevationAtDistance, oxygenAtElevation } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	const PAD = { l: 44, r: 16, t: 14, b: 26 };
	const Y_MIN = 1500;
	const Y_MAX = 6100;
	// Vegetation zone boundaries, drawn as labelled rules like a printed section.
	const ZONES = [
		{ at: 2800, label: 'Rainforest ↓' },
		{ at: 4000, label: 'Moorland ↓' },
		{ at: 5000, label: 'Alpine desert ↓' }
	];
	const Y_TICKS = [2000, 3000, 4000, 5000, 5895];

	let width = $state(800);
	let height = $state(180);
	let svg: SVGSVGElement;

	// On narrow embeds only label the start, the halfway camp and the summit.
	const compact = $derived(width < 560);
	const KEY_LABELS = ['marangu-gate', 'horombo-hut', 'uhuru-peak'];

	const plotW = $derived(Math.max(1, width - PAD.l - PAD.r));
	const plotH = $derived(Math.max(1, height - PAD.t - PAD.b));
	const x = (km: number) => PAD.l + (km / TOTAL_KM) * plotW;
	const y = (m: number) => PAD.t + (1 - (m - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

	const linePath = $derived(
		MARANGU_ELEVATION_PROFILE.map((p, i) => `${i ? 'L' : 'M'}${x(p.distanceKm)},${y(p.elevation)}`).join(' ')
	);
	const areaPath = $derived(`${linePath} L${x(TOTAL_KM)},${y(Y_MIN)} L${x(0)},${y(Y_MIN)} Z`);

	const waypointMarks = $derived(
		MARANGU_WAYPOINTS.map((wp) => {
			const hit = MARANGU_ELEVATION_PROFILE.find((p) => p.name === wp.name)!;
			return { wp, km: hit.distanceKm };
		})
	);

	const cursor = $derived.by(() => {
		if (trek.scrubKm === null) return null;
		const ele = elevationAtDistance(trek.scrubKm);
		return { km: trek.scrubKm, ele, cx: x(trek.scrubKm), cy: y(ele) };
	});

	function kmFromEvent(e: PointerEvent): number {
		const rect = svg.getBoundingClientRect();
		const px = ((e.clientX - rect.left) / rect.width) * width;
		return ((px - PAD.l) / plotW) * TOTAL_KM;
	}

	function onpointer(e: PointerEvent) {
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
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<svg
		bind:this={svg}
		viewBox="0 0 {width} {height}"
		class="block size-full touch-none select-none"
		role="slider"
		tabindex="0"
		aria-label="Elevation profile scrubber"
		aria-valuemin={0}
		aria-valuemax={TOTAL_KM}
		aria-valuenow={trek.scrubKm ?? 0}
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

		{#each Y_TICKS as t (t)}
			<line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke="#d3c8b2" stroke-width="1" />
			<text x={PAD.l - 6} y={y(t) + 3.5} text-anchor="end" class="fill-ink-soft text-[10px]">
				{t.toLocaleString()}
			</text>
		{/each}

		{#each ZONES as z (z.at)}
			<line x1={PAD.l} x2={width - PAD.r} y1={y(z.at)} y2={y(z.at)} stroke="#62594b" stroke-opacity="0.5" stroke-dasharray="2 4" />
			<text x={width - PAD.r - 2} y={y(z.at) - 4} text-anchor="end" class="display fill-ink-soft text-[10px] italic">
				{z.label}
			</text>
		{/each}

		<path d={areaPath} fill="url(#hatch)" clip-path="url(#plot-clip)" />
		<path d={linePath} fill="none" stroke="#1f1b16" stroke-width="1.75" stroke-linejoin="round" />

		{#each waypointMarks as m (m.wp.id)}
			<line x1={x(m.km)} x2={x(m.km)} y1={y(m.wp.elevation)} y2={y(Y_MIN)} stroke="#1f1b16" stroke-opacity="0.25" />
			<circle cx={x(m.km)} cy={y(m.wp.elevation)} r="3.5" fill="#f4eee2" stroke="#1f1b16" stroke-width="1.5" />
			{#if (m.km < TOTAL_KM - 3 || m.wp.id === 'uhuru-peak') && (!compact || KEY_LABELS.includes(m.wp.id))}
				<text
					x={Math.min(x(m.km), width - PAD.r - 4)}
					y={height - 8}
					text-anchor={m.km > TOTAL_KM * 0.9 ? 'end' : m.km < 1 ? 'start' : 'middle'}
					class="fill-ink text-[10px]"
				>
					{m.wp.name}
				</text>
			{/if}
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
			<strong class="font-semibold">{Math.round(cursor.ele).toLocaleString()} m</strong>
			<span class="text-paper/60"> · </span>{cursor.km.toFixed(1)} km
			<span class="text-paper/60"> · </span>{oxygenAtElevation(cursor.ele)}% O₂
		</div>
	{/if}
</div>
