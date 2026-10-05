const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_MODE === 'mock') {
    return 'https://mock.24os.cn/b5899d0d-a777-4b5f-a4e4-e73dcb2fca19';
  }
  return 'https://api.markflow.com/v2.4';
};

export const fetchContext = async (documentId) => {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}/context`);
  if (documentId) url.searchParams.append('documentId', documentId);
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

export const searchGlobal = async (keyword, type = 'all', limit = 10) => {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.append('keyword', keyword);
  url.searchParams.append('type', type);
  url.searchParams.append('limit', limit);
  const res = await fetch(url);
  return res.json();
};
