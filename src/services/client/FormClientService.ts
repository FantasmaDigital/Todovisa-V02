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

export class FormClientService {
  static async getPreformulario(userId: string) {
    const res = await fetch(`/api/forms/preformulario?userId=${encodeURIComponent(userId)}`);
    const result = await handleResponse(res);
    return result.data;
  }

  static async savePreformulario(payload: { userId: string; formData: Record<string, any>; currentStep?: number; isCompleted?: boolean }) {
    const res = await fetch("/api/forms/preformulario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  }

  static async getViproEvaluation(userId: string, evalId?: string) {
    const query = evalId ? `userId=${encodeURIComponent(userId)}&evalId=${encodeURIComponent(evalId)}` : `userId=${encodeURIComponent(userId)}`;
    const res = await fetch(`/api/forms/vipro?${query}`);
    const result = await handleResponse(res);
    return result.data;
  }

  static async saveViproEvaluation(evalData: Record<string, any>) {
    const res = await fetch("/api/forms/vipro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evalData),
    });
    return handleResponse(res);
  }
}
