import type { Place, Route } from '#lib/types.ts';

function download(name: string, type: string, text: string) {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const LICENSE = 'Data © OpenStreetMap contributors, ODbL 1.0. Approximate; not for navigation.';

/** Route geometry, days and stops as a GeoJSON FeatureCollection (WGS84, [lng, lat, ele]). */
export function routeGeoJson(route: Route, places: Map<string, Place>) {
	return {
		type: 'FeatureCollection',
		license: LICENSE,
		features: [
			{
				type: 'Feature',
				properties: { id: route.id, name: route.name, days: route.durationDays, ...route.stats, gaps: route.gaps },
				geometry: { type: 'LineString', coordinates: route.coordinates }
			},
			...route.marks
				.filter((m) => m.kind === 'stop')
				.flatMap((m) => {
					const p = places.get(m.place);
					return p
						? [
								{
									type: 'Feature',
									properties: { name: p.name, kind: p.kind, elevation: p.elevation, km: Math.round(m.km * 100) / 100 },
									geometry: { type: 'Point', coordinates: p.coordinates }
								}
							]
						: [];
				})
		]
	};
}

export function downloadRouteGeoJson(route: Route, places: Map<string, Place>) {
	download(`kilispatial-${route.id}.geojson`, 'application/geo+json', JSON.stringify(routeGeoJson(route, places)));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Untimed GPX: the route line as one track, stops as waypoints. */
export function downloadRouteGpx(route: Route, places: Map<string, Place>) {
	const wpts = route.marks
		.filter((m) => m.kind === 'stop')
		.map((m) => places.get(m.place))
		.filter((p): p is Place => !!p)
		.map((p) => `  <wpt lat="${p.coordinates[1]}" lon="${p.coordinates[0]}">${p.elevation ? `<ele>${p.elevation}</ele>` : ''}<name>${esc(p.name)}</name></wpt>`)
		.join('\n');
	const pts = route.coordinates
		.map((c) => `    <trkpt lat="${c[1]}" lon="${c[0]}"><ele>${c[2]}</ele></trkpt>`)
		.join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="KiliSpatial" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${esc(route.name)} route</name><desc>${LICENSE}</desc></metadata>
${wpts}
  <trk><name>${esc(route.name)}</name><trkseg>
${pts}
  </trkseg></trk>
</gpx>
`;
	download(`kilispatial-${route.id}.gpx`, 'application/gpx+xml', xml);
}
