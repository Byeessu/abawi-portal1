import { useEffect, useRef } from 'react';

export default function LocationMessage({ lat, lng, address }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!lat || !lng || !mapRef.current) return;
    let cancelled = false;

    async function initMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled) return;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(mapInstance.current);
      } else {
        mapInstance.current.setView([lat, lng], 15);
        mapInstance.current.eachLayer((layer) => {
          if (layer instanceof L.Marker) mapInstance.current.removeLayer(layer);
        });
      }

      L.marker([lat, lng]).addTo(mapInstance.current);
    }

    initMap();
    return () => { cancelled = true; };
  }, [lat, lng]);

  return (
    <div className="abv-location-msg">
      <div ref={mapRef} style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden' }} />
      <div className="abv-location-info">
        <span className="abv-location-label">📍 {address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</span>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="abv-location-link"
        >
          Ouvrir dans Maps →
        </a>
      </div>
    </div>
  );
}
