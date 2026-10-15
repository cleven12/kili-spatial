<script lang="ts">
	import { Select } from 'flowbite-svelte';
	import { Download, Plane, LocateFixed, Pause, Play, Satellite, Upload, X } from 'lucide-svelte';
	import { gps, RATES } from '#lib/state/gps.svelte.ts';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { formatClock } from '#lib/sim/timeline.ts';

	let open = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	const fix = $derived(gps.fix);
	const tl = $derived(gps.timeline);
	const rateItems = RATES.map((r) => ({ value: String(r.value), name: r.label }));

	// The cinematic fly-through and the GPS replay both drive the map; only one at a time.
	$effect(() => {
		if (trek.playing && gps.mode !== 'off') gps.stop();
	});

	// Switching route rebuilds the simulated schedule.
	let lastRoute: string | null = null;
	$effect(() => {
		const id = trek.routeId;
		if (id !== lastRoute) {
			lastRoute = id;
			if (gps.mode === 'sim') gps.startSim();
			else if (gps.mode === 'import') gps.stop();
		}
	});

	const f2 = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString() : '—');

	const sourceLabel = $derived(
		gps.mode === 'sim' ? 'Simulated GPS' : gps.mode === 'import' ? `GPX: ${gps.imported?.name}` : gps.mode === 'live' ? 'Your location' : ''
	);
</script>

