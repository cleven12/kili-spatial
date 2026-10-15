// Small geodesy helpers shared by the build scripts (no dependencies).
const R = 6371008.8;
const rad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in metres between [lon, lat] points. */
export function haversine(a, b) {
	const dLat = rad(b[1] - a[1]);
	const dLon = rad(b[0] - a[0]);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

/** Local planar projection (metres) good enough near the equator for ~50 km. */
export function toXY(p, origin = [37.35, -3.1]) {
	return [rad(p[0] - origin[0]) * R * Math.cos(rad(origin[1])), rad(p[1] - origin[1]) * R];
}

/** Distance from point p to segment ab (planar metres) and the segment parameter t. */
export function pointToSegment(p, a, b) {
	const [px, py] = toXY(p), [ax, ay] = toXY(a), [bx, by] = toXY(b);
	const dx = bx - ax, dy = by - ay;
	const len2 = dx * dx + dy * dy;
	const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
	return { dist: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t };
}

/** Douglas-Peucker over an index range; `keep` forces vertices to survive. */
export function simplify(points, toleranceM, keep = new Set()) {
	const marked = new Uint8Array(points.length);
	marked[0] = marked[points.length - 1] = 1;
	for (const i of keep) marked[i] = 1;

	const stack = [];
	let prev = 0;
	for (let i = 1; i < points.length; i++) {
		if (marked[i]) {
			stack.push([prev, i]);
			prev = i;
		}
	}
	while (stack.length) {
		const [s, e] = stack.pop();
		let maxD = 0, idx = -1;
		for (let i = s + 1; i < e; i++) {
			const { dist } = pointToSegment(points[i], points[s], points[e]);
			if (dist > maxD) {
				maxD = dist;
				idx = i;
			}
		}
		if (maxD > toleranceM && idx > 0) {
			marked[idx] = 1;
			stack.push([s, idx], [idx, e]);
		}
	}
	const out = [];
	for (let i = 0; i < points.length; i++) if (marked[i]) out.push(i);
	return out;
}
