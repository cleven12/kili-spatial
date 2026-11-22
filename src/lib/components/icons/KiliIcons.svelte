<script lang="ts">
	interface Props {
		name: 'peak' | 'safari' | 'zanzibar' | 'compass' | 'tent' | 'boots' | 'backpack' | 'gauge' | 'shield' | 'flag';
		style?: 'linear' | 'duotone' | 'isometric';
		size?: number;
		class?: string;
		interactive?: boolean;
	}

	let {
		name = 'peak',
		style = 'linear',
		size = 32,
		class: className = '',
		interactive = true
	}: Props = $props();

	const animClasses = $derived(
		interactive
			? 'transition-all duration-300 ease-out hover:scale-110 hover:-rotate-2 cursor-pointer filter drop-shadow-sm hover:drop-shadow-md'
			: ''
	);
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 64 64"
	width={size}
	height={size}
	class="{animClasses} {className}"
	fill="none"
	stroke-linecap="round"
	stroke-linejoin="round"
	role="img"
	aria-label="{name} icon ({style})"
>
	<defs>
		<!-- Zanzibar oceanic gradient -->
		<linearGradient id="zanzibarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="#38bdf8" />
			<stop offset="60%" stop-color="#0284c7" />
			<stop offset="100%" stop-color="#075985" />
		</linearGradient>

		<!-- Savanna ochre & earth gradient -->
		<linearGradient id="savannaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="#ef9d68" />
			<stop offset="60%" stop-color="#c4571f" />
			<stop offset="100%" stop-color="#6e2d12" />
		</linearGradient>

		<!-- Peak duotone gradient -->
		<linearGradient id="peakGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#ffffff" />
			<stop offset="40%" stop-color="#bae6fd" />
			<stop offset="100%" stop-color="#3d3428" />
		</linearGradient>

		<!-- Isometric shadow filter -->
		<filter id="isoShadow" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#1f1b16" flood-opacity="0.25" />
		</filter>
	</defs>

	{#if style === 'linear'}
		<!-- LINEAR STYLE: Crisp 2.5px strokes, mobile legibility, consistent geometry -->
		{#if name === 'peak'}
			<path d="M4 52L26 12L36 30L44 18L60 52H4Z" stroke="currentColor" stroke-width="2.5" />
			<path d="M26 12L31 22L36 18L44 32" stroke="currentColor" stroke-width="2.5" />
			<path d="M20 23L26 27L32 23" stroke="currentColor" stroke-width="2" />
			<path d="M38 27L44 33L50 29" stroke="currentColor" stroke-width="2" />
		{:else if name === 'safari'}
			<!-- Safari Jeep / 4x4 silhouette linear -->
			<path d="M10 40H6V28L14 20H40L48 28H56V40H52" stroke="currentColor" stroke-width="2.5" />
			<circle cx="18" cy="42" r="6" stroke="currentColor" stroke-width="2.5" />
			<circle cx="44" cy="42" r="6" stroke="currentColor" stroke-width="2.5" />
			<path d="M14 28H30V22H16L14 28Z" stroke="currentColor" stroke-width="2" />
			<path d="M34 28H46L42 22H34V28Z" stroke="currentColor" stroke-width="2" />
			<path d="M6 34H12M24 34H38M50 34H56" stroke="currentColor" stroke-width="2" />
		{:else if name === 'zanzibar'}
			<!-- Zanzibar Dhow sail & ocean waves -->
			<path d="M34 8V44M34 10L52 38H34M34 16L16 38H34" stroke="currentColor" stroke-width="2.5" />
			<path d="M10 44C20 48 44 48 54 44L50 50H14L10 44Z" stroke="currentColor" stroke-width="2.5" />
			<path d="M6 56C12 54 18 58 24 56C30 54 36 58 42 56C48 54 54 58 60 56" stroke="currentColor" stroke-width="2" />
		{:else if name === 'compass'}
			<circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2.5" />
			<polygon points="32,16 37,29 32,32 27,29" fill="currentColor" stroke="currentColor" stroke-width="1.5" />
			<polygon points="32,48 37,35 32,32 27,35" stroke="currentColor" stroke-width="1.5" />
			<circle cx="32" cy="32" r="2.5" fill="currentColor" />
			<line x1="32" y1="8" x2="32" y2="12" stroke="currentColor" stroke-width="2" />
			<line x1="32" y1="52" x2="32" y2="56" stroke="currentColor" stroke-width="2" />
			<line x1="8" y1="32" x2="12" y2="32" stroke="currentColor" stroke-width="2" />
			<line x1="52" y1="32" x2="56" y2="32" stroke="currentColor" stroke-width="2" />
		{:else if name === 'tent'}
			<path d="M8 50L32 14L56 50H8Z" stroke="currentColor" stroke-width="2.5" />
			<path d="M32 14L44 50" stroke="currentColor" stroke-width="2" />
			<line x1="4" y1="50" x2="60" y2="50" stroke="currentColor" stroke-width="2.5" />
			<path d="M26 50L32 38L38 50" stroke="currentColor" stroke-width="2" />
		{:else if name === 'boots'}
			<path d="M16 12H30V28L40 34V46H16V12Z" stroke="currentColor" stroke-width="2.5" />
			<path d="M40 40H48C52 40 54 42 54 46V48H14V46H16" stroke="currentColor" stroke-width="2.5" />
			<line x1="20" y1="20" x2="26" y2="20" stroke="currentColor" stroke-width="2" />
			<line x1="20" y1="26" x2="26" y2="26" stroke="currentColor" stroke-width="2" />
			<line x1="16" y1="52" x2="52" y2="52" stroke="currentColor" stroke-width="2" />
		{:else if name === 'backpack'}
			<rect x="18" y="18" width="28" height="34" rx="4" stroke="currentColor" stroke-width="2.5" />
			<path d="M26 18V12C26 10 38 10 38 12V18" stroke="currentColor" stroke-width="2" />
			<rect x="22" y="26" width="20" height="12" rx="2" stroke="currentColor" stroke-width="2" />
			<line x1="22" y1="44" x2="42" y2="44" stroke="currentColor" stroke-width="2" />
			<path d="M14 26V42M50 26V42" stroke="currentColor" stroke-width="2.5" />
		{:else if name === 'gauge'}
			<circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="2.5" />
			<path d="M20 44C16 40 14 34 14 28C14 18 22 10 32 10C42 10 50 18 50 28C50 34 48 40 44 44" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
			<line x1="32" y1="32" x2="44" y2="22" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
			<circle cx="32" cy="32" r="3.5" fill="currentColor" />
		{:else if name === 'shield'}
			<path d="M32 8L48 14V28C48 40 32 54 32 54C32 54 16 40 16 28V14L32 8Z" stroke="currentColor" stroke-width="2.5" />
			<path d="M26 30L30 34L38 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
		{:else if name === 'flag'}
			<path d="M14 10V54" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
			<path d="M14 12H44L36 24L44 36H14" stroke="currentColor" stroke-width="2.5" fill="none" />
			<line x1="8" y1="54" x2="22" y2="54" stroke="currentColor" stroke-width="2.5" />
		{/if}

	{:else if style === 'duotone'}
		<!-- DUOTONE & GRADIENT STYLE: Knockout silhouettes, vibrant savanna ochre & ocean azure -->
		{#if name === 'peak'}
			<polygon points="4,52 26,12 36,30 44,18 60,52" fill="url(#savannaGradient)" opacity="0.3" />
			<path d="M4 52L26 12L36 30L44 18L60 52H4Z" stroke="currentColor" stroke-width="2.5" />
			<!-- Glacial cap snow knockout -->
			<polygon points="26,12 31,22 36,18 44,32 38,34 32,24 24,26" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.5" />
			<circle cx="48" cy="14" r="5" fill="#ef9d68" />
		{:else if name === 'safari'}
			<!-- Safari Jeep with duotone knockout body -->
			<rect x="8" y="22" width="44" height="18" rx="3" fill="url(#savannaGradient)" opacity="0.4" />
			<path d="M10 40H6V28L14 20H40L48 28H56V40H52" stroke="currentColor" stroke-width="2.5" />
			<!-- Knockout windows -->
			<rect x="16" y="24" width="12" height="8" rx="1.5" fill="#ffffff" stroke="currentColor" stroke-width="1.5" />
			<rect x="32" y="24" width="12" height="8" rx="1.5" fill="#ffffff" stroke="currentColor" stroke-width="1.5" />
			<circle cx="18" cy="42" r="6" fill="#1f1b16" stroke="currentColor" stroke-width="2" />
			<circle cx="18" cy="42" r="2.5" fill="#f4eee2" />
			<circle cx="44" cy="42" r="6" fill="#1f1b16" stroke="currentColor" stroke-width="2" />
			<circle cx="44" cy="42" r="2.5" fill="#f4eee2" />
		{:else if name === 'zanzibar'}
			<!-- Zanzibar oceanic azure gradient dhow -->
			<path d="M6 50C16 46 44 46 58 50C54 56 46 58 20 58C12 58 8 54 6 50Z" fill="url(#zanzibarGradient)" opacity="0.3" />
			<path d="M34 6V46" stroke="#0369a1" stroke-width="2.5" />
			<polygon points="34,8 54,40 34,40" fill="url(#zanzibarGradient)" opacity="0.8" />
			<polygon points="34,14 14,40 34,40" fill="#38bdf8" opacity="0.6" />
			<path d="M6 56C14 54 22 58 30 56C38 54 46 58 58 56" stroke="#0284c7" stroke-width="2" />
		{:else if name === 'compass'}
			<circle cx="32" cy="32" r="24" fill="#ef9d68" opacity="0.15" stroke="currentColor" stroke-width="2.5" />
			<polygon points="32,14 38,29 32,32 26,29" fill="#c4571f" stroke="#a94518" stroke-width="1.5" />
			<polygon points="32,50 38,35 32,32 26,35" fill="#77904a" stroke="#485a2e" stroke-width="1.5" />
			<circle cx="32" cy="32" r="4" fill="#ffffff" stroke="currentColor" stroke-width="2" />
		{:else if name === 'shield'}
			<path d="M32 8L48 14V28C48 40 32 54 32 54C32 54 16 40 16 28V14L32 8Z" fill="url(#zanzibarGradient)" opacity="0.25" stroke="currentColor" stroke-width="2.5" />
			<circle cx="32" cy="30" r="10" fill="#ffffff" />
			<path d="M28 30L31 33L37 26" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" />
		{:else}
			<!-- Default duotone circle backplate -->
			<circle cx="32" cy="32" r="24" fill="url(#savannaGradient)" opacity="0.2" />
			<path d="M20 44L32 16L44 44H20Z" stroke="currentColor" stroke-width="2.5" />
			<line x1="16" y1="48" x2="48" y2="48" stroke="#c4571f" stroke-width="2.5" />
		{/if}

	{:else if style === 'isometric'}
		<!-- ISOMETRIC STYLE: 3D Axonometric projection, technical contour lines, adventure gear -->
		{#if name === 'peak'}
			<!-- 3D Mountain Peak with contour steps -->
			<g filter="url(#isoShadow)">
				<!-- Base plane -->
				<polygon points="32,8 54,20 32,32 10,20" fill="#f4eee2" stroke="currentColor" stroke-width="1.5" />
				<!-- Isometric peak facet left -->
				<polygon points="32,10 10,38 32,54" fill="#8c7853" stroke="currentColor" stroke-width="2" />
				<!-- Isometric peak facet right -->
				<polygon points="32,10 54,38 32,54" fill="#c2b280" stroke="currentColor" stroke-width="2" />
				<!-- Glacial snow crown -->
				<polygon points="32,10 21,24 28,26 32,22 36,26 43,24" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
				<!-- Contour elevation lines -->
				<path d="M17 30L32 40L47 30" stroke="#f4eee2" stroke-width="1.5" stroke-dasharray="2 2" />
				<path d="M22 38L32 46L42 38" stroke="#f4eee2" stroke-width="1.5" stroke-dasharray="2 2" />
			</g>
		{:else if name === 'safari'}
			<!-- 3D Isometric Safari Cruiser -->
			<g filter="url(#isoShadow)">
				<!-- Roof -->
				<polygon points="32,14 48,22 32,30 16,22" fill="#ef9d68" stroke="currentColor" stroke-width="1.5" />
				<!-- Side left -->
				<polygon points="16,22 32,30 32,44 16,36" fill="#c4571f" stroke="currentColor" stroke-width="2" />
				<!-- Side right -->
				<polygon points="32,30 48,22 48,36 32,44" fill="#6e2d12" stroke="currentColor" stroke-width="2" />
				<!-- Wheels 3D -->
				<ellipse cx="22" cy="40" rx="3.5" ry="6" fill="#1f1b16" />
				<ellipse cx="40" cy="40" rx="3.5" ry="6" fill="#1f1b16" />
			</g>
		{:else if name === 'zanzibar'}
			<!-- 3D Isometric Ocean Terrace & Wave -->
			<g filter="url(#isoShadow)">
				<polygon points="32,12 56,24 32,36 8,24" fill="url(#zanzibarGradient)" stroke="#0284c7" stroke-width="2" />
				<polygon points="8,24 32,36 32,46 8,34" fill="#0369a1" stroke="currentColor" stroke-width="1.5" />
				<polygon points="32,36 56,24 56,34 32,46" fill="#075985" stroke="currentColor" stroke-width="1.5" />
				<path d="M16 24L32 32L48 24" stroke="#ffffff" stroke-width="2" />
			</g>
		{:else}
			<!-- 3D Isometric Compass Pillar -->
			<g filter="url(#isoShadow)">
				<polygon points="32,10 50,20 32,30 14,20" fill="#e8edd8" stroke="currentColor" stroke-width="1.5" />
				<polygon points="14,20 32,30 32,48 14,38" fill="#77904a" stroke="currentColor" stroke-width="2" />
				<polygon points="32,30 50,20 50,38 32,48" fill="#485a2e" stroke="currentColor" stroke-width="2" />
				<circle cx="32" cy="20" r="4" fill="#c4571f" />
			</g>
		{/if}
	{/if}
</svg>
