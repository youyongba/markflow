const getBaseUrl = () => {
  return '/v2.4/header';
};

export const fetchContext = async (documentId) => {
  const baseUrl = getBaseUrl();
  const query = new URLSearchParams();
  if (documentId) query.append('documentId', documentId);
  const queryString = query.toString();
  const url = `${baseUrl}/context${queryString ? '?' + queryString : ''}`;
  const res = await fetch(url);
  return res.json();
};

export const fetchUserProfile = async () => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/user-profile`);
  return res.json();
};

export const createShareLink = async (data) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/share-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const createDocument = async (data) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const createApiTemplateDocument = async (data) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/document/api-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const searchGlobal = async (keyword, type = 'all', limit = 10) => {
  const baseUrl = getBaseUrl();
  const query = new URLSearchParams();
  if (keyword) query.append('keyword', keyword);
  if (type) query.append('type', type);
  if (limit) query.append('limit', limit);
  const queryString = query.toString();
  const url = `${baseUrl}/search${queryString ? '?' + queryString : ''}`;
  const res = await fetch(url);
  return res.json();
};