<div class="absolute top-3 right-14 z-10 flex flex-col items-end gap-2 max-md:top-[4.25rem] max-md:right-3">
	<button
		type="button"
		class="flex items-center gap-2 border px-3 py-1.5 text-sm font-medium shadow-[0_2px_8px_rgb(0_0_0/0.25)] {trek.drone ? 'border-ink bg-ink text-paper' : 'border-ink bg-paper hover:text-ochre'}"
		aria-pressed={trek.drone}
		disabled={!trek.mapReady}
		onclick={() => trek.toggleDrone()}
	>
		<Plane class="size-4" aria-hidden="true" /> {trek.drone ? 'Stop drone view' : 'Drone view'}
	</button>
	{#if !open}
		<button
			type="button"
			class="flex items-center gap-2 border border-ink bg-paper px-3 py-1.5 text-sm font-medium shadow-[0_2px_8px_rgb(0_0_0/0.25)] hover:text-ochre"
			onclick={() => (open = true)}
		>
			<Satellite class="size-4" aria-hidden="true" /> GPS{gps.mode !== 'off' ? ' · on' : ''}
		</button>
	{:else}
		<section
			aria-label="GPS simulation"
			class="max-h-[calc(100dvh-15rem)] w-[min(21rem,calc(100vw-1.5rem))] overflow-y-auto border border-rule bg-paper px-4 py-3 shadow-[0_6px_24px_rgb(0_0_0/0.25)]"
		>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="label">{sourceLabel || 'Position source'}</p>
					<h3 class="display text-lg leading-tight font-medium">GPS</h3>
				</div>
				<button type="button" class="rounded-sm p-1 text-ink-soft hover:text-ochre" aria-label="Close GPS panel" onclick={() => (open = false)}>
					<X class="size-4" aria-hidden="true" />
				</button>
			</div>

			<div class="mt-3 grid grid-cols-3 gap-2 text-[13px]">
				<button
					type="button"
					class="flex flex-col items-center gap-1 border px-2 py-2 disabled:opacity-40 {gps.mode === 'sim' ? 'border-ink bg-paper-2' : 'border-rule hover:border-ink'}"
					disabled={!trek.route}
					title={trek.route ? `Simulate a trek on ${trek.route.name}` : 'Select a route to simulate'}
					onclick={() => gps.startSim()}
				>
					<Satellite class="size-4" aria-hidden="true" /> Simulate
				</button>
				<button
					type="button"
					class="flex flex-col items-center gap-1 border px-2 py-2 {gps.mode === 'import' ? 'border-ink bg-paper-2' : 'border-rule hover:border-ink'}"
					title="Replay a GPX file"
					onclick={() => fileInput?.click()}
				>
					<Upload class="size-4" aria-hidden="true" /> GPX file
				</button>
				<input
					bind:this={fileInput}
					type="file"
					accept=".gpx,application/gpx+xml,text/xml,application/xml"
					class="hidden"
					onchange={(e) => {
						const file = e.currentTarget.files?.[0];
						if (file) void gps.importGpx(file);
						e.currentTarget.value = '';
					}}
				/>
				<button
					type="button"
					class="flex flex-col items-center gap-1 border px-2 py-2 {gps.mode === 'live' ? 'border-ink bg-paper-2' : 'border-rule hover:border-ink'}"
					title="Show your device location (stays in your browser)"
					onclick={() => gps.startLive()}
				>
					<LocateFixed class="size-4" aria-hidden="true" /> My location
				</button>
			</div>

			{#if gps.error}
				<p class="mt-3 border-l-[3px] border-ochre bg-paper-2 px-3 py-2 text-[13px]" role="alert">{gps.error}</p>
			{/if}

			{#if tl}
				<div class="mt-4 flex items-center gap-3">
					<button
						type="button"
						class="flex items-center gap-2 bg-ink px-3 py-1.5 text-sm font-medium text-paper hover:bg-ochre"
						onclick={() => gps.toggle()}
					>
						{#if gps.playing}<Pause class="size-4" aria-hidden="true" /> Pause{:else}<Play class="size-4" aria-hidden="true" /> {gps.atEnd ? 'Replay' : 'Play'}{/if}
					</button>
					<p class="text-sm tabular-nums">
						{#if fix}{fix.day ? `Day ${fix.day} · ` : ''}{formatClock(fix.time)} <span class="text-ink-soft">EAT</span>{/if}
					</p>
				</div>

				<div class="relative mt-3">
					<input
						type="range"
						class="w-full accent-[#c4571f]"
						min="0"
						max={tl.duration}
						step="1"
						value={gps.clock}
						aria-label="Timeline"
						oninput={(e) => {
							gps.pause();
							gps.setClock(+e.currentTarget.value);
						}}
					/>
					<div class="relative h-3 text-[10px] text-ink-soft">
						{#each tl.dayStarts as d (d.day)}
							<span class="absolute -translate-x-1/2" style="left: {(d.t / tl.duration) * 100}%">{d.day}</span>
						{/each}
					</div>
				</div>

				<div class="mt-2 grid grid-cols-2 gap-2">
					<label class="block">
						<span class="label">Speed</span>
						<Select size="sm" class="mt-1 rounded-sm border-rule bg-paper text-ink" items={rateItems} value={String(gps.rate)} onchange={(e: Event) => (gps.rate = +(e.target as HTMLSelectElement).value)} />
					</label>
					{#if gps.mode === 'sim'}
						<label class="block">
							<span class="label">Start date</span>
							<input type="date" class="mt-1 w-full border border-rule bg-paper px-2 py-[7px] text-sm" bind:value={gps.startDate} onchange={() => gps.startSim()} />
						</label>
					{/if}
				</div>
			{/if}

			{#if fix}
				<dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule pt-3 text-sm">
					<div><dt class="label">Latitude</dt><dd class="tabular-nums">{fix.lat.toFixed(5)}</dd></div>
					<div><dt class="label">Longitude</dt><dd class="tabular-nums">{fix.lng.toFixed(5)}</dd></div>
					<div><dt class="label">Altitude</dt><dd class="tabular-nums">{f2(fix.ele)} m</dd></div>
					{#if gps.mode !== 'import'}
						<div><dt class="label">Accuracy</dt><dd class="tabular-nums">±{f2(fix.accuracy)} m</dd></div>
					{/if}
					<div><dt class="label">Speed</dt><dd class="tabular-nums">{fix.speedKmh.toFixed(1)} km/h</dd></div>
					<div><dt class="label">Heading</dt><dd class="tabular-nums">{f2(fix.heading)}°</dd></div>
				</dl>
				<div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
					<label class="flex items-center gap-2">
						<input type="checkbox" class="accent-[#c4571f]" bind:checked={gps.follow} /> Camera follows
					</label>
					<div class="flex gap-3">
						{#if gps.mode === 'sim'}
							<button type="button" class="flex items-center gap-1 underline decoration-rule underline-offset-4 hover:text-ochre" onclick={() => gps.exportGpx()}>
								<Download class="size-4" aria-hidden="true" /> GPX
							</button>
						{/if}
						<button type="button" class="underline decoration-rule underline-offset-4 hover:text-ochre" onclick={() => gps.stop()}>Stop</button>
					</div>
				</div>
			{/if}

			<p class="mt-3 text-[12px] text-ink-soft">
				{gps.mode === 'live'
					? 'Real device location. Not a navigation aid; this map is approximate.'
					: gps.mode === 'import'
						? 'Your file is read in this browser and never uploaded.'
						: 'Simulated positions are synthetic, built from a walking-pace model. They are not a recorded track.'}
			</p>
		</section>
	{/if}
</div>
