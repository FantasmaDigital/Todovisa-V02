import { getAuthHeaders } from "./AuthClientService";

async function handleResponse(res: Response) {
  let result: any = {};
  try {
    const text = await res.text();
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { error: res.status === 404 ? "Resource not found (404)" : `Server response error (${res.status})` };
  }
  if (!res.ok) {
    console.warn(`[SettingsClientService Error ${res.status}] URL: ${res.url} - Error:`, result.error || `HTTP ${res.status}`);
    if (res.status === 404) {
      return { data: null, error: "Resource not found (404)" };
    }
    throw new Error(result.error || `HTTP error ${res.status}`);
  }
  return result;
}

export class SettingsClientService {
  static async getSettings(): Promise<Record<string, string> | null> {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/settings", { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async updateSettings(settings: Record<string, string>) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers,
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  }
}
