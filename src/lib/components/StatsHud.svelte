<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { Mountain, Wind, CloudRain, Sun, Snowflake, Activity, Thermometer } from 'lucide-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { vegetationAt } from '#lib/data/route.ts';

	const icons = { 'cloud-rain': CloudRain, cloud: CloudRain, sun: Sun, wind: Wind, snowflake: Snowflake };
	const WeatherIcon = $derived(icons[trek.weather.icon]);
</script>

<dl class="flex flex-wrap items-center gap-x-5 gap-y-2">
	<div id="stat-alt" class="flex items-center gap-2">
		<Mountain class="size-4 text-secondary-300" aria-hidden="true" />
		<div class="leading-tight">
			<dd class="font-mono text-sm font-semibold text-white tabular-nums">
				{trek.elevation.toLocaleString()} <span class="text-[10px] font-normal text-gray-400">m</span>
			</dd>
			<dt class="text-[10px] tracking-wide text-gray-400 uppercase">Altitude</dt>
		</div>
	</div>
	<Tooltip triggeredBy="#stat-alt">Elevation at the scrubbed point, or under the camera</Tooltip>

	<div id="stat-o2" class="flex items-center gap-2">
		<Activity class="size-4 text-primary-400" aria-hidden="true" />
		<div class="leading-tight">
			<dd class="font-mono text-sm font-semibold text-white tabular-nums">
				{trek.oxygen}<span class="text-[10px] font-normal text-gray-400">%</span>
			</dd>
			<dt class="text-[10px] tracking-wide text-gray-400 uppercase">O₂ available</dt>
		</div>
	</div>
	<Tooltip triggeredBy="#stat-o2">Share of sea-level oxygen at this altitude (barometric estimate)</Tooltip>

	<div id="stat-wx" class="hidden items-center gap-2 sm:flex">
		<WeatherIcon class="size-4 text-sky-300" aria-hidden="true" />
		<div class="leading-tight">
			<dd class="text-sm font-medium text-white">{trek.weather.label}</dd>
			<dt class="text-[10px] tracking-wide text-gray-400 uppercase">
				<Thermometer class="mr-0.5 inline size-2.5" aria-hidden="true" />{trek.weather.tempC}°C ·
				{trek.weather.windKph} km/h
			</dt>
		</div>
	</div>
	<Tooltip triggeredBy="#stat-wx">Simulated from altitude, not live weather</Tooltip>

	<div class="hidden leading-tight xl:block">
		<dd class="text-sm font-medium text-white">{vegetationAt(trek.elevation)}</dd>
		<dt class="text-[10px] tracking-wide text-gray-400 uppercase">Zone</dt>
	</div>
</dl>
