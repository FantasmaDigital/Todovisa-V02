import supabase from "@/app/lib/supabase";

export interface MessageRecord {
  id?: string;
  sender: "user" | "agent";
  text: string;
  timestamp?: string | Date;
  user_id: string;
  agent_id: string;
}

export class MessageRepository {
  static async getMessagesByUserId(userId: string): Promise<MessageRecord[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getMessagesByAgentId(agentId: string): Promise<MessageRecord[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("agent_id", agentId)
      .order("timestamp", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async createMessage(msg: MessageRecord): Promise<MessageRecord> {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender: msg.sender,
          text: msg.text,
          user_id: msg.user_id,
          agent_id: msg.agent_id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
