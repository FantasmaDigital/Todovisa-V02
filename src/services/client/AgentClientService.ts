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
    console.warn(`[AgentClientService Error ${res.status}] URL: ${res.url} - Error:`, result.error || `HTTP ${res.status}`);
    if (res.status === 404) {
      return { data: null, error: "Resource not found (404)" };
    }
    throw new Error(result.error || `HTTP error ${res.status}`);
  }
  return result;
}

export class AgentClientService {
  static async getAgents() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/agents", { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async submitApplication(applicationData: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/agents/apply", {
      method: "POST",
      headers,
      body: JSON.stringify(applicationData),
    });
    return handleResponse(res);
  }

  static async getPortalData(userId?: string) {
    const headers = await getAuthHeaders();
    const url = userId ? `/api/agents/portal?userId=${encodeURIComponent(userId)}` : "/api/agents/portal";
    const res = await fetch(url, { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async updateApplication(payload: { id?: string; userId?: string; updates: Record<string, any> }) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/agents/portal", {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  }

  static async createClientRequest(requestData: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/agents/requests", {
      method: "POST",
      headers,
      body: JSON.stringify(requestData),
    });
    return handleResponse(res);
  }

  static async createCommission(commissionData: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/agents/commissions", {
      method: "POST",
      headers,
      body: JSON.stringify(commissionData),
    });
    return handleResponse(res);
  }

  static async getRequests() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/agents/requests", { headers });
    const result = await handleResponse(res);
    return result;
  }

  static async getAssignedClients(agentId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/agents/requests?agentId=${encodeURIComponent(agentId)}`, { headers });
    const result = await handleResponse(res);
    return result.data;
  }
}
