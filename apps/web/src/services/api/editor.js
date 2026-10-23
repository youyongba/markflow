export const getBaseUrl = () => {
  return '/v2.4/editor';
};

/**
 * 1. 获取文档正文内容
 * GET /{documentId}/content
 */
export const fetchContent = async (documentId) => {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/${documentId}/content`);
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error('fetchContent error:', error);
    throw error;
  }
};

/**
 * 2. 自动备份/保存文档正文
 * PUT /{documentId}/content
 */
export const saveContent = async (documentId, source) => {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/${documentId}/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source })
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error('saveContent error:', error);
    throw error;
  }
};

/**
 * 3. 请求 AI 智能润色建议
 * POST /ai/polish
 */
export const fetchAiPolish = async (documentId, originalText, mode = 'enhance_semantic') => {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/ai/polish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId, originalText, mode })
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error('fetchAiPolish error:', error);
    throw error;
  }
};

/**
 * 4. 导出文档
 * POST /{documentId}/export
 */
export const exportDocument = async (documentId, format = 'pdf', includeFrontmatter = false) => {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/${documentId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ format, includeFrontmatter })
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error('exportDocument error:', error);
    throw error;
  }
};