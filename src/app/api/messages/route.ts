import { MessageRepository } from "@/lib/repositories/message.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const agentId = searchParams.get("agentId");

    if (!userId && !agentId) {
      return NextResponse.json({ error: { message: "userId or agentId parameter is required" } }, { status: 400 });
    }

    let messages;
    if (agentId) {
      messages = await MessageRepository.getMessagesByAgentId(agentId);
    } else {
      messages = await MessageRepository.getMessagesByUserId(userId!);
    }
    return NextResponse.json({ data: messages }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message || "Failed to fetch messages" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, text, user_id, agent_id } = body;

    if (!sender || !text || !user_id || !agent_id) {
      return NextResponse.json({ error: { message: "Missing required fields" } }, { status: 400 });
    }

    const newMessage = await MessageRepository.createMessage({
      sender,
      text,
      user_id,
      agent_id,
    });

    return NextResponse.json({ data: newMessage }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message || "Failed to create message" } }, { status: 500 });
  }
}
