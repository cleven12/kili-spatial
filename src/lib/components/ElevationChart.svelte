<script lang="ts">
	import { MARANGU_ELEVATION_PROFILE, MARANGU_WAYPOINTS } from '#lib/data/maranguRoute.ts';
	import { TOTAL_KM, elevationAtDistance, oxygenAtElevation } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	const PAD = { l: 44, r: 16, t: 14, b: 26 };
	const Y_MIN = 1500;
	const Y_MAX = 6100;
	const ZONES = [
		{ from: 1500, to: 2800, label: 'Rainforest', color: '#10b981' },
		{ from: 2800, to: 4000, label: 'Moorland', color: '#84cc16' },
		{ from: 4000, to: 5000, label: 'Alpine desert', color: '#f59e0b' },
		{ from: 5000, to: 6100, label: 'Summit', color: '#93c5fd' }
	];
	const Y_TICKS = [2000, 3000, 4000, 5000, 5895];

	let width = $state(800);
	let height = $state(180);
	let svg: SVGSVGElement;

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
			<linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#34d399" stop-opacity="0.55" />
				<stop offset="100%" stop-color="#34d399" stop-opacity="0.02" />
			</linearGradient>
			<linearGradient id="line-stroke" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0%" stop-color="#10b981" />
				<stop offset="100%" stop-color="#fbbf24" />
			</linearGradient>
			<clipPath id="plot-clip"><rect x={PAD.l} y={PAD.t} width={plotW} height={plotH} /></clipPath>
		</defs>

		{#each ZONES as z (z.label)}
			<rect
				x={PAD.l}
				y={y(Math.min(z.to, Y_MAX))}
				width={plotW}
				height={y(z.from) - y(Math.min(z.to, Y_MAX))}
				fill={z.color}
				opacity="0.06"
			/>
		{/each}

		{#each Y_TICKS as t (t)}
			<line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke="white" stroke-opacity="0.08" stroke-dasharray="3 4" />
			<text x={PAD.l - 6} y={y(t) + 3} text-anchor="end" class="fill-white/50 font-mono text-[9px]">
				{t.toLocaleString()}
			</text>
		{/each}

		<path d={areaPath} fill="url(#area-fill)" clip-path="url(#plot-clip)" />
		<path d={linePath} fill="none" stroke="url(#line-stroke)" stroke-width="2.5" stroke-linejoin="round" />

		{#each waypointMarks as m (m.wp.id)}
			<line x1={x(m.km)} x2={x(m.km)} y1={y(m.wp.elevation)} y2={y(Y_MIN)} stroke="white" stroke-opacity="0.12" />
			<circle cx={x(m.km)} cy={y(m.wp.elevation)} r="3.5" fill="#090d16" stroke="#6ee7b7" stroke-width="1.5" />
			{#if m.km < TOTAL_KM - 3 || m.wp.id === 'uhuru-peak'}
			<text
				x={Math.min(x(m.km), width - PAD.r - 4)}
				y={height - 8}
				text-anchor={m.km > TOTAL_KM * 0.9 ? 'end' : m.km < 1 ? 'start' : 'middle'}
				class="fill-white/60 text-[9px]"
			>
				{m.wp.name}
			</text>
			{/if}
		{/each}

		{#if cursor}
			<line x1={cursor.cx} x2={cursor.cx} y1={PAD.t} y2={PAD.t + plotH} stroke="#fbbf24" stroke-opacity="0.7" />
			<circle cx={cursor.cx} cy={cursor.cy} r="9" fill="#fbbf24" opacity="0.25" />
			<circle cx={cursor.cx} cy={cursor.cy} r="4.5" fill="#fbbf24" stroke="white" stroke-width="1.5" />
		{/if}
	</svg>

	{#if cursor}
		<div
			class="glass pointer-events-none absolute top-1 rounded-lg px-2.5 py-1.5 font-mono text-[11px] whitespace-nowrap text-white"
			style="left: {Math.min(Math.max(cursor.cx + 12, PAD.l), width - 190)}px"
		>
			<span class="text-amber-300">{Math.round(cursor.ele).toLocaleString()} m</span>
			<span class="text-white/50"> · </span>{cursor.km.toFixed(1)} km
			<span class="text-white/50"> · </span>O₂ {oxygenAtElevation(cursor.ele)}%
		</div>
	{/if}
</div>
