<script lang="ts">
	import { Heart, Music, PanelTopClose, Plane, Satellite, Shuffle, Type, VolumeX } from 'lucide-svelte';
	import { t } from '#lib/i18n/index.svelte.ts';
	import { gps } from '#lib/state/gps.svelte.ts';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { ui } from '#lib/state/ui.svelte.ts';

	const base = 'flex items-center gap-2 border px-2.5 py-1.5 text-sm font-medium shadow-[0_2px_8px_rgb(0_0_0/0.25)] disabled:opacity-40';
	const idle = 'border-ink bg-paper hover:text-ochre';
	const on = 'border-ink bg-ink text-paper';
</script>

<div class="flex flex-col items-end gap-2">
	<div class="flex flex-wrap justify-end gap-2" role="toolbar" aria-label="Tools">
		<button
			type="button"
			class="{base} {trek.drone ? on : idle}"
			aria-pressed={trek.drone}
			disabled={!trek.mapReady}
			title={trek.drone ? t('view.droneStop') : t('view.drone')}
			onclick={() => trek.toggleDrone()}
		>
			<Plane class="size-4" aria-hidden="true" />
			<span class="max-sm:sr-only">{trek.drone ? t('view.droneStop') : t('view.drone')}</span>
		</button>
		<button type="button" class="{base} {ui.gpsOpen || gps.mode !== 'off' ? on : idle}" aria-pressed={ui.gpsOpen} title={t('gps.title')} onclick={() => (ui.gpsOpen = !ui.gpsOpen)}>
			<Satellite class="size-4" aria-hidden="true" /> <span class="max-sm:sr-only">{t('gps.button')}</span>
		</button>
		<button
			type="button"
			class="{base} {ui.music ? on : idle}"
			aria-pressed={ui.music}
			title={ui.music ? t('music.off') : t('music.on')}
			aria-label={ui.music ? t('music.off') : t('music.on')}
			onclick={() => ui.toggleMusic()}
		>
			{#if ui.music}<Music class="size-4" aria-hidden="true" />{:else}<VolumeX class="size-4" aria-hidden="true" />{/if}
		</button>
		<button type="button" class="{base} {ui.bigText ? on : idle}" aria-pressed={ui.bigText} title={t('view.bigText')} aria-label={t('view.bigText')} onclick={() => ui.toggleBigText()}>
			<Type class="size-4" aria-hidden="true" />
		</button>
		<button type="button" class="{base} {idle}" title={t('view.hideTools')} aria-label={t('view.hideTools')} onclick={() => ui.toggleTools()}>
			<PanelTopClose class="size-4" aria-hidden="true" />
		</button>
		<button type="button" class="{base} border-[#D55E00] bg-[#D55E00] text-white hover:bg-ink" onclick={() => (ui.fundOpen = true)}>
			<Heart class="size-4" aria-hidden="true" /> <span class="max-sm:sr-only">{t('fund.button')}</span>
		</button>
	</div>

	{#if trek.drone}
		<div class="flex border border-ink bg-paper text-sm shadow-[0_2px_8px_rgb(0_0_0/0.25)]" role="group" aria-label={t('view.droneMode')}>
			<button type="button" class="px-3 py-1 {trek.droneStyle === 'orbit' ? on : 'hover:text-ochre'}" aria-pressed={trek.droneStyle === 'orbit'} onclick={() => (trek.droneStyle = 'orbit')}>
				{t('view.droneOrbit')}
			</button>
			<button type="button" class="flex items-center gap-1.5 px-3 py-1 {trek.droneStyle === 'free' ? on : 'hover:text-ochre'}" aria-pressed={trek.droneStyle === 'free'} onclick={() => (trek.droneStyle = 'free')}>
				<Shuffle class="size-3.5" aria-hidden="true" /> {t('view.droneFree')}
			</button>
		</div>
	{/if}
</div>
