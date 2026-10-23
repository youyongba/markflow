/**
 * 关系图谱 API 服务
 */

const getBaseUrl = () => {
  return '/v2.4/graph';
};

export const fetchGraphData = async (params = {}) => {
  try {
    const baseUrl = getBaseUrl();
    const query = new URLSearchParams();
    if (params.rootId) query.append('rootId', params.rootId);
    if (params.depth) query.append('depth', params.depth);
    const queryString = query.toString();
    const url = `${baseUrl}/data${queryString ? '?' + queryString : ''}`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch graph data:', error);
    throw error;
  }
};