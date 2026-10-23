const getBaseUrl = () => {
  return '/v2.4/sidebar';
};

export const fetchPreferences = async () => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/preferences`);
  return res.json();
};

export const updatePreferences = async (data) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const fetchTreeNodes = async (parentId) => {
  const baseUrl = getBaseUrl();
  const query = new URLSearchParams();
  if (parentId) query.append('parentId', parentId);
  const queryString = query.toString();
  const url = `${baseUrl}/tree-nodes${queryString ? '?' + queryString : ''}`;
  
  const res = await fetch(url);
  return res.json();
};

export const createFolder = async (data) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/tree-nodes/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const fetchBookmarks = async () => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/bookmarks`);
  return res.json();
};

// 6. 重命名目录
export const updateFolder = async (id, data) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/tree-nodes/folder/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

// 7. 删除目录
export const deleteFolder = async (id) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/tree-nodes/folder/${id}`;
  const res = await fetch(url, {
    method: 'DELETE'
  });
  return res.json();
};

// 8. 删除文档
export const deleteDocument = async (id) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/tree-nodes/document/${id}`;
  const res = await fetch(url, {
    method: 'DELETE'
  });
  return res.json();
};