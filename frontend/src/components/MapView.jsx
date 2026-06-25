import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapView({ center = [20.5937, 78.9629], zoom = 5, markers = [], route = [], height = '400px', className = '' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    return () => {
      if (map) {
        map.off();
        map.remove();
        mapInstanceRef.current = null;
      }
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }

    if (markers.length > 0) {
      markersLayerRef.current = L.layerGroup(
        markers.map((m) =>
          L.marker([m.lat, m.lng])
            .bindPopup(m.label || '')
            .openPopup()
        )
      ).addTo(map);

      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    if (route.length > 1) {
      routeLayerRef.current = L.polyline(route, {
        color: '#2563eb',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(map);

      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && center) {
      map.setView(center, zoom);
    }
  }, [center, zoom]);

  return <div ref={mapRef} className={`rounded-xl ${className}`} style={{ height }} />;
}
