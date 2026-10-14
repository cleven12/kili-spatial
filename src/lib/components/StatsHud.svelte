<script lang="ts">
	import { Mountain, Wind, CloudRain, Sun, Snowflake, Activity, Thermometer } from 'lucide-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { vegetationAt } from '#lib/data/route.ts';

	const icons = { 'cloud-rain': CloudRain, cloud: CloudRain, sun: Sun, wind: Wind, snowflake: Snowflake };
	const WeatherIcon = $derived(icons[trek.weather.icon]);
</script>

<div class="flex flex-wrap items-center gap-x-5 gap-y-2" aria-live="off">
	<div class="flex items-center gap-2">
		<Mountain class="size-4 text-amber-300" aria-hidden="true" />
		<div class="leading-tight">
			<div class="font-mono text-sm font-semibold text-white tabular-nums">
				{trek.elevation.toLocaleString()} <span class="text-[10px] font-normal text-white/50">m</span>
			</div>
			<div class="text-[10px] tracking-wide text-white/50 uppercase">Altitude</div>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<Activity class="size-4 text-emerald-400" aria-hidden="true" />
		<div class="leading-tight">
			<div class="font-mono text-sm font-semibold text-white tabular-nums">
				{trek.oxygen}<span class="text-[10px] font-normal text-white/50">%</span>
			</div>
			<div class="text-[10px] tracking-wide text-white/50 uppercase">O₂ available</div>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<WeatherIcon class="size-4 text-sky-300" aria-hidden="true" />
		<div class="leading-tight">
			<div class="text-sm font-medium text-white">{trek.weather.label}</div>
			<div class="text-[10px] tracking-wide text-white/50 uppercase">
				<Thermometer class="mr-0.5 inline size-2.5" aria-hidden="true" />{trek.weather.tempC}°C ·
				{trek.weather.windKph} km/h · sim
			</div>
		</div>
	</div>
	<div class="hidden leading-tight xl:block">
		<div class="text-sm font-medium text-white">{vegetationAt(trek.elevation)}</div>
		<div class="text-[10px] tracking-wide text-white/50 uppercase">Zone</div>
	</div>
</div>
