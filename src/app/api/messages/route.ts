import { NextRequest, NextResponse } from "next/server";
import { MessageService } from "@/app/service/MessageService";
import { HttpResponse } from "@/app/utils/http.response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      const errResp = await HttpResponse.error(400, "userId query parameter is required", {
        code: "MISSING_USER_ID",
        details: null,
        hint: "Provide ?userId=<id> in the request URL",
        message: "Missing userId query parameter",
      });
      return NextResponse.json(errResp, { status: 400 });
    }

    const data = await MessageService.getMessages(userId);
    const response = await HttpResponse.success(200, "Messages retrieved successfully", data);
    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    const errResp = await HttpResponse.error(400, "Error retrieving messages", {
      code: "GET_MESSAGES_ERROR",
      details: null,
      hint: err.message,
      message: err.message || "Failed to query database",
    });
    return NextResponse.json(errResp, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender, text, user_id, agent_id } = body;

    if (!sender || !text || !user_id || !agent_id) {
      const errResp = await HttpResponse.error(400, "Missing required parameters in body", {
        code: "MISSING_PARAMETERS",
        details: null,
        hint: "Ensure sender, text, user_id, and agent_id are present in the JSON body",
        message: "Required parameter missing",
      });
      return NextResponse.json(errResp, { status: 400 });
    }

    const data = await MessageService.createMessage({ sender, text, user_id, agent_id });
    const response = await HttpResponse.success(201, "Message created successfully", data);
    return NextResponse.json(response, { status: 201 });
  } catch (err: any) {
    const errResp = await HttpResponse.error(400, "Error creating message", {
      code: "CREATE_MESSAGE_ERROR",
      details: null,
      hint: err.message,
      message: err.message || "Failed to insert into database",
    });
    return NextResponse.json(errResp, { status: 400 });
  }
}
