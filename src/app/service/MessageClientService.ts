export interface ClientMessageData {
  id?: string;
  sender: "user" | "agent";
  text: string;
  timestamp?: string | Date;
  user_id: string;
  agent_id: string;
}

export class MessageClientService {
  static async getMessages(userId: string): Promise<ClientMessageData[]> {
    const res = await fetch(`/api/messages?userId=${encodeURIComponent(userId)}`);
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || result.message || "Failed to fetch messages");
    }
    return result.data || [];
  }

  static async createMessage(msg: {
    sender: "user" | "agent";
    text: string;
    user_id: string;
    agent_id: string;
  }): Promise<ClientMessageData> {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error?.message || result.message || "Failed to send message");
    }
    return result.data;
  }
}
