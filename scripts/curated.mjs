// Hand-curated layer on top of OpenStreetMap.
//
// OSM supplies geometry and positions. This file supplies *knowledge OSM does
// not have*: which OSM objects are the "same" camp, canonical names, and the
// typical day-by-day itinerary for each route. Everything here is reviewable
// and flagged `source: 'curated'` in the output.

/** Overpass element refs: n = node, w = way, r = relation. First ref gives coordinates. */
export const PLACES = [
	// --- Park gates -------------------------------------------------------
	{ id: 'marangu-gate', name: 'Marangu Gate', kind: 'gate', osm: ['n2142573962'], routes: ['marangu', 'rongai'] },
	{ id: 'machame-gate', name: 'Machame Gate', kind: 'gate', osm: ['w499121173', 'n11917135970'], routes: ['machame'] },
	{ id: 'umbwe-gate', name: 'Umbwe Gate', kind: 'gate', osm: ['n12229692534', 'w499724013'], routes: ['umbwe'] },
	{ id: 'mweka-gate', name: 'Mweka Gate', kind: 'gate', osm: ['n6252257213', 'w499631175'] },
	{ id: 'lemosho-gate', name: 'Lemosho Gate', kind: 'gate', osm: ['n12223874665', 'w499631655'], routes: ['lemosho'] },
	{ id: 'londorosi-gate', name: 'Londorosi Gate', kind: 'gate', osm: ['n12223874664', 'n1455926579'], note: 'Park registration gate for Lemosho, Shira and Northern Circuit.' },
	{ id: 'rongai-gate', name: 'Rongai (Nale Moru) Gate', kind: 'gate', osm: ['n12229936231'], routes: ['rongai'] },

	// --- Marangu / Rongai huts and caves ---------------------------------
	{ id: 'mandara-hut', name: 'Mandara Hut', kind: 'hut', osm: ['n2459235292', 'w971175027'] },
	{ id: 'horombo-hut', name: 'Horombo Hut', kind: 'hut', osm: ['n11908631624', 'n2125844166'] },
	{ id: 'kibo-hut', name: 'Kibo Hut', kind: 'hut', osm: ['n11921028630', 'w971426557'] },
	{ id: 'mawenzi-tarn-hut', name: 'Mawenzi Tarn Hut', kind: 'hut', osm: ['n11954095753', 'n296912071'] },
	{ id: 'simba-camp', name: 'Simba Camp', kind: 'camp', osm: ['n12223883633', 'n2125813264'], alt: ['First Cave'] },
	{ id: 'second-cave', name: 'Second Cave', kind: 'camp', osm: ['n2125821921'] },
	{ id: 'kikelewa-camp', name: 'Kikelewa Camp', kind: 'camp', osm: ['n12223796992', 'n296911105'], alt: ['Kikelewa Caves'] },
	{ id: 'third-cave', name: 'Third Cave', kind: 'camp', osm: ['n2459235288', 'n10088755017'] },
	{ id: 'school-hut', name: 'School Hut', kind: 'camp', osm: ['n2459196680'] },

	// --- Western approach: Machame / Lemosho / Shira / Umbwe -------------
	{ id: 'big-tree-camp', name: 'Big Tree Camp', kind: 'camp', osm: ['w499611942'], alt: ['Mti Mkubwa'] },
	{ id: 'shira-1', name: 'Shira 1 Camp', kind: 'camp', osm: ['n12223869778', 'w499566525'] },
	{ id: 'shira-2', name: 'Shira 2 Camp', kind: 'camp', osm: ['n12223867297', 'w499121171'], alt: ['Shira Camp'] },
	{ id: 'shira-cave', name: 'Shira Cave Camp', kind: 'camp', osm: ['n12223846943', 'w498670434'] },
	{ id: 'machame-camp', name: 'Machame Camp', kind: 'camp', osm: ['n12223867812', 'w499108849'] },
	{ id: 'moir-hut', name: 'Moir Hut', kind: 'hut', osm: ['w499125590'] },
	{ id: 'lava-tower', name: 'Lava Tower', kind: 'camp', osm: ['w498670436'] },
	{ id: 'barranco-camp', name: 'Barranco Camp', kind: 'camp', osm: ['n11908628380', 'w498670433'] },
	{ id: 'karanga-camp', name: 'Karanga Camp', kind: 'camp', osm: ['n11908845614', 'w499682666'] },
	{ id: 'barafu-camp', name: 'Barafu Camp', kind: 'camp', osm: ['n11908530138', 'w499687559'] },
	{ id: 'millennium-camp', name: 'Millennium (High) Camp', kind: 'camp', osm: ['n11908752088', 'w499700363'] },
	{ id: 'mweka-camp', name: 'Mweka Camp', kind: 'camp', osm: ['n11914577587', 'w499699621'] },
	{ id: 'umbwe-camp', name: 'Umbwe Camp', kind: 'camp', osm: ['w499727378'], alt: ['Umbwe Cave Camp'] },

	// --- Summit zone -------------------------------------------------------
	{ id: 'crater-camp', name: 'Crater Camp', kind: 'camp', osm: ['w498670438'] },
	{ id: 'arrow-glacier-camp', name: 'Arrow Glacier Camp', kind: 'camp', osm: ['n9405140190'] },
	// Summit points. Only Uhuru Peak is in OSM. Gilman's and Stella Point need a
	// verified GPS source before they can be added (see README roadmap).
	{ id: 'uhuru-peak', name: 'Uhuru Peak', kind: 'summit', peak: 'Uhuru Peak', ele: 5895, note: 'Highest point in Africa.' },
	// Shira route start (park barrier on the plateau).
	{ id: 'morum-barrier', name: 'Morum Barrier', kind: 'gate', osm: ['n12223883631'], routes: ['shira'], note: 'Shira route start on the plateau.' }
];

