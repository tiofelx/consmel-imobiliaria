// Mock property data for demonstration
export const properties = [
  {
    id: 1,
    title: 'Casa Moderna',
    price: 850000,
    location: 'Jardim Paulista, São Paulo - SP',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 2,
    area: 180,
    dimensions: {
      frontage: 10.00,
      back: 25.00,
      left: 30.00,
      right: 30.00,
      built: 180.00
    },
    image: '/images/property-1.jpg',
    images: [
      '/images/property-1.jpg',
      '/images/property-2.jpg', 
      '/images/property-3.jpg',
      '/images/property-4.jpg'
    ],
    transactionType: 'Venda',
    description: 'Lindíssima casa moderna com acabamento de primeira qualidade. Ambiente integrado, cozinha planejada, churrasqueira e área gourmet. Quintal espaçoso perfeito para família.',
    features: ['Churrasqueira', 'Área Gourmet', 'Quintal', 'Garagem Coberta', 'Cozinha Planejada'],
    lat: -23.571434,
    lng: -46.657805
  },
  {
    id: 2,
    title: 'Apartamento Cobertura',
    price: 1200000,
    location: 'Moema, São Paulo - SP',
    type: 'Apartamento',
    bedrooms: 4,
    bathrooms: 3,
    area: 220,
    image: '/images/property-2.jpg',
    images: [
      '/images/property-2.jpg',
      '/images/property-5.jpg',
      '/images/property-6.jpg'
    ],
    transactionType: 'Venda',
    description: 'Cobertura deslumbrante com vista panorâmica para o parque. Terraço amplo, piscina privativa, acabamento de luxo. Condomínio completo com lazer.',
    features: ['Piscina Privativa', 'Terraço', 'Vista para Parque', '3 Vagas', 'Lazer Completo'],
    lat: -23.602521,
    lng: -46.661726
  },
  {
    id: 3,
    title: 'Casa em Condomínio',
    price: 650000,
    location: 'Alphaville, Barueri - SP',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 2,
    area: 200,
    image: '/images/property-3.jpg',
    images: [
      '/images/property-3.jpg',
      '/images/property-7.jpg',
      '/images/property-8.jpg'
    ],
    transactionType: 'Venda',
    description: 'Casa espaçosa em condomínio fechado de alto padrão. Segurança 24h, área de lazer completa. Excelente localização próximo a escolas e comércio.',
    features: ['Condomínio Fechado', 'Segurança 24h', 'Área de Lazer', 'Piscina', '2 Vagas'],
    lat: -23.496528,
    lng: -46.850401
  },
  {
    id: 4,
    title: 'Apartamento Compacto',
    price: 2500,
    location: 'Centro, São Paulo - SP',
    type: 'Apartamento',
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    image: '/images/property-4.jpg',
    images: [
      '/images/property-4.jpg',
      '/images/property-1.jpg'
    ],
    transactionType: 'Aluguel',
    description: 'Apartamento prático e bem localizado no centro da cidade. Próximo a metrô, ônibus e comércio. Ideal para profissionais ou estudantes.',
    features: ['Próximo ao Metrô', 'Mobiliado', '1 Vaga', 'Portaria 24h'],
    lat: -23.550520,
    lng: -46.633309
  },
  {
    id: 5,
    title: 'Cobertura Duplex',
    price: 1850000,
    location: 'Morumbi, São Paulo - SP',
    type: 'Apartamento',
    bedrooms: 5,
    bathrooms: 4,
    area: 350,
    image: '/images/property-5.jpg',
    images: [
      '/images/property-5.jpg',
      '/images/property-2.jpg',
      '/images/property-3.jpg'
    ],
    transactionType: 'Venda',
    description: 'Cobertura duplex de alto luxo com acabamento impecável. Piscina privativa, sauna, home theater. Vista deslumbrante da cidade.',
    features: ['Piscina Privativa', 'Sauna', 'Home Theater', '4 Vagas', 'Elevador Privativo'],
    lat: -23.597950,
    lng: -46.711818
  },
  {
    id: 6,
    title: 'Casa Sobrado',
    price: 4800,
    location: 'Vila Mariana, São Paulo - SP',
    type: 'Casa',
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    image: '/images/property-6.jpg',
    images: [
      '/images/property-6.jpg',
      '/images/property-4.jpg',
      '/images/property-5.jpg'
    ],
    transactionType: 'Aluguel',
    description: 'Sobrado charmoso em rua tranquila. Próximo a escolas, parques e comércio. Quintal com churrasqueira e garagem coberta.',
    features: ['Churrasqueira', 'Quintal', 'Garagem Coberta', 'Próximo a Parques'],
    lat: -23.585579,
    lng: -46.634674
  },
  {
    id: 7,
    title: 'Terreno Comercial',
    price: 550000,
    location: 'Pinheiros, São Paulo - SP',
    type: 'Terreno',
    bedrooms: null,
    bathrooms: null,
    area: 400,
    image: '/images/property-7.jpg',
    images: [
      '/images/property-7.jpg',
      '/images/property-8.jpg'
    ],
    transactionType: 'Venda',
    description: 'Excelente terreno comercial em avenida de grande movimento. Zoneamento comercial, documentação em dia. Ótima oportunidade de investimento.',
    features: ['Zoneamento Comercial', 'Escritura Registrada', 'Ótima Localização'],
    lat: -23.565457,
    lng: -46.696803
  },
  {
    id: 8,
    title: 'Studio Moderno',
    price: 2200,
    location: 'Itaim Bibi, São Paulo - SP',
    type: 'Apartamento',
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    image: '/images/property-8.jpg',
    images: [
      '/images/property-8.jpg',
      '/images/property-1.jpg',
      '/images/property-2.jpg'
    ],
    transactionType: 'Aluguel',
    description: 'Studio moderno totalmente mobiliado. Prédio novo com infraestrutura completa. Localização privilegiada próximo a restaurantes e escritórios.',
    features: ['Mobiliado', 'Prédio Novo', 'Academia', 'Coworking', '1 Vaga'],
    lat: -23.584102,
    lng: -46.680002
  }
];

// Utility functions
export function getPropertyById(id) {
  return properties.find(prop => prop.id === parseInt(id));
}

export function getPropertiesByType(transactionType) {
  if (!transactionType) return properties;
  return properties.filter(prop => 
    prop.transactionType.toLowerCase() === transactionType.toLowerCase()
  );
}

// Ensure this function is exported so it can be used in page.jsx
export function getRelatedProperties(currentProperty, limit = 3) {
  if (!currentProperty) return [];
  
  // Filter by same type and exclude current property
  return properties.filter(prop => 
    prop.type === currentProperty.type && 
    prop.id !== currentProperty.id
  ).slice(0, limit);
}

export function getFeaturedProperties(limit = 6) {
  return properties.slice(0, limit);
}

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

  // City filter - match against location string
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

  // Neighborhood filter - match against location string
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

  // Price range filter - parse from string format "min-max"
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
