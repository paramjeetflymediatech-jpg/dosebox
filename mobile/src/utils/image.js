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

  if (!parsedUri || typeof parsedUri !== 'string') return null;

  const baseUrl = API_URL.replace(/\/api\/?$/, '');

  // Normalize localhost / 127.0.0.1 addresses to device accessible baseUrl
  if (parsedUri.startsWith('http://localhost:3000') || parsedUri.startsWith('http://127.0.0.1:3000')) {
    parsedUri = parsedUri.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, baseUrl);
  }

  // Ensure uploads route via Next.js dynamic streaming endpoint /api/file/
  if (parsedUri.includes('/uploads/') && !parsedUri.includes('/api/file/')) {
    parsedUri = parsedUri.replace('/uploads/', '/api/file/uploads/');
  } else if (parsedUri.startsWith('uploads/')) {
    parsedUri = `/api/file/${parsedUri}`;
  }

  if (!parsedUri.startsWith('http')) {
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

  const baseUrl = API_URL.replace(/\/api\/?$/, '');

  return rawList
    .filter(item => item && typeof item === 'string' && item !== 'url' && item !== '[]' && item.trim() !== '')
    .map(item => {
      let trimmed = item.trim();
      if (trimmed.startsWith('http://localhost:3000') || trimmed.startsWith('http://127.0.0.1:3000')) {
        trimmed = trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, baseUrl);
      }
      if (trimmed.includes('/uploads/') && !trimmed.includes('/api/file/')) {
        trimmed = trimmed.replace('/uploads/', '/api/file/uploads/');
      } else if (trimmed.startsWith('uploads/')) {
        trimmed = `/api/file/${trimmed}`;
      }
      if (!trimmed.startsWith('http')) {
        const prefix = trimmed.startsWith('/') ? '' : '/';
        return `${baseUrl}${prefix}${trimmed}`;
      }
      return trimmed;
    });
};

