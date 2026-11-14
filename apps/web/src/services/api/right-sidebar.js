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

// 5. 获取文档跟进记录（日期筛选 + 分页）
export const fetchActivities = async (documentId, { date = '', page = 1, pageSize = 10 } = {}, { signal } = {}) => {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (date) query.append('date', date);

  const res = await fetch(`${getBaseUrl()}/${documentId}/activities?${query.toString()}`, { signal });
  const result = await res.json();
  if (!res.ok || result.code !== 200) {
    throw new Error(result.message || '跟进记录加载失败');
  }
  return result;
};
