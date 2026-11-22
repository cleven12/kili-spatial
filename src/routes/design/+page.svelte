<script lang="ts">
	import { onMount } from 'svelte';
	import { loadDataset, type Dataset } from '#lib/data/load.ts';
	import { spatial3D, type SpatialQueryResult, type BenchmarkReport } from '#lib/spatial/spatialIndex.ts';
	import KiliIcons from '#lib/components/icons/KiliIcons.svelte';
	import {
		Compass,
		Mountain,
		ShieldCheck,
		Sun,
		Trees,
		Zap,
		Activity,
		ChevronRight,
		CheckCircle2,
		Copy,
		ExternalLink,
		Sliders,
		Sparkles,
		Layers,
		Check,
		Info,
		Calendar,
		ArrowRight,
		Clock,
		MapPin,
		Gauge,
		HelpCircle
	} from 'lucide-svelte';

	// StyleScape Flavor Tier
	type StylescapeDirection = 'mild' | 'medium' | 'spicy';
	let selectedDirection = $state<StylescapeDirection>('medium');

	// Active Icon Style Filter
	type IconStyle = 'linear' | 'duotone' | 'isometric';
	let selectedIconStyle = $state<IconStyle>('linear');

	// Grid system comparison mode
	let gridMode = $state<'standard' | 'immersive'>('immersive');

	// Interactive Theme Switcher
	type ColorTheme = 'ochre' | 'skyblue' | 'canopy' | 'constructivist';
	let activeTheme = $state<ColorTheme>('skyblue');

	// 3D Spatial Query Engine State
	let queryLng = $state<number>(37.3556); // Uhuru Peak longitude
	let queryLat = $state<number>(-3.0674); // Uhuru Peak latitude
	let currentResult = $state<SpatialQueryResult | null>(null);
	let benchmarkReport = $state<BenchmarkReport | null>(null);
	let isBenchmarking = $state<boolean>(false);
	let routesLoaded = $state<boolean>(false);
	let dataset = $state<Dataset | null>(null);

	// Booking Inquiry Modal
	let inquiryModalOpen = $state<boolean>(false);
	let inquiryRoute = $state<string>('Marangu Route (5-6 Days)');
	let inquirySubmitted = $state<boolean>(false);

	// Selected Route for Stage Breakdown
	let selectedRouteId = $state<string>('marangu');

	// SVG Copied Toast
	let copiedSvgToast = $state<string | null>(null);

	const directionsInfo = {
		mild: {
			title: 'Mild: Classic Tanzanian Heritage',
			badge: 'Field Journal',
			desc: 'Grounded savanna khakis, warm parchment paper, subtle ochre accents, and restrained classic typography. Ideal for conservative, luxury safari operators seeking timeless understated elegance.',
			paletteClass: 'border-amber-900/30 bg-[#f4eee2]',
			heroBg: 'bg-[#ebe3d2]',
			accentColor: '#c4571f'
		},
		medium: {
			title: 'Medium: Modern Explorer & Azure Skies',
			badge: 'Recommended Direction',
			desc: 'Balanced savanna earth tones juxtaposed with crisp Sky Blue & Zanzibar Azure. Dynamic high-imagery grids, duotone knockout icons, and energetic calls-to-action that capture both high-altitude Kilimanjaro ice and savanna warmth.',
			paletteClass: 'border-sky-700/30 bg-[#f0f9ff]',
			heroBg: 'bg-gradient-to-br from-[#f4eee2] via-[#e0f2fe] to-[#ebe3d2]',
			accentColor: '#0284c7'
		},
		spicy: {
			title: 'Spicy: Alexander Rodchenko Constructivism',
			badge: 'High Impact & Contrast',
			desc: 'Unapologetic Russian Constructivism adapted to modern adventure engineering. High-contrast ink on warm paper, bold diagonal geometry, isometric technical icons, and utilitarian telemetry typography. Every element functions as an engineering tool.',
			paletteClass: 'border-black bg-[#1f1b16] text-[#f4eee2]',
			heroBg: 'bg-[#1f1b16] text-[#f4eee2]',
			accentColor: '#c4321d'
		}
	};

	// Color System Data
	const colorRoles = [
		{
			role: 'Primary (The Hero)',
			name: 'Savanna Basalt & Canopy Green',
			hex: '#1f1b16',
			hexSupport: '#2f3a21',
			purpose: 'Anchors the visual identity in the volcanic geology of Kilimanjaro and the dense indigenous rainforest canopy.',
			contrastWithPaper: '14.8:1 (AAA Pass)',
			bgClass: 'bg-[#1f1b16]',
			textClass: 'text-white'
		},
		{
			role: 'Secondary (Support)',
			name: 'Sun-warmed Khaki & Warm Paper',
			hex: '#f4eee2',
			hexSupport: '#ebe3d2',
			purpose: 'Provides breathing room, eliminating eye fatigue on high-detail 3D terrain and map readouts.',
			contrastWithPaper: 'Base Canvas',
			bgClass: 'bg-[#f4eee2] border border-[#d3c8b2]',
			textClass: 'text-[#1f1b16]'
		},
		{
			role: 'Atmosphere & Ocean (New)',
			name: 'Sky Blue & Zanzibar Azure',
			hex: '#0284c7',
			hexSupport: '#38bdf8',
			purpose: 'Represents the expansive East African skies, high-altitude glacial ice, and Zanzibar beach extensions.',
			contrastWithPaper: '4.9:1 (AA Large Pass)',
			bgClass: 'bg-[#0284c7]',
			textClass: 'text-white'
		},
		{
			role: 'Accent (Action)',
			name: 'High-Contrast Sunset Ochre',
			hex: '#c4571f',
			hexSupport: '#e07a3c',
			purpose: 'Used sparingly for critical conversion points: "Book Your Hike", "Inquire Now", and summit waypoints.',
			contrastWithPaper: '5.2:1 (AA Pass)',
			bgClass: 'bg-[#c4571f]',
			textClass: 'text-white'
		}
	];

	// Park routes summary for Kilimanjaro National Park explorer
	const officialRoutes = [
		{
			id: 'marangu',
			name: 'Marangu Route',
			nickname: 'The "Coca-Cola" Route',
			duration: '5 - 6 Days',
			distance: '64 km',
			successRate: '82%',
			accommodation: 'Solar-Powered Sleeping Huts',
			difficulty: 'Moderate',
			highlight: 'Only route offering sleeping huts with bunks and dining halls. Gradual, well-marked trail through all zones.',
			badgeColor: 'bg-emerald-100 text-emerald-800'
		},
		{
			id: 'machame',
			name: 'Machame Route',
			nickname: 'The "Whiskey" Route',
			duration: '6 - 7 Days',
			distance: '62 km',
			successRate: '89%',
			accommodation: 'Mountain Camping',
			difficulty: 'Demanding & Scenic',
			highlight: 'Stunning vistas of the Shira Plateau and Barranco Wall. Excellent "climb high, sleep low" acclimatization.',
			badgeColor: 'bg-amber-100 text-amber-800'
		},
		{
			id: 'lemosho',
			name: 'Lemosho Route',
			nickname: 'The Scenic Wilderness',
			duration: '7 - 8 Days',
			distance: '70 km',
			successRate: '94%',
			accommodation: 'Wilderness Camping',
			difficulty: 'Moderate to High',
			highlight: 'Approaches from the pristine western slopes with remote wildlife habitats and gradual altitude adaptation.',
			badgeColor: 'bg-sky-100 text-sky-800'
		},
		{
			id: 'rongai',
			name: 'Rongai Route',
			nickname: 'The Northern Frontier',
			duration: '6 - 7 Days',
			distance: '65 km',
			successRate: '86%',
			accommodation: 'Camping',
			difficulty: 'Moderate',
			highlight: 'Starts near the Kenyan border with drier weather, uncrowded paths, and dramatic views of Mawenzi Peak.',
			badgeColor: 'bg-indigo-100 text-indigo-800'
		},
		{
			id: 'northern-circuit',
			name: 'Northern Circuit',
			nickname: 'The Grand Traverse',
			duration: '9 Days',
			distance: '98 km',
			successRate: '98%',
			accommodation: 'Remote Camping',
			difficulty: 'Endurance Trek',
			highlight: 'The longest and most comprehensive trek, circling the entire northern slopes with almost zero crowds.',
			badgeColor: 'bg-purple-100 text-purple-800'
		},
		{
			id: 'umbwe',
			name: 'Umbwe Route',
			nickname: 'The Direct Ridge',
			duration: '5 - 6 Days',
			distance: '53 km',
			successRate: '75%',
			accommodation: 'Camping',
			difficulty: 'Extreme & Steep',
			highlight: 'Steepest, most direct ascent through dense ridge forest. Recommended only for experienced mountaineers.',
			badgeColor: 'bg-rose-100 text-rose-800'
		}
	];

	// Ecological zones benchmarked with park data
	const ecologicalZones = [
		{
			zone: 'Cultivated Zone',
			altitude: '800m - 1,800m',
			desc: 'Chagga farmland, lush banana & coffee plantations, high rainfall.',
			color: 'bg-lime-800'
		},
		{
			zone: 'Montane Rainforest',
			altitude: '1,800m - 2,800m',
			desc: 'Dense ancient cloud forest, Colobus monkeys, giant ferns, misty trails.',
			color: 'bg-emerald-800'
		},
		{
			zone: 'Heather & Moorland',
			altitude: '2,800m - 4,000m',
			desc: 'Giant lobelias, Dendrosenecio groundsels, sweeping ridges, chilly winds.',
			color: 'bg-amber-800'
		},
		{
			zone: 'Alpine Desert',
			altitude: '4,000m - 5,000m',
			desc: 'Volcanic scree, extreme temperature swings (-10°C to +30°C), scarce water.',
			color: 'bg-stone-700'
		},
		{
			zone: 'Arctic Summit (Uhuru Peak)',
			altitude: '5,000m - 5,895m',
			desc: 'Furtwängler Glacier, Rebmann Glacier, 49% oxygen level, eternal ice.',
			color: 'bg-sky-600'
		}
	];

	onMount(() => {
		document.body.classList.add('scrollable');

		void (async () => {
			try {
				dataset = await loadDataset();
				spatial3D.indexRoutes(dataset.routes);
				routesLoaded = true;
				// Initial query at Uhuru Peak
				runSpatialQuery(queryLng, queryLat);
			} catch (err) {
				console.error('Failed to index routes for spatial query engine:', err);
			}
		})();

		return () => {
			document.body.classList.remove('scrollable');
		};
	});

	function runSpatialQuery(lng: number, lat: number) {
		queryLng = lng;
		queryLat = lat;
		currentResult = spatial3D.query(lng, lat);
	}

	function runAutomatedBenchmark() {
		isBenchmarking = true;
		// Small delay to allow UI spinner to render
		setTimeout(() => {
			benchmarkReport = spatial3D.runBenchmark(1000);
			isBenchmarking = false;
		}, 30);
	}

	function copySvgCode(iconName: string) {
		const svgElement = document.getElementById(`icon-preview-${iconName}`);
		if (svgElement) {
			const code = svgElement.outerHTML;
			navigator.clipboard.writeText(code);
			copiedSvgToast = `Copied SVG for "${iconName}"!`;
			setTimeout(() => {
				copiedSvgToast = null;
			}, 2500);
		}
	}
