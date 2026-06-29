import supabase from "@/app/lib/supabase";

export interface MessageData {
  id?: string;
  sender: "user" | "agent";
  text: string;
  timestamp?: string | Date;
  user_id: string;
  agent_id: string;
}

export class MessageService {
  static async getMessages(userId: string): Promise<MessageData[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }

  static async createMessage(msg: MessageData): Promise<MessageData> {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender: msg.sender,
          text: msg.text,
          user_id: msg.user_id,
          agent_id: msg.agent_id,
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}
