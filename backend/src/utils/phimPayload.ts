import ApiError from './ApiError';

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export const ensurePhimSuccess = <T>(payload: unknown): T => {
  const record = asRecord(payload);
  if (!payload || record.success === false || record.status === false ||
      (typeof record.status === 'string' && record.status !== 'success')) {
    throw new ApiError(502, String(record.msg || record.message || 'Invalid response from PhimAPI'));
  }
  return payload as T;
};

export const unwrapPhimData = (payload: unknown): Record<string, unknown> => {
  const record = asRecord(ensurePhimSuccess(payload));
  return record.data && typeof record.data === 'object' ? asRecord(record.data) : record;
};

// These endpoints have returned both plain arrays and catalog-style envelopes.
export const normalizePhimTaxonomy = (payload: unknown) => {
  ensurePhimSuccess(payload);
  const items = Array.isArray(payload) ? payload : unwrapPhimData(payload).items;
  if (!Array.isArray(items)) throw new ApiError(502, 'Invalid category or country list from PhimAPI');
  return items.map(asRecord).filter(item => typeof item.name === 'string' && typeof item.slug === 'string')
    .map(item => ({ ...item, name: item.name as string, slug: item.slug as string }));
};

export const parsePhimYear = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (!/^\d{4}(,\d{4})?$/.test(value)) throw new ApiError(400, 'Year must be YYYY or YYYY,YYYY');
  const years = value.split(',').map(Number);
  if (years.some(year => year < 1800 || year > 2200) || (years.length === 2 && years[0] > years[1])) {
    throw new ApiError(400, 'Invalid year range');
  }
  return value;
};

export const normalizePhimExtras = (imagesPayload: unknown, peoplePayload: unknown, keywordsPayload: unknown, language = 'vi') => {
  const images = unwrapPhimData(imagesPayload);
  const people = unwrapPhimData(peoplePayload);
  const keywords = unwrapPhimData(keywordsPayload);
  const imageList = Array.isArray(images.images) ? images.images.map(asRecord) : [];
  const peopleList = Array.isArray(people.peoples) ? people.peoples.map(asRecord) : [];
  const keywordList = Array.isArray(keywords.keywords) ? keywords.keywords : [];
  return {
    images: {
      id: Number(images.tmdb_id) || 0,
      logos: [],
      backdrops: imageList.filter(image => image.type === 'backdrop' && typeof image.file_path === 'string'),
      posters: imageList.filter(image => image.type === 'poster' && typeof image.file_path === 'string'),
    },
    cast: peopleList.filter(person => person.name && person.department !== 'Directing' && person.known_for_department !== 'Directing')
      .map((person, index) => ({
        id: Number(person.tmdb_people_id || person.tmdb_id || person.id) || index + 1,
        name: String(person.name), character: String(person.character || ''),
        profile_path: typeof person.profile_path === 'string' ? person.profile_path : null, order: index,
      })),
    keywords: [...new Set(keywordList.map(keyword => {
      if (typeof keyword === 'string') return keyword;
      const item = asRecord(keyword);
      return String(language.toLowerCase().startsWith('vi')
        ? item.name_vn || item.name || ''
        : item.name_en || item.name || '');
    }).filter(Boolean))],
  };
};
