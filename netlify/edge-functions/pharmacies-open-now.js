export default async (request, context) => {
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat') || '14.7167';
  const lng = url.searchParams.get('lng') || '-17.4677';
  const radius = url.searchParams.get('radius') || '5000';
  const apiKey = Netlify.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) return new Response(JSON.stringify({ error: 'API key missing' }), { status: 500 });
  try {
    const gUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=pharmacy&opennow=true&key=${apiKey}`;
    const r = await fetch(gUrl);
    const data = await r.json();
    const results = (data.results || []).map(p => ({
      name: p.name,
      address: p.vicinity,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      rating: p.rating,
      totalRatings: p.user_ratings_total,
      placeId: p.place_id,
      types: p.types,
      openNow: p.opening_hours?.open_now || false,
      photoReference: p.photos?.[0]?.photo_reference || null
    }));
    return new Response(JSON.stringify({ results, count: results.length, source: 'google_places' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
