async function handleResponse(res: Response) {
  let result: any = {};
  try {
    const text = await res.text();
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { error: `Server response error (${res.status})` };
  }
  if (!res.ok) throw new Error(result.error || `HTTP error ${res.status}`);
  return result;
}

export class AgentClientService {
  static async getAgents() {
    const res = await fetch("/api/agents");
    const result = await handleResponse(res);
    return result.data;
  }

  static async submitApplication(applicationData: Record<string, any>) {
    const res = await fetch("/api/agents/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(applicationData),
    });
    return handleResponse(res);
  }

  static async getPortalData(userId?: string) {
    const url = userId ? `/api/agents/portal?userId=${encodeURIComponent(userId)}` : "/api/agents/portal";
    const res = await fetch(url);
    const result = await handleResponse(res);
    return result.data;
  }

  static async updateApplication(payload: { id?: string; userId?: string; updates: Record<string, any> }) {
    const res = await fetch("/api/agents/portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  }

  static async createClientRequest(requestData: Record<string, any>) {
    const res = await fetch("/api/agents/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    return handleResponse(res);
  }

  static async createCommission(commissionData: Record<string, any>) {
    const res = await fetch("/api/agents/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commissionData),
    });
    return handleResponse(res);
  }

  static async getRequests() {
    const res = await fetch("/api/agents/requests");
    const result = await handleResponse(res);
    return result.data || result;
  }

  static async getAssignedClients(agentId: string) {
    const res = await fetch(`/api/agents/requests?agentId=${encodeURIComponent(agentId)}`);
    const result = await handleResponse(res);
    return result.data;
  }
}
