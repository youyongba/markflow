/**
 * 关系图谱 API 服务
 */

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_MODE === 'mock') {
    return 'https://mock.24os.cn/b5899d0d-a777-4b5f-a4e4-e73dcb2fca19';
  }
  return 'https://api.markflow.com/v2.4/graph';
};

export const fetchGraphData = async (params = {}) => {
  try {
    const baseUrl = getBaseUrl();
    const url = new URL(`${baseUrl}/data`);
    
    if (params.rootId) url.searchParams.append('rootId', params.rootId);
    if (params.depth) url.searchParams.append('depth', params.depth);

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