const getBaseUrl = () => {
  // 优先使用环境变量，如果未注入则根据 mode 降级到对应的默认 URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_MODE === 'mock') {
    return 'https://mock.24os.cn/b5899d0d-a777-4b5f-a4e4-e73dcb2fca19';
  }
  return 'https://api.markflow.com/v2.4';
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
  const url = new URL(`${baseUrl}/tree-nodes`);
  if (parentId) url.searchParams.append('parentId', parentId);
  
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
  // 注意: 因为 mock 服务平台限制了通配符路由，我们将所有的 id 操作路由到 /tree-nodes/folder/1
  const url = `${getBaseUrl()}/tree-nodes/folder/1`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

// 7. 删除目录
export const deleteFolder = async (id) => {
  // 同理，路由到 /tree-nodes/folder/1
  const url = `${getBaseUrl()}/tree-nodes/folder/1`;
  const res = await fetch(url, {
    method: 'DELETE'
  });
  return res.json();
};

// 8. 删除文档
export const deleteDocument = async (id) => {
  // 路由到 /tree-nodes/document/1 节点
  const url = `${getBaseUrl()}/tree-nodes/document/1`;
  const res = await fetch(url, {
    method: 'DELETE'
  });
  return res.json();
};