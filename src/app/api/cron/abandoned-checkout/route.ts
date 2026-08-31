import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/emailService";
import { createCheckoutAbandonmentReminderEmail } from "@/lib/emailTemplates";
import { getSystemConfig } from "@/app/constants/config";

/**
 * CRON API Route for Checkout Abandonment Tracking & Weekly Reminders.
 * 
 * Rules:
 * 1. Finds users who visited the payment modal (VIPRO or Full Service)
 * 2. Checks if they have NOT completed the purchase (has_paid_vipro / has_paid_advisor are false)
 * 3. Enforces 1 weekly reminder limit without duplicate emails or errors (7 days / 604,800,000 ms interval)
 * 4. Can be executed periodically by Cron-Job, GitHub Actions, Vercel Cron, or manually by Admin.
 */
export async function GET(request: Request) {
  try {
    const sysConfig = getSystemConfig();
    const viproPrice = sysConfig.viproPrice || 19.99;
    const fullServicePrice = sysConfig.fullServicePrice || 49.99;

    // Fetch users from Supabase Auth admin API
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error("[CRON Abandonment] Error listing users:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const users = usersData.users || [];
    const now = new Date();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    let processedCount = 0;
    let sentCount = 0;
    let skippedCount = 0;

    const results: Array<{ email: string; status: string; service?: string }> = [];

    for (const user of users) {
      processedCount++;
      const metadata = user.user_metadata || {};
      const userEmail = user.email;

      if (!userEmail) {
        skippedCount++;
        continue;
      }

      // Check payment status
      const hasPaidVipro = Boolean(metadata.has_paid_vipro);
      const hasPaidAdvisor = Boolean(metadata.has_paid_advisor);
      const lastCheckoutViewedAt = metadata.last_checkout_viewed_at;
      const lastCheckoutProduct = metadata.last_checkout_product || "vipro";

      // If user never visited checkout modal, skip
      if (!lastCheckoutViewedAt) {
        skippedCount++;
        continue;
      }

      // Determine if checkout is abandoned for target product
      const isViproAbandoned = lastCheckoutProduct === "vipro" && !hasPaidVipro;
      const isAdvisorAbandoned = lastCheckoutProduct === "advisor" && !hasPaidAdvisor;
      const isAbandoned = isViproAbandoned || isAdvisorAbandoned;

      // If already paid for target product, skip
      if (!isAbandoned) {
        skippedCount++;
        continue;
      }

      // Frequency Control: 1 weekly email (check last_abandonment_reminder_sent_at)
      const lastReminderSentAt = metadata.last_abandonment_reminder_sent_at;
      if (lastReminderSentAt) {
        const lastSentDate = new Date(lastReminderSentAt);
        const timeDiff = now.getTime() - lastSentDate.getTime();
        if (timeDiff < SEVEN_DAYS_MS) {
          // Less than 7 days have passed since last email
          skippedCount++;
          results.push({ email: userEmail, status: "skipped_recent_reminder_sent" });
          continue;
        }
      }

      // User qualifies for weekly reminder!
      const firstName = metadata.first_name || "";
      const lastName = metadata.last_name || "";
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      const emailHtml = createCheckoutAbandonmentReminderEmail(
        fullName,
        lastCheckoutProduct as "vipro" | "advisor",
        viproPrice,
        fullServicePrice
      );

      const emailSubject = lastCheckoutProduct === "vipro"
        ? "⌛ Tu Evaluación VIPRO en TodoVisa sigue reservada — Completa tu trámite"
        : "⌛ Tu Asesoría Consular Completa en TodoVisa te aguarda — Finaliza tu registro";

      try {
        await sendEmail({
          to: userEmail,
          subject: emailSubject,
          html: emailHtml
        });

        // Update user metadata with timestamp of sent reminder
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...metadata,
            last_abandonment_reminder_sent_at: now.toISOString(),
            abandonment_reminder_count: (metadata.abandonment_reminder_count || 0) + 1
          }
        });

        sentCount++;
        results.push({ email: userEmail, status: "email_sent", service: lastCheckoutProduct });
      } catch (sendErr: any) {
        console.error(`[CRON Abandonment] Failed to send email to ${userEmail}:`, sendErr);
        results.push({ email: userEmail, status: `error: ${sendErr.message || "Unknown error"}` });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        total_users_analyzed: processedCount,
        reminders_sent: sentCount,
        skipped: skippedCount
      },
      details: results
    }, { status: 200 });

  } catch (err: any) {
    console.error("[CRON Abandonment] Catch error:", err);
    return NextResponse.json({ error: err.message || "Error al procesar el algoritmo de seguimiento" }, { status: 500 });
  }
}