/**
 * Typical itineraries. Each day is a walk from one overnight stop to the next;
 * `via` forces the path through summit points or passes. Day counts reflect the
 * most common operator schedule and are indicative, not prescriptive.
 */
export const ROUTES = [
	{
		id: 'marangu',
		name: 'Marangu',
		nickname: 'Coca-Cola route',
		summary: 'The only route with hut accommodation. Ascends and descends the same trail.',
		accommodation: 'huts',
		days: [
			{ from: 'marangu-gate', to: 'mandara-hut' },
			{ from: 'mandara-hut', to: 'horombo-hut' },
			{ from: 'horombo-hut', to: 'kibo-hut' },
			{ from: 'kibo-hut', to: 'horombo-hut', via: ['uhuru-peak'] },
			{ from: 'horombo-hut', to: 'marangu-gate', via: ['mandara-hut'] }
		]
	},
	{
		id: 'machame',
		name: 'Machame',
		nickname: 'Whiskey route',
		summary: 'Scenic and popular. Climb high, sleep low via Lava Tower and the Barranco Wall.',
		accommodation: 'camping',
		days: [
			{ from: 'machame-gate', to: 'machame-camp' },
			{ from: 'machame-camp', to: 'shira-cave' },
			{ from: 'shira-cave', to: 'barranco-camp', via: ['lava-tower'] },
			{ from: 'barranco-camp', to: 'karanga-camp' },
			{ from: 'karanga-camp', to: 'barafu-camp' },
			{ from: 'barafu-camp', to: 'mweka-camp', via: ['uhuru-peak'] },
			{ from: 'mweka-camp', to: 'mweka-gate' }
		]
	},
	{
		id: 'lemosho',
		name: 'Lemosho',
		nickname: 'Most scenic',
		summary: 'Remote western start across the Shira plateau, joining the Machame route.',
		accommodation: 'camping',
		days: [
			{ from: 'lemosho-gate', to: 'big-tree-camp' },
			{ from: 'big-tree-camp', to: 'shira-1' },
			{ from: 'shira-1', to: 'shira-2' },
			{ from: 'shira-2', to: 'barranco-camp', via: ['lava-tower'] },
			{ from: 'barranco-camp', to: 'karanga-camp' },
			{ from: 'karanga-camp', to: 'barafu-camp' },
			{ from: 'barafu-camp', to: 'mweka-camp', via: ['uhuru-peak'] },
			{ from: 'mweka-camp', to: 'mweka-gate' }
		]
	},
	{
		id: 'rongai',
		name: 'Rongai',
		nickname: 'Northern approach',
		summary: 'Gentle, drier approach from the north, descending via Marangu.',
		accommodation: 'camping',
		days: [
			{ from: 'rongai-gate', to: 'simba-camp' },
			{ from: 'simba-camp', to: 'kikelewa-camp' },
			{ from: 'kikelewa-camp', to: 'mawenzi-tarn-hut' },
			{ from: 'mawenzi-tarn-hut', to: 'kibo-hut' },
			{ from: 'kibo-hut', to: 'horombo-hut', via: ['uhuru-peak'] },
			{ from: 'horombo-hut', to: 'marangu-gate', via: ['mandara-hut'] }
		]
	},
	{
		id: 'umbwe',
		name: 'Umbwe',
		nickname: 'Steep and direct',
		summary: 'The steepest and shortest route. Rapid ascent, so acclimatisation is harder.',
		accommodation: 'camping',
		days: [
			{ from: 'umbwe-gate', to: 'umbwe-camp' },
			{ from: 'umbwe-camp', to: 'barranco-camp' },
			{ from: 'barranco-camp', to: 'karanga-camp' },
			{ from: 'karanga-camp', to: 'barafu-camp' },
			{ from: 'barafu-camp', to: 'mweka-camp', via: ['uhuru-peak'] },
			{ from: 'mweka-camp', to: 'mweka-gate' }
		]
	},
	{
		id: 'northern-circuit',
		name: 'Northern Circuit',
		nickname: 'Longest route',
		summary: 'Circles the mountain on its quiet northern slopes. Best acclimatisation, fewest crowds.',
		accommodation: 'camping',
		unverified: true,
		note: 'Day split is indicative; operators vary between 8 and 10 days.',
		days: [
			{ from: 'lemosho-gate', to: 'big-tree-camp' },
			{ from: 'big-tree-camp', to: 'shira-1' },
			{ from: 'shira-1', to: 'moir-hut' },
			{ from: 'moir-hut', to: 'third-cave' },
			{ from: 'third-cave', to: 'school-hut' },
			{ from: 'school-hut', to: 'millennium-camp', via: ['uhuru-peak'] },
			{ from: 'millennium-camp', to: 'mweka-gate' }
		]
	},
	{
		id: 'shira',
		name: 'Shira',
		nickname: 'Plateau route',
		summary: 'Starts high on the Shira plateau, so a fast ascent. Joins Machame at Lava Tower.',
		accommodation: 'camping',
		unverified: true,
		note: 'Start at the Morum Barrier, inferred from the OSM route geometry.',
		days: [
			{ from: 'morum-barrier', to: 'shira-cave' },
			{ from: 'shira-cave', to: 'barranco-camp', via: ['lava-tower'] },
			{ from: 'barranco-camp', to: 'karanga-camp' },
			{ from: 'karanga-camp', to: 'barafu-camp' },
			{ from: 'barafu-camp', to: 'mweka-camp', via: ['uhuru-peak'] },
			{ from: 'mweka-camp', to: 'mweka-gate' }
		]
	}
];

/** OSM relation ids for each route (hiking route relations, bbox-verified). */
export const OSM_ROUTE_RELATIONS = [8737224, 8737225, 8737241, 8737242, 8737291, 8737292, 8737343, 8737371];

/** Lodging within this distance of any park gate is included as "lodging". */
export const LODGING_RADIUS_KM = 18;
