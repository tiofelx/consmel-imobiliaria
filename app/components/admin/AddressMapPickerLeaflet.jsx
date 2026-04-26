'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const pinIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23EA4335%22%3E%3Cpath%20d%3D%22M12%202C8.13%202%205%205.13%205%209c0%205.25%207%2013%207%2013s7-7.75%207-13c0-3.87-3.13-7-7-7z%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%229%22%20r%3D%222.5%22%20fill%3D%22%23750e0e%22%2F%3E%3C%2Fsvg%3E',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

function Recenter({ center, marker }) {
  const map = useMap();
  const lastCenterRef = useRef(null);

  useEffect(() => {
    const target = marker || center;
    if (!target) return;
    const key = target.join(',');
    if (lastCenterRef.current === key) return;
    lastCenterRef.current = key;
    map.setView(target, marker ? Math.max(map.getZoom(), 16) : map.getZoom() || 13, {
      animate: true,
    });
  }, [center, marker, map]);

  // Garante que o leaflet recalcule o tamanho ao montar (evita tiles cinzas).
  useEffect(() => {
    const timers = [60, 240, 600].map((delay) =>
      window.setTimeout(() => map.invalidateSize(false), delay)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [map]);

  return null;
}

function ClickToPlace({ onMarkerChange }) {
  useMapEvents({
    click(event) {
      onMarkerChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function AddressMapPickerLeaflet({ center, marker, onMarkerChange }) {
  const markerRef = useRef(null);

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} marker={marker} />
      <ClickToPlace onMarkerChange={onMarkerChange} />
      {marker && (
        <Marker
          position={marker}
          icon={pinIcon}
          draggable
          ref={markerRef}
          eventHandlers={{
            dragend() {
              const m = markerRef.current;
              if (!m) return;
              const { lat, lng } = m.getLatLng();
              onMarkerChange(lat, lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
