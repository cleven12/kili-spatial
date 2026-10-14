<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { vegetationAt } from '#lib/data/route.ts';
</script>

<section aria-label="Current readout" class="border-t border-rule px-5 py-3.5">
	<p class="label">
		{trek.scrubKm !== null ? `At ${trek.scrubKm.toFixed(1)} km on the trail` : 'Under the camera'}
	</p>
	<p class="display text-5xl leading-none font-medium tabular-nums">
		{trek.elevation.toLocaleString()}<span class="ml-1 font-sans text-lg font-normal text-ink-soft">m</span>
	</p>
	<p class="display mt-2 text-[15px] text-ink-soft italic">
		{vegetationAt(trek.elevation)}
	</p>

	<dl class="mt-3 grid grid-cols-3 gap-3 text-sm">
		<div id="r-o2">
			<dt class="label">Oxygen</dt>
			<dd class="font-medium tabular-nums">{trek.oxygen}%</dd>
		</div>
		<div id="r-temp">
			<dt class="label">Temp</dt>
			<dd class="font-medium tabular-nums">{trek.weather.tempC}°C</dd>
		</div>
		<div id="r-wind">
			<dt class="label">Wind</dt>
			<dd class="font-medium tabular-nums">{trek.weather.windKph} km/h</dd>
		</div>
	</dl>
	<Tooltip triggeredBy="#r-o2">Share of sea-level oxygen at this altitude (barometric estimate)</Tooltip>
	<Tooltip triggeredBy="#r-temp">Simulated from altitude: {trek.weather.label}. Not live weather</Tooltip>
	<Tooltip triggeredBy="#r-wind">Simulated from altitude. Not live weather</Tooltip>
</section>
