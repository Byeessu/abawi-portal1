const EDGE_BASE = '';

const GOOGLE_TYPE_MAP = {
  restaurant: 'restaurant',
  sante: 'pharmacy',
  commerce: 'store',
  services: 'bank',
  transport: 'gas_station',
  education: 'school',
  hotel: 'lodging',
  securite: 'police',
  entreprises: 'office',
  loisirs: 'park',
  culte: 'place_of_worship',
  monuments: 'tourist_attraction',
  logement: 'real_estate_agency',
  industrie: 'storage',
};

export async function fetchGooglePlacesByCategory(lat, lng, radius, categoryId, openNow = true) {
  const type = GOOGLE_TYPE_MAP[categoryId] || 'establishment';
  try {
    const res = await fetch(`${EDGE_BASE}/.netlify/edge-functions/places-nearby?lat=${lat}&lng=${lng}&radius=${radius}&type=${type}&opennow=${openNow}`);
    if (!res.ok) throw new Error('Google Places fetch failed');
    return await res.json();
  } catch (e) {
    console.error('AbSpace Google Places error:', e);
    return { results: [], error: e.message };
  }
}

export async function fetchGooglePlacesNearby(lat, lng, radius = 1000, keyword = '') {
  try {
    const res = await fetch(`${EDGE_BASE}/.netlify/edge-functions/places-nearby?lat=${lat}&lng=${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error('Google Places fetch failed');
    return await res.json();
  } catch (e) {
    console.error('AbSpace Google Places nearby error:', e);
    return { results: [], error: e.message };
  }
}
