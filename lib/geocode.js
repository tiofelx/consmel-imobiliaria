const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function buildQuery({ street, number, neighborhood, city, state, cep }) {
  const streetLine = [street, number].filter(Boolean).join(', ');
  const parts = [streetLine, neighborhood, city, state, cep, 'Brasil']
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean);
  return parts.join(', ');
}

export async function geocodeAddress(address) {
  const query = buildQuery(address || {});
  if (!query || query === 'Brasil') return null;

  const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=br&addressdetails=0&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'consmel-imobiliaria/1.0 (contato@consmel.com.br)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const latitude = parseFloat(data[0].lat);
    const longitude = parseFloat(data[0].lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}
