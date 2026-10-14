/// <reference types="geojson" />
// src/lib/data/maranguRoute.ts

export interface Waypoint {
	id: string;
	name: string;
	elevation: number; // in meters
	coordinates: [number, number]; // [longitude, latitude]
	stage: number;
	vegetationZone: string;
	oxygenLevelPct: number;
	description: string;
	cameraSettings: {
		pitch: number;
		bearing: number;
		zoom: number;
	};
}

export interface RouteStats {
	routeName: string;
	totalDistanceKm: number;
	durationDays: number;
	startElevation: number;
	summitElevation: number;
	difficulty: string;
}

export const MARANGU_STATS: RouteStats = {
	routeName: 'Marangu Route (Coca-Cola Route)',
	totalDistanceKm: 64,
	durationDays: 6,
	startElevation: 1860,
	summitElevation: 5895,
	difficulty: 'Moderate - Strenuous'
};

export const MARANGU_WAYPOINTS: Waypoint[] = [
	{
		id: 'marangu-gate',
		name: 'Marangu Gate',
		elevation: 1860,
		coordinates: [37.5168, -3.1744],
		stage: 1,
		vegetationZone: 'Cultivation & Montane Rainforest',
		oxygenLevelPct: 80,
		description: 'Official registration point and entrance to Kilimanjaro National Park.',
		cameraSettings: { pitch: 55, bearing: -25, zoom: 13.5 }
	},
	{
		id: 'mandara-hut',
		name: 'Mandara Hut',
		elevation: 2700,
		coordinates: [37.493, -3.1415],
		stage: 2,
		vegetationZone: 'Dense Montane Rainforest',
		oxygenLevelPct: 73,
		description: 'First overnight hut surrounded by moss-covered trees and Maundi Crater access.',
		cameraSettings: { pitch: 62, bearing: -30, zoom: 14 }
	},
	{
		id: 'horombo-hut',
		name: 'Horombo Hut',
		elevation: 3720,
		coordinates: [37.4375, -3.1118],
		stage: 3,
		vegetationZone: 'Heath & Moorland (Giant Groundsels)',
		oxygenLevelPct: 65,
		description: 'Crucial acclimatization hub with clear panoramic views of Kibo and Mawenzi peaks.',
		cameraSettings: { pitch: 65, bearing: -40, zoom: 14 }
	},
	{
		id: 'kibo-hut',
		name: 'Kibo Hut',
		elevation: 4703,
		coordinates: [37.3825, -3.0789],
		stage: 4,
		vegetationZone: 'Alpine Desert (The Saddle)',
		oxygenLevelPct: 56,
		description: 'Barren stone huts situated on the saddle below the summit scree slope.',
		cameraSettings: { pitch: 70, bearing: -50, zoom: 14.5 }
	},
	{
		id: 'gilmans-point',
		name: "Gilman's Point",
		elevation: 5685,
		coordinates: [37.3622, -3.0688],
		stage: 5,
		vegetationZone: 'Arctic / Glacial Crater Rim',
		oxygenLevelPct: 50,
		description: 'First crater rim milestone reached during midnight summit ascent.',
		cameraSettings: { pitch: 72, bearing: -60, zoom: 15 }
	},
	{
		id: 'uhuru-peak',
		name: 'Uhuru Peak',
		elevation: 5895,
		coordinates: [37.3533, -3.0758],
		stage: 6,
		vegetationZone: 'Glacial Summit Zone',
		oxygenLevelPct: 48,
		description: 'The Roof of Africa — highest point on the African continent.',
		cameraSettings: { pitch: 75, bearing: -45, zoom: 15.5 }
	}
];

// GeoJSON containing the continuous ascending trail path + Point features for camps
export const MARANGU_GEOJSON: GeoJSON.FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			id: 'marangu-trail-line',
			properties: {
				title: 'Marangu Ascent Track',
				color: '#10b981', // Emerald neon glow
				strokeWidth: 4
			},
			geometry: {
				type: 'LineString',
				coordinates: [
					// Stage 1: Gate to Mandara Hut
					[37.5168, -3.1744],
					[37.512, -3.168],
					[37.5075, -3.161],
					[37.502, -3.154],
					[37.4975, -3.148],
					[37.493, -3.1415], // Mandara Hut (2,700m)

					// Stage 2: Mandara to Horombo Hut
					[37.487, -3.136],
					[37.48, -3.131],
					[37.472, -3.127],
					[37.464, -3.123],
					[37.455, -3.119],
					[37.446, -3.1155],
					[37.4375, -3.1118], // Horombo Hut (3,720m)

					// Stage 3: Horombo across The Saddle to Kibo Hut
					[37.43, -3.107],
					[37.421, -3.102],
					[37.412, -3.097],
					[37.403, -3.091],
					[37.394, -3.085],
					[37.3825, -3.0789], // Kibo Hut (4,703m)

					// Stage 4: Summit Push (Scree switchbacks to Gilman's & Uhuru)
					[37.377, -3.076],
					[37.372, -3.0735],
					[37.367, -3.071],
					[37.3622, -3.0688], // Gilman's Point (5,685m)
					[37.358, -3.072], // Stella Point intersection
					[37.3533, -3.0758] // Uhuru Peak (5,895m)
				]
			}
		},
		...MARANGU_WAYPOINTS.map((wp) => ({
			type: 'Feature' as const,
			id: wp.id,
			properties: {
				id: wp.id,
				name: wp.name,
				elevation: wp.elevation,
				stage: wp.stage,
				vegetationZone: wp.vegetationZone,
				oxygenLevelPct: wp.oxygenLevelPct,
				description: wp.description
			},
			geometry: {
				type: 'Point' as const,
				coordinates: wp.coordinates
			}
		}))
	]
};

// Simplified elevation data profile for Chart / HUD scrubbers
export const MARANGU_ELEVATION_PROFILE = [
	{ distanceKm: 0.0, elevation: 1860, name: 'Marangu Gate' },
	{ distanceKm: 3.5, elevation: 2240, name: 'Rainforest Trail' },
	{ distanceKm: 8.3, elevation: 2700, name: 'Mandara Hut' },
	{ distanceKm: 12.0, elevation: 3100, name: 'Moorland Entry' },
	{ distanceKm: 15.5, elevation: 3450, name: 'Lower Horombo Ridge' },
	{ distanceKm: 20.0, elevation: 3720, name: 'Horombo Hut' },
	{ distanceKm: 24.5, elevation: 4100, name: 'The Alpine Saddle' },
	{ distanceKm: 29.5, elevation: 4703, name: 'Kibo Hut' },
	{ distanceKm: 31.5, elevation: 5150, name: 'Hans Meyer Cave' },
	{ distanceKm: 33.2, elevation: 5685, name: "Gilman's Point" },
	{ distanceKm: 34.0, elevation: 5895, name: 'Uhuru Peak' }
];
