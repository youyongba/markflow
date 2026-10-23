const getBaseUrl = () => {
  return '/v2.4/document-properties';
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
  const query = new URLSearchParams();
  if (limit) query.append('limit', limit);
  const queryString = query.toString();
  const url = `${baseUrl}/${documentId}/commits${queryString ? '?' + queryString : ''}`;
  const res = await fetch(url);
  return res.json();
};
