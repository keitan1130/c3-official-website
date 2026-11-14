export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getApiUrl = (path: string): string => {
  if (!API_BASE_URL) throw new Error("APIの接続先が設定されていません。");
  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
};
