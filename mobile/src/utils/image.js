import { API_URL } from '../config/env';

export const getFullImageUrl = (imgUri) => {
  if (!imgUri) return null;
  
  let parsedUri = imgUri;
  if (Array.isArray(imgUri)) {
    parsedUri = imgUri.length > 0 ? imgUri[0] : null;
  } else {
    try {
      if (typeof imgUri === 'string' && imgUri.startsWith('[')) {
        const parsed = JSON.parse(imgUri);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedUri = parsed[0];
        } else {
          parsedUri = null;
        }
      }
    } catch(e) {}
  }

  // Filter out invalid strings that are not real paths
  if (parsedUri === 'url' || parsedUri === '[]' || parsedUri === '') {
    parsedUri = null;
  }

  if (parsedUri && typeof parsedUri === 'string' && !parsedUri.startsWith('http')) {
    const baseUrl = API_URL.replace('/api', '');
    const prefix = parsedUri.startsWith('/') ? '' : '/';
    return `${baseUrl}${prefix}${parsedUri}`;
  }
  return parsedUri || null;
};

export const getAllImageUrls = (imgData) => {
  if (!imgData) return [];

  let rawList = [];
  if (Array.isArray(imgData)) {
    rawList = imgData;
  } else if (typeof imgData === 'string') {
    const trimmed = imgData.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed;
        }
      } catch (e) {}
    } else if (trimmed && trimmed !== 'url' && trimmed !== '[]') {
      rawList = [trimmed];
    }
  }

  const baseUrl = API_URL.replace('/api', '');

  return rawList
    .filter(item => item && typeof item === 'string' && item !== 'url' && item !== '[]' && item.trim() !== '')
    .map(item => {
      const trimmed = item.trim();
      if (!trimmed.startsWith('http')) {
        const prefix = trimmed.startsWith('/') ? '' : '/';
        return `${baseUrl}${prefix}${trimmed}`;
      }
      return trimmed;
    });
};

