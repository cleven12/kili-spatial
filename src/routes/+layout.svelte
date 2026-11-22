<script lang="ts">
	import './layout.css';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import favicon from '#lib/assets/favicon.svg';
	import { ui } from '#lib/state/ui.svelte.ts';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		document.documentElement.dataset.theme = ui.theme;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
