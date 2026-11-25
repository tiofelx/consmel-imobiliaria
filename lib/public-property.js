// Visão pública de um imóvel: sem endereço completo e com coordenadas aproximadas.
function toPublicCoordinate(value) {
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(3));
}

function buildLocationLabel(property) {
    const cityState = [property.city, property.state].filter(Boolean).join(' - ');
    return [property.neighborhood, cityState].filter(Boolean).join(', ');
}

export function toPublicProperty(property) {
    return {
        id: property.id,
        title: property.title,
        description: property.description,
        transactionType: property.transactionType,
        category: property.category,
        type: property.category,
        price: property.price,
        condoFee: property.condoFee,
        iptu: property.iptu,
        bedrooms: property.bedrooms,
        suites: property.suites,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        usableArea: property.usableArea,
        totalArea: property.totalArea,
        area: property.usableArea || property.totalArea,
        features: property.features,
        neighborhood: property.neighborhood,
        city: property.city,
        state: property.state,
        location: buildLocationLabel(property),
        image: property.images?.[0]?.url || null,
        images: property.images,
        videos: property.videos || [],
        lat: toPublicCoordinate(property.latitude),
        lng: toPublicCoordinate(property.longitude),
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
    };
}