</script>

<svelte:head>
	<title>Design System & Stylescape · VisitKili Adventures</title>
	<meta
		name="description"
		content="Production Design System, Stylescape Collaboration Board, Color Palette, Scalable Icons, and Sub-3ms 3D Query Engine for Mount Kilimanjaro expeditions."
	/>
</svelte:head>

<div class="min-h-screen bg-paper text-ink transition-colors duration-300">
	<!-- TOP NAVIGATION / BRAND BAR -->
	<header class="sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-md">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
			<div class="flex items-center gap-3">
				<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
					<div class="size-9 rounded-sm bg-ink text-paper flex items-center justify-center font-bold text-lg">
						▲
					</div>
					<div>
						<span class="display font-bold text-base tracking-tight text-ink block leading-none">VisitKili</span>
						<span class="text-[10px] tracking-widest text-ink-soft uppercase block mt-0.5">Stylescape & UI System</span>
					</div>
				</a>
				<span class="hidden sm:inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
					v2.0 Architecture
				</span>
			</div>

			<div class="flex items-center gap-3">
				<a
					href="/"
					class="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper-2 hover:border-ink transition-colors"
				>
					<Mountain class="size-3.5" /> Return to 3D Viewer
				</a>
				<button
					type="button"
					onclick={() => {
						inquiryRoute = 'Custom Expedition & Safari';
						inquiryModalOpen = true;
					}}
					class="inline-flex items-center gap-1.5 rounded-sm bg-ochre px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
				>
					Inquire Trek
				</button>
			</div>
		</div>
	</header>

	<!-- MAIN CONTENT -->
	<main class="{gridMode === 'standard' ? 'grid-standard' : 'grid-immersive'} px-4 py-8 sm:px-6 space-y-16">

		<!-- HERO: DISCOVERY & 3 BRAND PILLARS -->
		<section class="rounded-sm border border-rule p-6 md:p-10 {directionsInfo[selectedDirection].heroBg} transition-all duration-500 shadow-sm relative overflow-hidden">
			<!-- Subtle Constructivist Watermark -->
			<div class="pointer-events-none absolute -bottom-12 -right-8 text-black/[0.04] select-none text-[180px] font-black leading-none font-sans">
				5895
			</div>

			<div class="max-w-3xl space-y-4">
				<div class="flex flex-wrap items-center gap-2">
					<span class="rounded-xs bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wider text-paper uppercase">
						Product Design Sprint
					</span>
					<span class="rounded-xs border border-rule px-2 py-0.5 text-[11px] font-medium text-ink-soft bg-paper/60">
						Stylescape Framework · Chris Do Methodology
					</span>
				</div>

				<h1 class="display text-3xl sm:text-5xl font-black tracking-tight leading-tight">
					Visual Identity & Spatial Engineering for Mount Kilimanjaro
				</h1>

				<p class="text-base sm:text-lg text-ink-soft leading-relaxed">
					Translating Tanzanian culture, extreme high-altitude topography, and ethical sustainable tourism into a modular, production-ready design system.
				</p>

				<!-- 3 Core Brand Attributes -->
				<div class="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="rounded-sm border border-rule/80 bg-paper/80 p-4 backdrop-blur-xs">
						<div class="flex items-center gap-2 font-bold text-sm text-ink mb-1">
							<ShieldCheck class="size-4 text-ochre" /> 1. Authentic
						</div>
						<p class="text-xs text-ink-soft leading-snug">
							Deep Tanzanian heritage, local Chagga knowledge, and ethical guide storytelling.
						</p>
					</div>

					<div class="rounded-sm border border-rule/80 bg-paper/80 p-4 backdrop-blur-xs">
						<div class="flex items-center gap-2 font-bold text-sm text-ink mb-1">
							<Mountain class="size-4 text-sky-600" /> 2. Adventurous
						</div>
						<p class="text-xs text-ink-soft leading-snug">
							5,895m Uhuru summit scale, arctic glacial moraines, and wild savanna safaris.
						</p>
					</div>

					<div class="rounded-sm border border-rule/80 bg-paper/80 p-4 backdrop-blur-xs">
						<div class="flex items-center gap-2 font-bold text-sm text-ink mb-1">
							<Trees class="size-4 text-secondary-600" /> 3. Sustainable
						</div>
						<p class="text-xs text-ink-soft leading-snug">
							TANAPA environmental stewardship, fair porter wages, and leave-no-trace expeditions.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 1: THE STYLESCAPE COLLABORATION BOARD (56" Virtual Strip) -->
		<section class="space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-rule pb-4">
				<div>
					<div class="flex items-center gap-2">
						<Layers class="size-4 text-ochre" />
						<span class="label uppercase font-bold tracking-wider">Visual Deliverable</span>
					</div>
					<h2 class="display text-2xl sm:text-3xl font-bold">The Stylescape Board</h2>
					<p class="text-xs sm:text-sm text-ink-soft mt-1">
						Client-aligned visual narrative before building final layouts. Test the 3 aesthetic directions:
					</p>
				</div>

				<!-- Mild / Medium / Spicy Selector -->
				<div class="inline-flex rounded-sm border border-rule bg-paper-2 p-1 text-xs">
					{#each (['mild', 'medium', 'spicy'] as StylescapeDirection[]) as dir}
						<button
							type="button"
							onclick={() => (selectedDirection = dir)}
							class="px-3.5 py-1.5 font-medium rounded-xs transition-all {selectedDirection === dir ? 'bg-ink text-paper shadow-xs font-bold' : 'text-ink-soft hover:text-ink'}"
						>
							{dir.toUpperCase()}
						</button>
					{/each}
				</div>
			</div>

			<!-- Active Direction Card -->
			<div class="rounded-sm border {directionsInfo[selectedDirection].paletteClass} p-5 transition-all duration-300">
				<div class="flex items-center justify-between gap-4">
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<span class="font-bold text-sm">{directionsInfo[selectedDirection].title}</span>
							<span class="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-ochre/15 text-ochre">
								{directionsInfo[selectedDirection].badge}
							</span>
						</div>
						<p class="text-xs text-ink-soft max-w-2xl">{directionsInfo[selectedDirection].desc}</p>
					</div>
					<div class="size-8 rounded-full border border-rule flex items-center justify-center shrink-0" style="background-color: {directionsInfo[selectedDirection].accentColor}">
						<Check class="size-4 text-white" />
					</div>
				</div>
			</div>

			<!-- Panoramic 56-inch Simulation Canvas -->
			<div class="relative overflow-x-auto rounded-sm border border-rule bg-paper-2 p-4 shadow-inner">
				<div class="min-w-[960px] grid grid-cols-5 gap-4 items-stretch h-72">
					<!-- Strip Item 1: Typography & Voice -->
					<div class="rounded-sm border border-rule bg-paper p-4 flex flex-col justify-between shadow-xs">
						<div>
							<span class="label uppercase font-semibold text-[10px]">Typography System</span>
							<h3 class="display font-black text-2xl mt-2 tracking-tight">KIBO & MAWENZI</h3>
							<p class="text-[11px] text-ink-soft font-mono mt-1">Verdana, Bold Slab & Sans</p>
						</div>
						<div class="border-t border-rule pt-3 space-y-1">
							<p class="text-[10px] text-ink-soft uppercase tracking-wider">Voice Tone:</p>
							<p class="text-xs font-medium italic">"Daring yet grounded; rigorous engineering with African warmth."</p>
						</div>
					</div>

					<!-- Strip Item 2: Visual Marks -->
					<div class="rounded-sm border border-rule bg-paper p-4 flex flex-col justify-between items-center text-center shadow-xs">
						<span class="label uppercase font-semibold text-[10px] self-start">Identity Marks</span>
						<div class="my-auto flex flex-col items-center gap-2">
							<KiliIcons name="peak" style={selectedDirection === 'spicy' ? 'isometric' : selectedDirection === 'medium' ? 'duotone' : 'linear'} size={48} />
							<span class="text-xs font-bold tracking-widest uppercase">UHURU 5895M</span>
							<span class="text-[9px] text-ink-soft">Kilimanjaro National Park, TANAPA</span>
						</div>
						<span class="text-[10px] text-ink-soft">Geometric Stamp No. 01</span>
					</div>

					<!-- Strip Item 3: Color Spectrum Band -->
					<div class="rounded-sm border border-rule bg-paper p-4 flex flex-col justify-between shadow-xs">
						<span class="label uppercase font-semibold text-[10px]">Color Harmonization</span>
						<div class="grid grid-cols-2 gap-2 my-2">
							<div class="h-10 rounded-xs bg-[#c4571f] text-white flex items-center justify-center text-[10px] font-bold">Ochre</div>
							<div class="h-10 rounded-xs bg-[#0284c7] text-white flex items-center justify-center text-[10px] font-bold">Sky Blue</div>
							<div class="h-10 rounded-xs bg-[#2f3a21] text-white flex items-center justify-center text-[10px] font-bold">Canopy</div>
							<div class="h-10 rounded-xs bg-[#f4eee2] text-[#1f1b16] border border-rule flex items-center justify-center text-[10px] font-bold">Warm Paper</div>
						</div>
						<span class="text-[10px] text-ink-soft">Savanna & Glacial Tension</span>
					</div>

					<!-- Strip Item 4: Curated Imagery Narrative -->
					<div class="rounded-sm border border-rule bg-gradient-to-br from-amber-900/10 via-sky-900/10 to-stone-900/20 p-4 flex flex-col justify-between shadow-xs relative overflow-hidden">
						<span class="label uppercase font-semibold text-[10px]">Atmospheric Narrative</span>
						<div class="space-y-1 my-auto">
							<div class="text-xs font-bold">Glacier Sunrise at 5:45 AM</div>
							<p class="text-[11px] text-ink-soft leading-snug">Moving away from stock photos toward documentary expedition realism: boots in scree, steam over tin cups, crisp rim sunlight.</p>
						</div>
						<span class="text-[10px] text-ink-soft">Curated Visual Narrative</span>
					</div>

					<!-- Strip Item 5: Tactile Component Texture -->
					<div class="rounded-sm border border-rule bg-paper p-4 flex flex-col justify-between shadow-xs">
						<span class="label uppercase font-semibold text-[10px]">UI Engineering Tool</span>
						<div class="border border-rule rounded-xs p-2.5 bg-paper-2 space-y-1 text-center my-auto">
							<div class="text-[10px] text-ink-soft uppercase font-semibold">Live Barometric Readout</div>
							<div class="text-xl font-bold font-mono text-ochre">49.2% O₂</div>
							<div class="text-[9px] text-ink-soft">Baranco Wall • 3,950m</div>
						</div>
						<span class="text-[10px] text-ink-soft">Rodchenko Modular Block</span>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 2: INTENTIONAL COLOR STRATEGY SYSTEM -->
		<section class="space-y-6">
			<div class="border-b border-rule pb-4">
				<div class="flex items-center gap-2">
					<Sun class="size-4 text-ochre" />
					<span class="label uppercase font-bold tracking-wider">Functional Palette</span>
				</div>
				<h2 class="display text-2xl sm:text-3xl font-bold">Intentional Color Architecture</h2>
				<p class="text-xs sm:text-sm text-ink-soft mt-1">
					Color is never chosen at random. Every tone has a dedicated role: Hero (Identity Anchor), Support (Depth & Balance), Action (Conversion CTAs), and Neutral (Readability & Structure).
				</p>
			</div>

			<!-- Color Roles Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each colorRoles as c}
					<div class="rounded-sm border border-rule bg-paper p-5 flex flex-col justify-between space-y-4 shadow-xs">
						<div class="space-y-2">
							<span class="label uppercase text-[10px] font-bold text-ochre tracking-wider">{c.role}</span>
							<h3 class="font-bold text-base">{c.name}</h3>
							<div class="flex items-center gap-2">
								<div class="size-6 rounded-xs {c.bgClass}"></div>
								<span class="font-mono text-xs font-semibold">{c.hex}</span>
							</div>
							<p class="text-xs text-ink-soft leading-relaxed">{c.purpose}</p>
						</div>

						<div class="border-t border-rule pt-3 flex items-center justify-between text-[11px]">
							<span class="text-ink-soft font-medium">WCAG Contrast:</span>
							<span class="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
								{c.contrastWithPaper}
							</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Dynamic Theme Sandbox -->
			<div class="rounded-sm border border-rule bg-paper-2 p-6 space-y-4">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h3 class="font-bold text-sm">Interactive Theme Switcher Sandbox</h3>
						<p class="text-xs text-ink-soft">Test how application components adapt when switching between regional color schemes:</p>
					</div>

					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => (activeTheme = 'ochre')}
							class="px-3 py-1 text-xs rounded-xs font-semibold border {activeTheme === 'ochre' ? 'bg-[#c4571f] text-white border-transparent' : 'bg-paper text-ink border-rule hover:border-ink'}"
						>
							Savanna Ochre
						</button>
						<button
							type="button"
							onclick={() => (activeTheme = 'skyblue')}
							class="px-3 py-1 text-xs rounded-xs font-semibold border {activeTheme === 'skyblue' ? 'bg-[#0284c7] text-white border-transparent' : 'bg-paper text-ink border-rule hover:border-ink'}"
						>
							Sky Blue & Azure
						</button>
						<button
							type="button"
							onclick={() => (activeTheme = 'canopy')}
							class="px-3 py-1 text-xs rounded-xs font-semibold border {activeTheme === 'canopy' ? 'bg-[#2f3a21] text-white border-transparent' : 'bg-paper text-ink border-rule hover:border-ink'}"
						>
							Canopy Moss
						</button>
						<button
							type="button"
							onclick={() => (activeTheme = 'constructivist')}
							class="px-3 py-1 text-xs rounded-xs font-semibold border {activeTheme === 'constructivist' ? 'bg-[#11100e] text-white border-transparent' : 'bg-paper text-ink border-rule hover:border-ink'}"
						>
							Constructivist Stark
						</button>
					</div>
				</div>

				<!-- Live Preview Area -->
				<div class="rounded-sm border border-rule bg-paper p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
					<div class="space-y-1">
						<span class="text-[10px] text-ink-soft uppercase font-mono">Component 1: Call to Action</span>
						<div>
							<button
								type="button"
								class="px-4 py-2 text-xs font-bold rounded-xs text-white transition-all shadow-xs {activeTheme === 'ochre' ? 'bg-[#c4571f] hover:bg-[#a94518]' : activeTheme === 'skyblue' ? 'bg-[#0284c7] hover:bg-[#0369a1]' : activeTheme === 'canopy' ? 'bg-[#485a2e] hover:bg-[#2f3a21]' : 'bg-[#11100e] hover:bg-black'}"
							>
								Book Your Kilimanjaro Hike →
							</button>
						</div>
					</div>

					<div class="space-y-1">
						<span class="text-[10px] text-ink-soft uppercase font-mono">Component 2: Elevation Badge</span>
						<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs border {activeTheme === 'ochre' ? 'border-[#c4571f]/30 bg-[#fdf3ec] text-[#a94518]' : activeTheme === 'skyblue' ? 'border-[#0284c7]/30 bg-[#f0f9ff] text-[#0369a1]' : activeTheme === 'canopy' ? 'border-[#485a2e]/30 bg-[#f5f7ef] text-[#2f3a21]' : 'border-black bg-neutral-100 text-black'} font-mono text-xs font-semibold">
							<span>▲ 5,895m</span>
							<span>•</span>
							<span>Uhuru Peak</span>
						</div>
					</div>

					<div class="space-y-1">
						<span class="text-[10px] text-ink-soft uppercase font-mono">Component 3: Status Indicator</span>
						<div class="flex items-center gap-2 text-xs font-medium">
							<span class="size-2.5 rounded-full {activeTheme === 'ochre' ? 'bg-[#c4571f]' : activeTheme === 'skyblue' ? 'bg-[#0284c7]' : activeTheme === 'canopy' ? 'bg-[#485a2e]' : 'bg-black'} animate-pulse"></span>
							<span>Optimal Climbing Window Open</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 3: MULTI-STYLE ICON SYSTEM & MICRO-INTERACTIONS -->
		<section class="space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-rule pb-4">
				<div>
					<div class="flex items-center gap-2">
						<Sparkles class="size-4 text-ochre" />
						<span class="label uppercase font-bold tracking-wider">Vector Assets</span>
					</div>
					<h2 class="display text-2xl sm:text-3xl font-bold">Multi-Style Iconography Suite</h2>
					<p class="text-xs sm:text-sm text-ink-soft mt-1">
						Handcrafted scalable SVGs with unified stroke weights and hover micro-animations. Click any icon to copy its SVG code.
					</p>
				</div>

				<!-- Icon Style Filter -->
				<div class="inline-flex rounded-sm border border-rule bg-paper-2 p-1 text-xs">
					<button
						type="button"
						onclick={() => (selectedIconStyle = 'linear')}
						class="px-3 py-1 font-medium rounded-xs transition-all {selectedIconStyle === 'linear' ? 'bg-ink text-paper font-bold' : 'text-ink-soft hover:text-ink'}"
					>
						Linear Style (Crisp 2.5px)
					</button>
					<button
						type="button"
						onclick={() => (selectedIconStyle = 'duotone')}
						class="px-3 py-1 font-medium rounded-xs transition-all {selectedIconStyle === 'duotone' ? 'bg-ink text-paper font-bold' : 'text-ink-soft hover:text-ink'}"
					>
						Duotone & Gradients
					</button>
					<button
						type="button"
						onclick={() => (selectedIconStyle = 'isometric')}
						class="px-3 py-1 font-medium rounded-xs transition-all {selectedIconStyle === 'isometric' ? 'bg-ink text-paper font-bold' : 'text-ink-soft hover:text-ink'}"
					>
						Isometric 3D Axonometric
					</button>
				</div>
			</div>

			{#if copiedSvgToast}
				<div class="rounded-sm bg-emerald-800 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
					<span>{copiedSvgToast}</span>
					<CheckCircle2 class="size-4" />
				</div>
			{/if}

			<!-- Icons Grid -->
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
				{#each [
					{ name: 'peak' as const, title: 'Kilimanjaro Summit', caption: 'Uhuru & Mawenzi Crags' },
					{ name: 'safari' as const, title: 'Savanna Expedition', caption: '4x4 Game Cruiser' },
					{ name: 'zanzibar' as const, title: 'Zanzibar Coast', caption: 'Dhow & Indian Ocean' },
					{ name: 'compass' as const, title: 'True Heading', caption: '360° Navigation' },
					{ name: 'tent' as const, title: 'High-Altitude Camp', caption: 'Barranco & Kibo Huts' },
					{ name: 'boots' as const, title: 'Trekking Rig', caption: 'Gore-Tex Scree Footwear' },
					{ name: 'backpack' as const, title: 'Porter Cargo', caption: '20kg Ethical Limit' },
					{ name: 'gauge' as const, title: 'Oxygen Altimeter', caption: 'Barometric Sensor' },
					{ name: 'shield' as const, title: 'TANAPA Verified', caption: 'Licensed Tour Operator' },
					{ name: 'flag' as const, title: 'Summit Reached', caption: 'Uhuru Signboard 5895m' }
				] as item}
					<button
						type="button"
						onclick={() => copySvgCode(item.name)}
						class="group rounded-sm border border-rule bg-paper p-4 text-center hover:border-ochre hover:shadow-md transition-all flex flex-col items-center justify-between min-h-[170px]"
						title="Click to copy SVG"
					>
						<span class="text-[10px] text-ink-soft uppercase font-mono">{selectedIconStyle}</span>

						<div class="my-auto py-2">
							<div id="icon-preview-{item.name}">
								<KiliIcons name={item.name} style={selectedIconStyle} size={48} class="text-ink" />
							</div>
						</div>

						<div class="w-full border-t border-rule/60 pt-2 space-y-0.5">
							<div class="font-bold text-xs group-hover:text-ochre transition-colors">{item.title}</div>
							<div class="text-[10px] text-ink-soft">{item.caption}</div>
						</div>
					</button>
				{/each}
			</div>
		</section>

		<!-- SECTION 4: KILIMANJARO NATIONAL PARK EXPLORER (Benchmarked with kilimanjaroparktanzania.com) -->
		<section class="space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-rule pb-4">
				<div>
					<div class="flex items-center gap-2">
						<Mountain class="size-4 text-ochre" />
						<span class="label uppercase font-bold tracking-wider">Park Authority Benchmarking</span>
					</div>
					<h2 class="display text-2xl sm:text-3xl font-bold">Kilimanjaro National Park Official Routes</h2>
					<p class="text-xs sm:text-sm text-ink-soft mt-1">
						Features inspired by <a href="https://www.kilimanjaroparktanzania.com/" target="_blank" class="text-sky-700 underline font-semibold hover:text-sky-900">kilimanjaroparktanzania.com</a>: route duration, success rates, hut vs camping specs, and TANAPA regulations.
					</p>
				</div>

				<div class="flex items-center gap-2 text-xs">
					<span class="text-ink-soft">Layout Width:</span>
					<button
						type="button"
						onclick={() => (gridMode = gridMode === 'standard' ? 'immersive' : 'standard')}
						class="px-2.5 py-1 rounded-xs border border-rule bg-paper-2 font-mono font-semibold hover:border-ink transition-colors"
					>
						{gridMode === 'standard' ? '1140px Bootstrap Grid' : '1440px Immersive Grid'}
					</button>
				</div>
			</div>

			<!-- Routes Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each officialRoutes as r}
					<div
						role="button"
						tabindex="0"
						class="rounded-sm border {selectedRouteId === r.id ? 'border-sky-600 ring-2 ring-sky-600/20 bg-sky-50/20' : 'border-rule bg-paper'} p-5 flex flex-col justify-between hover:border-ink transition-all shadow-xs space-y-4 cursor-pointer text-left"
						onclick={() => (selectedRouteId = r.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								selectedRouteId = r.id;
							}
						}}
					>
						<div class="space-y-2">
							<div class="flex items-start justify-between gap-2">
								<div>
									<span class="text-[10px] text-ink-soft uppercase font-bold">{r.nickname}</span>
									<h3 class="display font-bold text-lg text-ink">{r.name}</h3>
								</div>
								<span class="text-[11px] font-bold px-2 py-0.5 rounded-full {r.badgeColor}">
									{r.successRate} Success
								</span>
							</div>

							<div class="grid grid-cols-2 gap-2 text-xs font-mono py-1 border-y border-rule/60">
								<div>
									<span class="text-ink-soft block text-[10px]">DURATION</span>
									<span class="font-bold">{r.duration}</span>
								</div>
								<div>
									<span class="text-ink-soft block text-[10px]">DISTANCE</span>
									<span class="font-bold">{r.distance}</span>
								</div>
							</div>

							<p class="text-xs text-ink-soft leading-relaxed">{r.highlight}</p>
						</div>

						<div class="pt-3 border-t border-rule flex items-center justify-between">
							<span class="text-[11px] text-ink-soft font-medium">{r.accommodation}</span>
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										inquiryRoute = `${r.name} (${r.duration})`;
										inquiryModalOpen = true;
									}}
									class="inline-flex items-center gap-1 text-xs font-bold text-ochre hover:text-primary-700"
								>
									Inquire <ChevronRight class="size-3.5" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Dynamic Route Stages Breakdown for Selected Route -->
			{#if dataset && dataset.routes[selectedRouteId]}
				{@const activeRoute = dataset.routes[selectedRouteId]}
				<div class="rounded-sm border border-rule bg-paper p-5 sm:p-6 space-y-4 shadow-xs">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
						<div>
							<div class="flex items-center gap-2">
								<span class="text-[10px] uppercase font-bold text-sky-700 font-mono tracking-wider">Itinerary Stage Breakdown</span>
								<span class="text-[10px] bg-paper-2 border border-rule px-2 py-0.5 rounded-xs font-mono">{activeRoute.days.length} Days</span>
							</div>
							<h3 class="display text-xl font-bold mt-0.5">{activeRoute.name} Elevation Itinerary</h3>
						</div>

						<a
							href="/?route={selectedRouteId}"
							class="inline-flex items-center gap-2 rounded-xs bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition-colors"
						>
							<Mountain class="size-4" /> Launch 3D Terrain Flight →
						</a>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each activeRoute.days as d}
							<div class="rounded-xs border border-rule bg-paper-2 p-3 space-y-2">
								<div class="flex items-center justify-between">
									<span class="font-bold text-xs font-mono text-ink">Day {d.day}</span>
									<span class="text-[10px] font-mono text-ink-soft">{d.distanceKm.toFixed(1)} km</span>
								</div>
								<div class="font-semibold text-xs leading-snug">{d.title}</div>
								<div class="grid grid-cols-2 gap-1 text-[10px] font-mono border-t border-rule/60 pt-1.5 text-ink-soft">
									<div>▲ +{d.ascentM}m</div>
									<div>▼ -{d.descentM}m</div>
									<div class="col-span-2">End: {d.endElevation.toLocaleString()}m</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 5 Altitude Ecological Zones Strip -->
			<div class="rounded-sm border border-rule bg-paper p-5 space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="font-bold text-sm">Climatic & Ecological Altitudinal Zones</h3>
					<span class="text-xs text-ink-soft font-mono">800m to 5,895m</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
					{#each ecologicalZones as z}
						<div class="rounded-xs border border-rule p-3 bg-paper-2 space-y-1">
							<div class="size-2 rounded-full {z.color}"></div>
							<div class="font-bold text-xs">{z.zone}</div>
							<div class="text-[10px] font-mono text-ink-soft">{z.altitude}</div>
							<p class="text-[11px] text-ink-soft leading-tight">{z.desc}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Alpine Gear Checklist & Acclimatization Safety Matrix -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
				<!-- Card 1: Official Expedition Gear Checklist -->
				<div class="rounded-sm border border-rule bg-paper p-5 space-y-3">
					<div class="flex items-center gap-2 border-b border-rule pb-2">
						<KiliIcons name="backpack" style="linear" size={24} class="text-ochre" />
						<div>
							<h4 class="font-bold text-sm">Essential Expedition Gear Guide</h4>
							<span class="text-[10px] text-ink-soft">Categorized for Arctic Summit Conditions (-15°C)</span>
						</div>
					</div>

					<div class="space-y-2.5 text-xs">
						<div class="rounded-xs border border-rule/60 bg-paper-2 p-2.5 space-y-1">
							<div class="font-semibold text-ink flex items-center gap-1.5">
								<span class="size-1.5 rounded-full bg-ochre"></span> Layer 1 & 2: Base & Mid Thermal
							</div>
							<p class="text-[11px] text-ink-soft">Merino wool thermal tops and bottoms (non-cotton), mid-weight polartec fleece jacket, breathable moisture-wicking shirts.</p>
						</div>

						<div class="rounded-xs border border-rule/60 bg-paper-2 p-2.5 space-y-1">
							<div class="font-semibold text-ink flex items-center gap-1.5">
								<span class="size-1.5 rounded-full bg-sky-600"></span> Layer 3 & 4: Insulation & Outer Shell
							</div>
							<p class="text-[11px] text-ink-soft">800-fill goose down expedition parka with hood, Gore-Tex waterproof breathable rain jacket and pants with taped seams.</p>
						</div>

						<div class="rounded-xs border border-rule/60 bg-paper-2 p-2.5 space-y-1">
							<div class="font-semibold text-ink flex items-center gap-1.5">
								<span class="size-1.5 rounded-full bg-secondary-700"></span> Technical Footwear & Hands
							</div>
							<p class="text-[11px] text-ink-soft">High-ankle waterproof broken-in boots, breathable scree gaiters, 4x merino hiking socks, windproof mittens and inner liner gloves.</p>
						</div>

						<div class="rounded-xs border border-rule/60 bg-paper-2 p-2.5 space-y-1">
							<div class="font-semibold text-ink flex items-center gap-1.5">
								<span class="size-1.5 rounded-full bg-ink"></span> Summit Night Criticals
							</div>
							<p class="text-[11px] text-ink-soft">200+ lumen headlamp with spare cold-resistant lithium batteries, UV400 glacier sunglasses, insulated thermos flask for water.</p>
						</div>
					</div>
				</div>

				<!-- Card 2: High-Altitude Acclimatization & AMS Protocol -->
				<div class="rounded-sm border border-rule bg-paper p-5 space-y-3">
					<div class="flex items-center gap-2 border-b border-rule pb-2">
						<KiliIcons name="gauge" style="linear" size={24} class="text-sky-600" />
						<div>
							<h4 class="font-bold text-sm">Altitude Acclimatization (AMS) Protocol</h4>
							<span class="text-[10px] text-ink-soft">TANAPA Guidelines & Lake Louise Score</span>
						</div>
					</div>

					<div class="space-y-2.5 text-xs">
						<div class="rounded-xs border border-rule/60 bg-paper-2 p-2.5 space-y-1">
							<div class="font-semibold text-ink flex items-center justify-between">
								<span>"Pole, Pole" (Slowly, Slowly)</span>
								<span class="font-mono text-[10px] text-sky-700 font-bold">&lt; 3.0 km/h</span>
							</div>
							<p class="text-[11px] text-ink-soft">Keeping a steady, conversational pace minimizes anaerobic respiration and prevents lactic acid build-up above 3,500m.</p>
						</div>

						<div class="rounded-xs border border-rule/60 bg-paper-2 p-2.5 space-y-1">
							<div class="font-semibold text-ink flex items-center justify-between">
								<span>Daily Hydration Requirement</span>
								<span class="font-mono text-[10px] text-emerald-700 font-bold">4 - 5 Litres / Day</span>
							</div>
							<p class="text-[11px] text-ink-soft">Hyperventilation in dry alpine air causes accelerated fluid loss. Adequate hydration accelerates altitude adaptation.</p>
						</div>

						<div class="rounded-xs border border-rule/60 bg-paper-2 p-2.5 space-y-1">
							<div class="font-semibold text-ink flex items-center justify-between">
								<span>"Climb High, Sleep Low"</span>
								<span class="font-mono text-[10px] text-ochre font-bold">Lava Tower (4,630m)</span>
							</div>
							<p class="text-[11px] text-ink-soft">Ascending to Lava Tower for lunch then descending to Barranco Camp (3,950m) stimulates EPO production and yields 90%+ success.</p>
						</div>

						<div class="rounded-xs border border-rose-200 bg-rose-50/50 p-2.5 space-y-1">
							<div class="font-semibold text-rose-900 flex items-center justify-between">
								<span>Mandatory Emergency Descent</span>
								<span class="font-mono text-[10px] text-rose-700 font-bold">Immediate &gt; 500m</span>
							</div>
							<p class="text-[11px] text-rose-800">Severe persistent headache, ataxia, or confusion indicates severe AMS or HAPE. Guides carry pulse oximeters and oxygen.</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- SECTION 5: ULTRA-FAST 3D SPATIAL QUERY ENGINE (< 3MS BENCHMARK) -->
		<section class="space-y-6">
			<div class="border-b border-rule pb-4">
				<div class="flex items-center gap-2">
					<Zap class="size-4 text-ochre" />
					<span class="label uppercase font-bold tracking-wider">Spatial Performance</span>
				</div>
				<h2 class="display text-2xl sm:text-3xl font-bold">Sub-3ms 3D Query Engine & Telemetry</h2>
				<p class="text-xs sm:text-sm text-ink-soft mt-1">
					Hardware-accelerated spatial grid binning and fast binary projection. Query any point on Mount Kilimanjaro for elevation, nearest route, oxygen ratio, and ecological zone in strictly under 3 milliseconds.
				</p>
			</div>

			<!-- Real-Time Query Playground & Live Benchmark -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Live Query Panel -->
				<div class="rounded-sm border border-rule bg-paper p-5 space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="font-bold text-sm">Live Coordinate Query Tool</h3>
						<span class="text-xs font-mono {routesLoaded ? 'text-emerald-700 font-semibold' : 'text-amber-700'}">
							{routesLoaded ? '● Spatial Index Ready' : '○ Loading Routes...'}
						</span>
					</div>

					<div class="grid grid-cols-2 gap-3 text-xs">
						<div>
							<label for="lng-input" class="block font-medium text-ink-soft mb-1">Longitude (°E)</label>
							<input
								id="lng-input"
								type="number"
								step="0.005"
								bind:value={queryLng}
								oninput={() => runSpatialQuery(queryLng, queryLat)}
								class="w-full rounded-xs border border-rule bg-paper-2 px-3 py-1.5 font-mono text-xs focus:border-ochre focus:outline-hidden"
							/>
						</div>
						<div>
							<label for="lat-input" class="block font-medium text-ink-soft mb-1">Latitude (°S)</label>
							<input
								id="lat-input"
								type="number"
								step="0.005"
								bind:value={queryLat}
								oninput={() => runSpatialQuery(queryLng, queryLat)}
								class="w-full rounded-xs border border-rule bg-paper-2 px-3 py-1.5 font-mono text-xs focus:border-ochre focus:outline-hidden"
							/>
						</div>
					</div>

					<!-- Quick Coordinate Preset Buttons -->
					<div class="flex flex-wrap gap-2 pt-1 text-xs">
						<span class="text-ink-soft self-center text-[11px]">Presets:</span>
						<button
							type="button"
							onclick={() => runSpatialQuery(37.3556, -3.0674)}
							class="rounded-xs border border-rule px-2 py-0.5 hover:bg-paper-2"
						>
							Uhuru Peak (5,895m)
						</button>
						<button
							type="button"
							onclick={() => runSpatialQuery(37.5165, -3.1751)}
							class="rounded-xs border border-rule px-2 py-0.5 hover:bg-paper-2"
						>
							Marangu Gate (1,860m)
						</button>
						<button
							type="button"
							onclick={() => runSpatialQuery(37.3115, -3.125)}
							class="rounded-xs border border-rule px-2 py-0.5 hover:bg-paper-2"
						>
							Barranco Camp (3,950m)
						</button>
					</div>

					<!-- Real-Time Query Readout -->
					{#if currentResult}
						<div class="rounded-xs border border-rule bg-paper-2 p-4 space-y-3 font-mono text-xs">
							<div class="flex items-center justify-between border-b border-rule/60 pb-2">
								<span class="text-ink-soft">QUERY EXECUTION TIME:</span>
								<span class="font-bold text-sm px-2 py-0.5 rounded-xs {currentResult.queryTimeMs < 3.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
									{currentResult.queryTimeMs.toFixed(3)} ms
								</span>
							</div>

							<div class="grid grid-cols-2 gap-2">
								<div>
									<span class="text-ink-soft text-[10px] block">INTERPOLATED ELEVATION</span>
									<span class="font-bold text-base text-ochre">{currentResult.elevation.toLocaleString()} m</span>
								</div>
								<div>
									<span class="text-ink-soft text-[10px] block">EFFECTIVE OXYGEN (O₂)</span>
									<span class="font-bold text-base text-sky-700">{currentResult.oxygenPercent}%</span>
								</div>
								<div>
									<span class="text-ink-soft text-[10px] block">NEAREST ROUTE</span>
									<span class="font-semibold text-ink">{currentResult.nearestRouteName ?? 'Off-trail Plateau'}</span>
								</div>
								<div>
									<span class="text-ink-soft text-[10px] block">ECOLOGICAL ZONE</span>
									<span class="font-semibold text-ink">{currentResult.ecologicalZone}</span>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Automated 1,000-Query Latency Benchmark -->
				<div class="rounded-sm border border-rule bg-paper p-5 flex flex-col justify-between space-y-4">
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<h3 class="font-bold text-sm">Automated 1,000-Query Microbenchmark</h3>
							<span class="text-[10px] font-mono text-ink-soft">Target: &lt; 3.0 ms (P99)</span>
						</div>
						<p class="text-xs text-ink-soft leading-relaxed">
							Executes 1,000 random coordinate queries spanning the 650 km² national park area and calculates percentile distribution.
						</p>
					</div>

					{#if benchmarkReport}
						<div class="rounded-xs border border-rule bg-paper-2 p-4 space-y-3 font-mono text-xs">
							<div class="flex items-center justify-between border-b border-rule/60 pb-2">
								<span class="text-ink-soft">BENCHMARK RESULT:</span>
								<span class="font-bold px-2 py-0.5 rounded-xs {benchmarkReport.meetsTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
									{benchmarkReport.meetsTarget ? 'PASSED (< 3ms TARGET)' : 'EXCEEDED TARGET'}
								</span>
							</div>

							<div class="grid grid-cols-3 gap-2 text-center py-1">
								<div class="p-2 border border-rule/60 rounded-xs bg-paper">
									<div class="text-[10px] text-ink-soft">P50 (MEDIAN)</div>
									<div class="text-base font-bold text-emerald-700">{benchmarkReport.p50Ms} ms</div>
								</div>
								<div class="p-2 border border-rule/60 rounded-xs bg-paper">
									<div class="text-[10px] text-ink-soft">P95 LATENCY</div>
									<div class="text-base font-bold text-emerald-700">{benchmarkReport.p95Ms} ms</div>
								</div>
								<div class="p-2 border border-rule/60 rounded-xs bg-paper">
									<div class="text-[10px] text-ink-soft">P99 LATENCY</div>
									<div class="text-base font-bold text-emerald-700">{benchmarkReport.p99Ms} ms</div>
								</div>
							</div>

							<div class="text-[10px] text-ink-soft flex justify-between pt-1">
								<span>1,000 queries completed in {benchmarkReport.totalMs} ms total.</span>
								<span>Avg: {benchmarkReport.avgMs} ms / query</span>
							</div>
						</div>
					{:else}
						<div class="border border-dashed border-rule rounded-xs p-6 text-center text-xs text-ink-soft">
							Click below to run 1,000 spatial queries and verify sub-3ms performance.
						</div>
					{/if}

					<button
						type="button"
						onclick={runAutomatedBenchmark}
						disabled={isBenchmarking || !routesLoaded}
						class="w-full rounded-xs bg-ink text-paper py-2.5 font-bold text-xs hover:bg-black transition-colors disabled:opacity-50"
					>
						{isBenchmarking ? 'Running 1,000 Queries...' : 'Run Automated 1,000-Query Latency Benchmark'}
					</button>
				</div>
			</div>
		</section>

		<!-- SECTION 6: ETHICAL TANZANIA TOUR OPERATOR STANDARDS -->
		<section class="rounded-sm border border-rule bg-paper p-6 sm:p-8 space-y-4">
			<div class="flex items-center gap-2">
				<ShieldCheck class="size-5 text-ochre" />
				<h3 class="display font-bold text-xl">TANAPA Compliance & Porter Welfare Commitment</h3>
			</div>

			<p class="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-4xl">
				In accordance with Tanzania National Parks Authority (TANAPA) and the Kilimanjaro Porters Assistance Project (KPAP), our spatial planning tools enforce ethical expedition standards:
			</p>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
				<div class="border-l-2 border-ochre pl-3 space-y-1">
					<div class="font-bold text-xs">20kg Porter Weight Limit</div>
					<p class="text-[11px] text-ink-soft">Strict baggage weighing at Marangu, Machame, and Londorossi park gates before trail entry.</p>
				</div>

				<div class="border-l-2 border-sky-600 pl-3 space-y-1">
					<div class="font-bold text-xs">Fair Living Wages & 3 Meals/Day</div>
					<p class="text-[11px] text-ink-soft">Direct bank wage disbursements, professional high-altitude sleeping bags, and medical checks.</p>
				</div>

				<div class="border-l-2 border-secondary-600 pl-3 space-y-1">
					<div class="font-bold text-xs">100% Leave No Trace (LNT)</div>
					<p class="text-[11px] text-ink-soft">All solid waste and food packaging transported back down to park disposal facilities.</p>
				</div>
			</div>
		</section>

	</main>

	<!-- BOOKING INQUIRY MODAL (Benchmark inspired by kilimanjaroparktanzania.com) -->
	{#if inquiryModalOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
			<div class="w-full max-w-lg rounded-sm border border-rule bg-paper p-6 space-y-5 shadow-2xl relative">
				<button
					type="button"
					onclick={() => (inquiryModalOpen = false)}
					class="absolute top-4 right-4 text-ink-soft hover:text-ink font-bold text-lg"
				>
					✕
				</button>

				<div>
					<span class="label uppercase font-bold text-ochre text-[10px]">Tanzania Expedition Inquiry</span>
					<h3 class="display font-bold text-2xl mt-1">Plan Your Kilimanjaro Hike</h3>
					<p class="text-xs text-ink-soft mt-1">Selected Route: <strong class="text-ink">{inquiryRoute}</strong></p>
				</div>

				{#if inquirySubmitted}
					<div class="rounded-xs bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
						<CheckCircle2 class="size-8 text-emerald-700 mx-auto" />
						<div class="font-bold text-sm text-emerald-900">Inquiry Received!</div>
						<p class="text-xs text-emerald-800">
							Asante sana! Our certified Tanzanian mountain guide coordinator will review your dates and send a custom itinerary with park fees and gear checklists.
						</p>
						<button
							type="button"
							onclick={() => {
								inquiryModalOpen = false;
								inquirySubmitted = false;
							}}
							class="mt-3 px-4 py-1.5 bg-emerald-800 text-white rounded-xs text-xs font-bold"
						>
							Close Window
						</button>
					</div>
				{:else}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							inquirySubmitted = true;
						}}
						class="space-y-4 text-xs"
					>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="traveler-name" class="block font-medium text-ink-soft mb-1">Your Full Name</label>
								<input
									id="traveler-name"
									type="text"
									required
									placeholder="e.g. Alex Morgan"
									class="w-full rounded-xs border border-rule bg-paper-2 px-3 py-2 text-xs focus:border-ochre focus:outline-hidden"
								/>
							</div>
							<div>
								<label for="traveler-email" class="block font-medium text-ink-soft mb-1">Email Address</label>
								<input
									id="traveler-email"
									type="email"
									required
									placeholder="alex@example.com"
									class="w-full rounded-xs border border-rule bg-paper-2 px-3 py-2 text-xs focus:border-ochre focus:outline-hidden"
								/>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="party-size" class="block font-medium text-ink-soft mb-1">Number of Trekkers</label>
								<select id="party-size" class="w-full rounded-xs border border-rule bg-paper-2 px-3 py-2 text-xs focus:border-ochre focus:outline-hidden">
									<option>Solo Traveler (1)</option>
									<option>Duo / Couple (2)</option>
									<option selected>Small Group (3-6)</option>
									<option>Large Group (7+)</option>
								</select>
							</div>
							<div>
								<label for="target-season" class="block font-medium text-ink-soft mb-1">Target Season</label>
								<select id="target-season" class="w-full rounded-xs border border-rule bg-paper-2 px-3 py-2 text-xs focus:border-ochre focus:outline-hidden">
									<option>Dry Season (Jan - March)</option>
									<option selected>Dry Season (July - October)</option>
									<option>Shoulder Season (Dec / June)</option>
								</select>
							</div>
						</div>

						<div>
							<label for="safari-add-on" class="block font-medium text-ink-soft mb-1">Optional Safari Add-on</label>
							<select id="safari-add-on" class="w-full rounded-xs border border-rule bg-paper-2 px-3 py-2 text-xs focus:border-ochre focus:outline-hidden">
								<option>None (Kilimanjaro Trek Only)</option>
								<option selected>3-Day Serengeti & Ngorongoro Crater Safari</option>
								<option>5-Day Northern Circuit Game Drive</option>
								<option>4-Day Zanzibar Beach Relaxation</option>
							</select>
						</div>

						<button
							type="submit"
							class="w-full rounded-xs bg-ochre py-3 font-bold text-white text-xs hover:bg-primary-600 transition-colors shadow-xs"
						>
							Submit Inquiry & Request Quote
						</button>
					</form>
				{/if}
			</div>
		</div>
	{/if}

	<!-- FOOTER -->
	<footer class="border-t border-rule bg-paper-2 mt-16 py-8">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-soft">
			<div class="flex items-center gap-2">
				<span class="font-bold text-ink">KiliSpatial</span>
				<span>•</span>
				<span>Stylescape & Design System Showcase</span>
			</div>
			<div class="flex items-center gap-4">
				<a href="/" class="hover:text-ink">3D Map Viewer</a>
				<a href="https://www.kilimanjaroparktanzania.com/" target="_blank" class="hover:text-ink">TANAPA Park Reference</a>
				<span>Sub-3ms Spatial Query Engine</span>
			</div>
		</div>
	</footer>
</div>
