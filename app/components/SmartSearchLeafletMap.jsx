'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const redIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23EA4335%22%3E%3Cpath%20d%3D%22M12%202C8.13%202%205%205.13%205%209c0%205.25%207%2013%207%2013s7-7.75%207-13c0-3.87-3.13-7-7-7z%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%229%22%20r%3D%222.5%22%20fill%3D%22%23750e0e%22%2F%3E%3C%2Fsvg%3E',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -34],
  shadowUrl: null,
});

function MapController({ center, zoom, isExpanded, markerPositions }) {
  const map = useMap();

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    const responsiveZoom = isMobile ? Math.max(zoom - 1, 11) : zoom;

    if (isMobile && isExpanded && markerPositions.length > 0) {
      const bounds = L.latLngBounds([...markerPositions, center]);

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.12), {
          padding: [24, 24],
          maxZoom: responsiveZoom,
          animate: false,
        });
        return;
      }
    }

    map.setView(center, responsiveZoom, { animate: false });
  }, [center, zoom, map, isExpanded, markerPositions]);

  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    map.invalidateSize(false);
    const timers = [120, 300, 600].map((delay) =>
      window.setTimeout(() => {
        map.invalidateSize(false);
      }, delay)
    );

    const handleResize = () => map.invalidateSize(false);
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('resize', handleResize);
    };
  }, [isExpanded, map]);

  return null;
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0);
}

export default function SmartSearchLeafletMap({ center, zoom, isExpanded, properties }) {
  const [isMapReady, setIsMapReady] = useState(false);
  const propertiesWithCoords = useMemo(
    () => properties.filter((property) => Number.isFinite(property.lat) && Number.isFinite(property.lng)),
    [properties]
  );
  const markerPositions = useMemo(
    () => propertiesWithCoords.map((property) => [property.lat, property.lng]),
    [propertiesWithCoords]
  );

  return (
    <div className={`smart-search-map-frame ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl
        className={`smart-search-leaflet ${isMapReady ? 'is-ready' : ''}`}
        style={{ width: '100%', height: '100%' }}
        whenReady={(event) => {
          setIsMapReady(true);
          event.target.invalidateSize(false);
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} isExpanded={isExpanded} markerPositions={markerPositions} />
        {propertiesWithCoords.map((property) => (
          <Marker key={property.id} position={[property.lat, property.lng]} icon={redIcon}>
            <Popup className="custom-popup">
              <div className="popup-card">
                <div className="popup-image-container">
                  <Image
                    src={property.image || '/placeholder-property.jpg'}
                    alt={property.title}
                    className="popup-image"
                    width={320}
                    height={180}
                    unoptimized
                  />
                </div>
                <div className="popup-info">
                  <div className="popup-price">
                    {formatPrice(property.price)}
                    {String(property.transactionType).toLowerCase() === 'aluguel' && (
                      <span className="popup-price-period">/mês</span>
                    )}
                  </div>
                  <div className="popup-title">{property.title}</div>
                  <div className="popup-location">{property.location}</div>
                  <Link href={`/imoveis/${property.id}`} className="popup-link">
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className={`smart-search-map-state ${isExpanded ? 'is-hidden' : ''}`} aria-hidden={isExpanded}>
        <span>Abra o mapa para ver Guaraci e os imoveis com pins.</span>
      </div>
    </div>
  );
}
