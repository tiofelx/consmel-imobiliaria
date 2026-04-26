'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import './AddressMapPicker.css';

const AddressMapPickerLeaflet = dynamic(() => import('./AddressMapPickerLeaflet'), {
  ssr: false,
  loading: () => <div className="map-picker-loading">Carregando mapa…</div>,
});

const DEFAULT_CENTER = { latitude: -20.5065555, longitude: -48.9160555 };

export default function AddressMapPicker({ address, value, onChange }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ok | miss | error
  const [statusMessage, setStatusMessage] = useState('');

  const handleAutoLocate = async () => {
    setStatus('loading');
    setStatusMessage('Localizando endereço…');

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      if (res.status === 404) {
        setStatus('miss');
        setStatusMessage('Endereço não localizado. Arraste o pin manualmente.');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        setStatusMessage('Erro ao consultar o mapa.');
        return;
      }

      const coords = await res.json();
      onChange({ latitude: coords.latitude, longitude: coords.longitude });
      setStatus('ok');
      setStatusMessage('Pin posicionado. Ajuste arrastando se precisar.');
    } catch {
      setStatus('error');
      setStatusMessage('Falha de rede ao consultar o mapa.');
    }
  };

  const center = value || DEFAULT_CENTER;

  // Limpa a mensagem de erro/miss assim que o usuário arrasta o pin manualmente.
  useEffect(() => {
    if (value && (status === 'miss' || status === 'error')) {
      setStatus('ok');
      setStatusMessage('Pin ajustado manualmente.');
    }
  }, [value, status]);

  return (
    <div className="map-picker">
      <div className="map-picker-header">
        <div>
          <h5 className="map-picker-title">Localização no mapa</h5>
          <p className="map-picker-help">
            Use o botão para localizar pelo endereço, depois arraste o pin para ajustar a posição exata.
          </p>
        </div>
        <button type="button" className="map-picker-btn" onClick={handleAutoLocate} disabled={status === 'loading'}>
          {status === 'loading' ? 'Localizando…' : 'Localizar pelo endereço'}
        </button>
      </div>

      <div className="map-picker-frame">
        <AddressMapPickerLeaflet
          center={[center.latitude, center.longitude]}
          marker={value ? [value.latitude, value.longitude] : null}
          onMarkerChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
        />
      </div>

      <div className={`map-picker-status status-${status}`}>
        {value ? (
          <span>
            Coordenadas: <strong>{value.latitude.toFixed(6)}</strong>, <strong>{value.longitude.toFixed(6)}</strong>
          </span>
        ) : (
          <span>Nenhum pin definido ainda.</span>
        )}
        {statusMessage && <span className="map-picker-feedback">{statusMessage}</span>}
      </div>
    </div>
  );
}
