import { NextResponse } from 'next/server';

const MAX_DELTA = 0.25;
const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6/map';

function parseAttributes(input) {
  const attributes = {};
  const attributePattern = /([A-Za-z_:][\w:.-]*)="([^"]*)"/g;

  for (const match of input.matchAll(attributePattern)) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

function parseTags(input) {
  const tags = {};
  const tagPattern = /<tag\b([^>]*)\/>/g;

  for (const match of input.matchAll(tagPattern)) {
    const attrs = parseAttributes(match[1]);
    if (attrs.k) {
      tags[attrs.k] = attrs.v || '';
    }
  }

  return tags;
}

function detectFeatureKind(tags, isClosed) {
  if (tags.building) return isClosed ? 'building' : 'outline';
  if (tags.natural === 'water' || tags.waterway || tags.landuse === 'reservoir') return 'water';
  if (tags.leisure === 'park' || tags.landuse === 'grass' || tags.landuse === 'forest') return 'green';
  if (tags.highway) return 'road';
  return isClosed ? 'area' : 'path';
}

function parseOsmResponse(xml) {
  const nodes = new Map();
  const nodePattern = /<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g;
  const wayPattern = /<way\b([^>]*)>([\s\S]*?)<\/way>/g;
  const ndPattern = /<nd\b([^>]*)\/>/g;
  const features = [];

  for (const match of xml.matchAll(nodePattern)) {
    const attrs = parseAttributes(match[1]);
    const lat = Number(attrs.lat);
    const lon = Number(attrs.lon);

    if (attrs.id && Number.isFinite(lat) && Number.isFinite(lon)) {
      nodes.set(attrs.id, { lat, lon });
    }
  }

  for (const match of xml.matchAll(wayPattern)) {
    const wayAttrs = parseAttributes(match[1]);
    const body = match[2];
    const refs = [];

    for (const ndMatch of body.matchAll(ndPattern)) {
      const attrs = parseAttributes(ndMatch[1]);
      if (attrs.ref) {
        refs.push(attrs.ref);
      }
    }

    const points = refs.map((ref) => nodes.get(ref)).filter(Boolean);
    if (points.length < 2) {
      continue;
    }

    const isClosed = refs.length > 2 && refs[0] === refs[refs.length - 1];
    const tags = parseTags(body);

    features.push({
      id: wayAttrs.id || 'feature-' + features.length,
      kind: detectFeatureKind(tags, isClosed),
      closed: isClosed,
      points,
    });
  }

  return features;
}

function toBbox(searchParams) {
  const left = Number(searchParams.get('left'));
  const bottom = Number(searchParams.get('bottom'));
  const right = Number(searchParams.get('right'));
  const top = Number(searchParams.get('top'));

  if (![left, bottom, right, top].every(Number.isFinite)) {
    return null;
  }

  if (left >= right || bottom >= top) {
    return null;
  }

  if ((right - left) > MAX_DELTA || (top - bottom) > MAX_DELTA) {
    return null;
  }

  return { left, bottom, right, top };
}

export async function GET(request) {
  const bbox = toBbox(request.nextUrl.searchParams);

  if (!bbox) {
    return NextResponse.json({ error: 'Bounding box invalido.' }, { status: 400 });
  }

  const bboxParam = `${bbox.left},${bbox.bottom},${bbox.right},${bbox.top}`;

  try {
    const response = await fetch(`${OSM_API_BASE}?bbox=${bboxParam}`, {
      headers: {
        Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'consmel-smart-filter/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Falha ao carregar dados do OpenStreetMap.', status: response.status },
        { status: response.status }
      );
    }

    const xml = await response.text();
    const features = parseOsmResponse(xml);

    return NextResponse.json({ bbox, features });
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao consultar OpenStreetMap.', detail: error.message },
      { status: 502 }
    );
  }
}
