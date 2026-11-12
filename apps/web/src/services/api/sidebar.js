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

// 递归拉取整棵树的所有节点（扁平化）
// 用于新建/重命名文档后的整树刷新，避免只刷新根节点导致已展开目录的子节点被清空
export const fetchFullTree = async () => {
  const rootRes = await fetchTreeNodes();
  if (rootRes.code !== 200 || !Array.isArray(rootRes.data)) return rootRes;

  const nodes = [...rootRes.data];
  const walk = async (folderNode) => {
    if (!folderNode.hasChildren) return;
    const res = await fetchTreeNodes(folderNode.id);
    if (res.code !== 200 || !Array.isArray(res.data)) return;
    nodes.push(...res.data);
    for (const child of res.data) {
      if (child.type === 'folder') {
        await walk(child);
      }
    }
  };

  for (const node of rootRes.data) {
    if (node.type === 'folder') {
      await walk(node);
    }
  }

  return { ...rootRes, data: nodes };
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
export const renameDocument = async (id, title) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/tree-nodes/document/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  return res.json();
};

export const deleteDocument = async (id) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/tree-nodes/document/${id}`;
  const res = await fetch(url, {
    method: 'DELETE'
  });
  return res.json();
};