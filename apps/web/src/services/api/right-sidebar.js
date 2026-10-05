const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_MODE === 'mock') {
    return 'https://mock.24os.cn/b5899d0d-a777-4b5f-a4e4-e73dcb2fca19';
  }
  return 'https://api.markflow.com/v2.4/document-properties';
};

// 1. 获取文档基础属性
export const fetchDocProperties = async (documentId) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/${documentId}`);
  return res.json();
};

// 2. 更新文档基础属性
export const updateDocProperties = async (documentId, data) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/${documentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

// 3. 获取关联前置文档
export const fetchDependencies = async (documentId) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/${documentId}/dependencies`);
  return res.json();
};

// 4. 获取 GIT 版本归档日志
export const fetchCommits = async (documentId, limit = 5) => {
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}/${documentId}/commits`);
  url.searchParams.append('limit', limit);
  const res = await fetch(url);
  return res.json();
};
