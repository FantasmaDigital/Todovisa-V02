import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import supabase from "@/app/lib/supabase";
import { sendEmail } from "@/lib/emailService";
import { createViproPurchaseEmail } from "@/lib/emailTemplates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const dbClient = supabaseAdmin || supabase;

    let query = dbClient.from("user_purchases").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/purchases error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const purchaseData = await request.json();

    const { data, error } = await AgentRepository.createUserPurchase(purchaseData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger VIPRO purchase confirmation email if product_type is vipro
    if (purchaseData.product_type === 'vipro' && (purchaseData.email || purchaseData.user_email)) {
      const emailToUse = purchaseData.email || purchaseData.user_email;
      const clientName = purchaseData.user_name || purchaseData.first_name || "Cliente";
      const referenceId = purchaseData.reference_id || `TV-VIPRO-${Date.now().toString().slice(-6)}`;
      const amount = Number(purchaseData.amount || 19.99);

      sendEmail({
        to: emailToUse,
        subject: "🎉 Confirmación de Compra - Evaluación VIPRO TodoVisa",
        html: createViproPurchaseEmail(clientName, referenceId, amount),
      }).catch((e) => console.error("Error sending VIPRO purchase email:", e));
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/purchases error:", err);
    return NextResponse.json({ error: err.message || "Failed to record purchase" }, { status: 500 });
  }
}
