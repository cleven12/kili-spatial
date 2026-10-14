<script lang="ts">
	import { Badge, Button, Tooltip } from 'flowbite-svelte';
	import { Compass, Info } from 'lucide-svelte';
	import { MARANGU_STATS } from '#lib/data/maranguRoute.ts';
	import { trek } from '#lib/state/trek.svelte.ts';
	import AboutModal from './AboutModal.svelte';
	import StatsHud from './StatsHud.svelte';

	let aboutOpen = $state(false);
</script>

<header
	class="glass pointer-events-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl px-4 py-3"
>
	<div class="flex items-center gap-3">
		<Button
			id="reset-view"
			color="alternative"
			class="size-9 rounded-xl border-primary-400/30 bg-primary-500/10 p-0 text-primary-300 hover:bg-primary-500/20"
			aria-label="Reset camera to overview"
			onclick={() => trek.showOverview()}
		>
			<Compass class="size-5" aria-hidden="true" />
		</Button>
		<Tooltip triggeredBy="#reset-view">Reset camera</Tooltip>

		<div class="leading-tight">
			<h1 class="font-mono text-xs font-semibold tracking-wider text-white sm:text-sm sm:tracking-[0.18em]">
				KILISPATIAL <span class="text-primary-400">//</span> 3D EXPEDITION
			</h1>
			<Badge color="secondary" rounded class="mt-1">
				Marangu Route ({MARANGU_STATS.durationDays} Days / {MARANGU_STATS.totalDistanceKm} km)
			</Badge>
		</div>
		<Button
			id="about-btn"
			color="alternative"
			size="xs"
			class="ms-1 size-8 rounded-lg p-0"
			aria-label="About and data sources"
			onclick={() => (aboutOpen = true)}
		>
			<Info class="size-4" aria-hidden="true" />
		</Button>
		<Tooltip triggeredBy="#about-btn">About &amp; data sources</Tooltip>
	</div>

	<div class="flex items-center gap-4">
		<StatsHud />

	</div>
</header>

<AboutModal bind:open={aboutOpen} />
