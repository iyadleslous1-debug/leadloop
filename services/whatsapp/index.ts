import { createAdminClient } from "@/lib/supabase/admin";
import { detectIntent, classifyLeadScore } from "@/services/ai/intent";
import { findBestMatches } from "@/services/ai/matching";
import { generateAIReply, detectIntentWithAI } from "@/services/ai/gemini";
import { createNotification } from "@/services/notifications";
import { scheduleDefaultFollowUps } from "@/services/follow-ups";
import type { Message } from "@/types/conversation";

export async function sendWhatsAppMessage(to: string, text: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.log("[WhatsApp] No Twilio credentials configured. Would send:", text);
    return;
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      body: text,
    });
    console.log("[WhatsApp] Sent via Twilio, SID:", message.sid);
  } catch (err) {
    console.error("[WhatsApp] Twilio error:", err);
  }
}

async function findOrCreateConversation(
  phone: string,
  contactName: string | undefined,
  ownerId?: string
) {
  const admin = createAdminClient();

  let { data } = await admin
    .from("conversations")
    .select("*")
    .eq("phone", phone)
    .single();

  if (!data) {
    console.log("[CONVERSATION] Creating new conversation for", phone, "owner:", ownerId || "unknown");
    const { data: newConv, error } = await admin
      .from("conversations")
      .insert({
        phone,
        contact_name: contactName || null,
        owner_id: ownerId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[CONVERSATION] Create error:", error);
      throw error;
    }
    data = newConv;
  } else {
    console.log("[CONVERSATION] Found existing:", data.id);
  }

  return data;
}

export async function processIncomingMessage(
  phone: string,
  contactName: string | undefined,
  text: string,
  ownerId?: string
) {
  console.log("\n==========================================");
  console.log("[PIPELINE] === INCOMING MESSAGE ===");
  console.log("[PIPELINE] From:", phone, "Name:", contactName || "N/A");
  console.log("[PIPELINE] Text:", text);
  console.log("[PIPELINE] Provided ownerId:", ownerId || "not set (webhook mode)");

  const admin = createAdminClient();

  // Step 1: Find or create conversation
  console.log("\n[STEP 1] Finding/creating conversation...");
  const conversation = await findOrCreateConversation(phone, contactName, ownerId);
  console.log("[STEP 1] Conversation ID:", conversation.id);
  console.log("[STEP 1] AI active:", conversation.ai_active);

  // Store the incoming message
  console.log("\n[STEP 2] Storing incoming message...");
  const { data: storedMsg, error: msgError } = await admin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      role: "user",
      content: text,
      metadata: {},
    })
    .select()
    .single();
  if (msgError) {
    console.error("[STEP 2] Error storing message:", msgError);
    throw msgError;
  }
  console.log("[STEP 2] Message stored:", storedMsg.id);

  // If AI is off (owner took over), store message only — no reply
  if (!conversation.ai_active) {
    console.log("[PIPELINE] AI is off — owner is handling. No reply sent.");
    await admin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    return {
      conversationId: conversation.id,
      reply: null,
      leadCreated: false,
      leadId: null,
      leadStatus: null,
      matchesFound: 0,
      aiHandled: false,
    };
  }

  // Step 3: Run intent detection (Gemini AI first, fallback to rule-based)
  console.log("\n[STEP 3] Detecting intent...");
  const geminiIntent = await detectIntentWithAI(text);
  let intent;
  if (geminiIntent) {
    console.log("[STEP 3] Using Gemini AI intent detection");
    intent = geminiIntent;
  } else {
    console.log("[STEP 3] Falling back to rule-based intent detection");
    intent = detectIntent(text);
  }
  console.log("[STEP 3] Intent score:", intent.score);
  console.log("[STEP 3] Intent summary:", intent.summary);
  console.log("[STEP 3] Budget:", intent.budget ? `${intent.budget.min} - ${intent.budget.max}` : "none");
  console.log("[STEP 3] Location:", intent.location || "none");
  console.log("[STEP 3] Property type:", intent.propertyType || "none");

  // Step 4: Run property matching
  console.log("\n[STEP 4] Matching properties...");
  const matches = await findBestMatches(intent, 3, admin);
  console.log("[STEP 4] Matches found:", matches.length);
  matches.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.property.title} ($${m.property.price.toLocaleString()}) - ${m.property.city}`);
  });

  // Step 5: Generate AI reply (Gemini first, fallback to template)
  console.log("\n[STEP 5] Generating AI reply...");
  const matchedPropertyData = matches.map((m) => ({
    title: m.property.title,
    price: m.property.price,
    city: m.property.city,
    location: m.property.location,
    type: m.property.type,
  }));
  const reply = await generateAIReply(
    contactName || phone,
    text,
    matchedPropertyData,
    intent.summary
  );
  console.log("[STEP 5] Reply:", reply);

  // Step 6: Determine lead status
  const leadStatus = classifyLeadScore(intent);
  console.log("\n[STEP 6] Lead classification:", leadStatus, "(score:", intent.score, ")");

  let leadId: string | null = null;
  const score = intent.score;

  if (score >= 0.3) {
    console.log("\n[STEP 7] Creating lead (score >= 0.3)...");

    // Determine owner: use provided one, or derive from matched property
    let resolvedOwnerId = ownerId;
    if (!resolvedOwnerId && matches[0]?.property) {
      console.log("[STEP 7] No ownerId provided, deriving from matched property...");
      const { data: prop } = await admin
        .from("properties")
        .select("owner_id")
        .eq("id", matches[0].property.id)
        .single();
      resolvedOwnerId = prop?.owner_id;
      console.log("[STEP 7] Derived ownerId:", resolvedOwnerId || "none");
    }

    // Create lead
    const { data: lead, error: leadError } = await admin
      .from("leads")
      .insert({
        name: contactName || phone,
        phone,
        user_id: resolvedOwnerId || "00000000-0000-0000-0000-000000000000",
        status: leadStatus,
        source: "whatsapp",
        notes: `WhatsApp: ${intent.summary}\nMessage: ${text}`,
        property_id: matches[0]?.property?.id || null,
      })
      .select()
      .single();

    if (leadError) {
      console.error("[STEP 7] Lead creation error:", leadError);
    } else {
      leadId = lead.id;
      console.log("[STEP 7] Lead created:", leadId, "status:", leadStatus);

      // Step 7b: Update conversation with lead + property info
      console.log("\n[STEP 7b] Updating conversation with lead/property info...");
      const { error: updateConvErr } = await admin
        .from("conversations")
        .update({
          lead_id: lead.id,
          property_id: matches[0]?.property?.id || null,
          owner_id: resolvedOwnerId || conversation.owner_id,
          intent: intent.summary,
          intent_score: score,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);

      if (updateConvErr) {
        console.error("[STEP 7b] Conversation update error:", updateConvErr);
      } else {
        console.log("[STEP 7b] Conversation updated");
      }

      // Step 8: Create notification
      console.log("\n[STEP 8] Creating notification...");
      if (resolvedOwnerId) {
        const type = leadStatus === "hot" ? "lead_hot" : "lead_warm";
        const statusEmoji = leadStatus === "hot" ? "🔥" : "⭐";
        try {
          await createNotification(
            resolvedOwnerId,
            `${statusEmoji} ${leadStatus.toUpperCase()} Lead from ${contactName || phone}`,
            intent.summary,
            type as "lead_hot" | "lead_warm",
            "/dashboard/leads"
          );
          console.log("[STEP 8] Notification created for owner:", resolvedOwnerId);
        } catch (notifErr) {
          console.error("[STEP 8] Notification error:", notifErr);
        }
      } else {
        console.log("[STEP 8] No ownerId, skipping notification");
      }

      // Step 9: Schedule follow-ups
      if (leadStatus === "hot") {
        console.log("\n[STEP 9] Scheduling follow-ups (HOT lead)...");
        try {
          await scheduleDefaultFollowUps(lead.id);
          console.log("[STEP 9] Follow-ups scheduled");
        } catch (fuErr) {
          console.error("[STEP 9] Follow-up error:", fuErr);
        }
      } else {
        console.log("[STEP 9] Skipping follow-ups (not HOT)");
      }
    }
  } else {
    console.log("\n[STEP 7-9] Skipped (score < 0.3, no lead created)");
  }

  // Step 10: Store assistant reply
  console.log("\n[STEP 10] Storing assistant reply...");
  const { error: replyError } = await admin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: reply,
      metadata: {
        intent_score: score,
        lead_created: !!leadId,
        matches_found: matches.length,
      },
    });

  if (replyError) {
    console.error("[STEP 10] Reply store error:", replyError);
  } else {
    console.log("[STEP 10] Reply stored");
  }

  // Step 11: Update conversation last_message_at
  console.log("\n[STEP 11] Updating conversation timestamp...");
  const { error: tsError } = await admin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversation.id);

  if (tsError) {
    console.error("[STEP 11] Timestamp error:", tsError);
  }

  // Step 12: Send WhatsApp message
  console.log("\n[STEP 12] Sending WhatsApp message...");
  await sendWhatsAppMessage(phone, reply);
  console.log("[STEP 12] Message sent (or simulated)");

  console.log("\n==========================================");
  console.log("[PIPELINE] === COMPLETE ===");
  console.log("  Conversation:", conversation.id);
  console.log("  Lead created:", !!leadId);
  console.log("  Lead status:", leadStatus);
  console.log("  Matches found:", matches.length);
  console.log("==========================================\n");

  return {
    conversationId: conversation.id,
    reply,
    leadCreated: !!leadId,
    leadId,
    leadStatus,
    matchesFound: matches.length,
  };
}
