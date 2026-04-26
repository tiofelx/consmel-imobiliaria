const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function clean(value) {
  if (value == null) return '';
  return String(value).trim();
}

// Constrói as queries em ordem de especificidade decrescente. Nominatim
// tende a falhar com queries muito longas (CEP + número + bairro), então
// vamos do mais completo ao mais genérico até achar algo.
export function buildQueryCandidates({ street, number, neighborhood, city, state, cep }) {
  const s = clean(street);
  const n = clean(number);
  const b = clean(neighborhood);
  const c = clean(city);
  const uf = clean(state);
  const z = clean(cep);

  const streetLine = [s, n].filter(Boolean).join(', ');
  const candidates = [];

  if (streetLine && c) {
    candidates.push([streetLine, b, c, uf, z, 'Brasil'].filter(Boolean).join(', '));
    candidates.push([streetLine, b, c, uf, 'Brasil'].filter(Boolean).join(', '));
    candidates.push([streetLine, c, uf, 'Brasil'].filter(Boolean).join(', '));
  }
  if (b && c) {
    candidates.push([b, c, uf, 'Brasil'].filter(Boolean).join(', '));
  }
  if (c) {
    candidates.push([c, uf, 'Brasil'].filter(Boolean).join(', '));
  }

  // Remove duplicatas mantendo ordem
  return [...new Set(candidates)].filter((q) => q && q !== 'Brasil');
}

export async function queryNominatim(query) {
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

export async function geocodeAddress(address) {
  const candidates = buildQueryCandidates(address || {});
  for (const query of candidates) {
    const result = await queryNominatim(query);
    if (result) return result;
    // Espaça as tentativas dentro da mesma chamada para não estourar o
    // rate limit do Nominatim (1 req/s).
    await new Promise((r) => setTimeout(r, 1100));
  }
  return null;
}
