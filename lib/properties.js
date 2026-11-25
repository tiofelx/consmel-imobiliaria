// Filtro dos imóveis na home.
export function searchProperties(properties, filters) {
  const normalizeText = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const normalizeSlugLabel = (value) => normalizeText(String(value || '').replace(/-/g, ' '));

  let filtered = [...properties];

  if (filters.transactionType) {
    const transactionMap = {
      aluguel: 'Aluguel',
      venda: 'Venda',
    };
    const mappedType = transactionMap[normalizeText(filters.transactionType)] || filters.transactionType;
    const normalizedMappedType = normalizeText(mappedType);

    filtered = filtered.filter((prop) =>
      normalizeText(prop.transactionType) === normalizedMappedType
    );
  }

  if (filters.propertyType) {
    const normalizedPropertyType = normalizeText(filters.propertyType);
    filtered = filtered.filter((prop) =>
      normalizeText(prop.type) === normalizedPropertyType
    );
  }

  if (filters.city) {
    const cityMap = {
      'sao-paulo': 'São Paulo',
      'barueri': 'Barueri',
      'osasco': 'Osasco',
      'guarulhos': 'Guarulhos',
      'santo-andre': 'Santo André',
      'guaraci': 'Guaraci',
    };
    const cityName = cityMap[filters.city] || filters.city;
    const normalizedCity = normalizeSlugLabel(cityName);

    filtered = filtered.filter((prop) =>
      normalizeText(prop.location).includes(normalizedCity)
    );
  }

  if (filters.neighborhood) {
    const neighborhoodMap = {
      'curva-da-galinha': 'Curva da Galinha',
      'jardim-paulista': 'Jardim Paulista',
      'moema': 'Moema',
      'vila-mariana': 'Vila Mariana',
      'pinheiros': 'Pinheiros',
      'itaim-bibi': 'Itaim Bibi',
      'morumbi': 'Morumbi',
      'alphaville': 'Alphaville',
    };
    const neighborhoodName = neighborhoodMap[filters.neighborhood] || filters.neighborhood;
    const normalizedNeighborhood = normalizeSlugLabel(neighborhoodName);

    filtered = filtered.filter((prop) =>
      normalizeText(prop.location).includes(normalizedNeighborhood)
    );
  }

  if (filters.priceRange) {
    const [minPrice, maxPrice] = filters.priceRange.split('-').map(Number);
    if (!isNaN(minPrice)) {
      filtered = filtered.filter(prop => prop.price >= minPrice);
    }
    if (!isNaN(maxPrice)) {
      filtered = filtered.filter(prop => prop.price <= maxPrice);
    }
  }

  if (filters.bedrooms) {
    filtered = filtered.filter(prop => prop.bedrooms >= filters.bedrooms);
  }

  return filtered;
}
