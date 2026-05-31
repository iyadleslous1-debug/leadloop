import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectIntent } from "@/services/ai/intent";
import { findBestMatches } from "@/services/ai/matching";
import { generateAIReply, detectIntentWithAI, type AIUsage } from "@/services/ai/groq";
import { logAIUsage, estimateCost } from "@/services/ai/usage";
import { createNotification } from "@/services/notifications";
import { scheduleDefaultFollowUps } from "@/services/follow-ups";
import { createBooking, detectBookingIntent } from "@/services/bookings";
import { calculateLeadScore, scoreToStatus } from "@/services/leads/scoring";
import { extractPreferences } from "@/services/leads/preferences";
import { enqueueFailedDelivery } from "@/lib/delivery-queue";
import type { Property } from "@/types/property";

interface TwilioCreds {
  accountSid: string;
  authToken: string;
  from: string;
}

export async function loadTwilioCreds(userId?: string): Promise<TwilioCreds | null> {
  if (userId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("integrations")
      .select("twilio_account_sid, twilio_auth_token, twilio_whatsapp_from")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.twilio_account_sid && data?.twilio_auth_token && data?.twilio_whatsapp_from) {
      return {
        accountSid: data.twilio_account_sid,
        authToken: data.twilio_auth_token,
        from: data.twilio_whatsapp_from,
      };
    }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (accountSid && authToken && from) {
    return { accountSid, authToken, from };
  }

  return null;
}

export async function sendWhatsAppMessage(
  to: string,
  text: string,
  userId?: string,
  conversationId?: string,
  mediaUrls?: string[]
) {
  const creds = await loadTwilioCreds(userId);

  if (!creds) {
    console.error("[WhatsApp] No Twilio creds available");
    return;
  }

  const admin = createAdminClient();
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  const statusCallback = vercelUrl
    ? `https://${vercelUrl}/api/whatsapp/status`
    : process.env.TWILIO_STATUS_CALLBACK_URL;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const client = twilio(creds.accountSid, creds.authToken);

      const msgOpts: any = {
        from: `whatsapp:${creds.from}`,
        to: `whatsapp:${to}`,
        body: text,
      };

      if (mediaUrls && mediaUrls.length > 0) {
        msgOpts.mediaUrl = mediaUrls;
      }

      if (statusCallback) {
        msgOpts.statusCallback = statusCallback;
      }

      const message = await client.messages.create(msgOpts);
      console.log("[WhatsApp] Sent via Twilio, SID:", message.sid);

      if (conversationId) {
        await admin.from("delivery_logs").insert({
          message_sid: message.sid,
          conversation_id: conversationId,
          status: "sent",
          to_phone: to,
        });
      }

      return message.sid;
    } catch (err) {
      console.error(`[WhatsApp] Twilio send error (attempt ${attempt}/3):`, err);

      if (attempt === 3) {
        await enqueueFailedDelivery({
          toPhone: to,
          messageText: text,
          conversationId,
          ownerId: userId,
          error: String(err),
        });
        console.error("[WhatsApp] All retries exhausted, enqueued to DLQ");
      } else {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
}

async function findOrCreateConversation(
  phone: string,
  contactName: string | undefined,
  ownerId?: string
) {
  const admin = createAdminClient();

  let query = admin
    .from("conversations")
    .select("*")
    .eq("phone", phone);

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const result = await query.maybeSingle();
  let data = result.data;

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

  const aiActive = conversation.ai_active !== false;

  if (!aiActive) {
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

  // Step 2: Store incoming user message
  console.log("\n[STEP 2] Storing user message...");
  await admin.from("messages").insert({
    conversation_id: conversation.id,
    role: "user",
    content: text,
    metadata: {},
  });

  // Step 3: Run intent detection (AI first, fallback to rule-based)
  console.log("\n[STEP 3] Detecting intent...");

  const totalUsage: AIUsage[] = [];
  const trackUsage = (usage: AIUsage) => { totalUsage.push(usage); };

  const aiIntent = await detectIntentWithAI(text, trackUsage);
  let intent;
  if (aiIntent) {
    console.log("[STEP 3] Using AI intent detection");
    intent = aiIntent;
  } else {
    console.log("[STEP 3] Falling back to rule-based intent detection");
    intent = detectIntent(text);
  }
  console.log("[STEP 3] Intent score:", intent.score);
  console.log("[STEP 3] Intent summary:", intent.summary);
  console.log("[STEP 3] Budget:", intent.budget ? `${intent.budget.min} - ${intent.budget.max}` : "none");
  console.log("[STEP 3] Location:", intent.location || "none");
  console.log("[STEP 3] Property type:", intent.propertyType || "none");

  const CONFIDENCE_THRESHOLD = 0.3;

  // Step 4: Run property matching (exclude already-viewed properties)
  console.log("\n[STEP 4] Matching properties...");
  let viewedPropertyIds: string[] = [];
  if (conversation.lead_id) {
    const { data: existingLead } = await admin
      .from("leads")
      .select("viewed_properties")
      .eq("id", conversation.lead_id)
      .single();
    if (existingLead?.viewed_properties) {
      viewedPropertyIds = existingLead.viewed_properties as string[];
    }
  }

  let matches: { property: Property; score: number; reasons: string[] }[] = [];
  let matchedPropertyData: { title: string; price: number; city: string; location: string; type: string }[] = [];
  let lowConfidence = intent.score < CONFIDENCE_THRESHOLD;

  if (!lowConfidence) {
    matches = await findBestMatches(intent, 3, admin, undefined, viewedPropertyIds);
    console.log("[STEP 4] Matches found:", matches.length);
    matches.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.property.title} ($${m.property.price.toLocaleString()}) - ${m.property.city}`);
    });
    matchedPropertyData = matches.map((m) => ({
      title: m.property.title,
      price: m.property.price,
      city: m.property.city,
      location: m.property.location,
      type: m.property.type,
    }));
  } else {
    console.log("[STEP 4] Skipped (low confidence)");
  }

  // Step 5: Generate AI reply with memory + language
  console.log("\n[STEP 5] Generating AI reply...");

  // Resolve owner to load custom AI instructions
  let instructionOwnerId = ownerId || conversation.owner_id;
  if (!instructionOwnerId && matches[0]?.property) {
    const { data: prop } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", matches[0].property.id)
      .single();
    instructionOwnerId = prop?.owner_id;
  }

  let systemPrompt: string | undefined;
  if (instructionOwnerId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("ai_instructions")
      .eq("id", instructionOwnerId)
      .single();
    if (profile?.ai_instructions) {
      systemPrompt = `You follow these instructions from the agency owner: ${profile.ai_instructions}`;
    }
  }

  // Fetch ALL conversation history for full AI memory
  const { data: allMessages } = await admin
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false });

  const history = (allMessages || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(0, 30)
    .map((m) => ({ role: m.role, content: m.content }));

  // Load lead preferences if a lead already exists for this conversation
  let buyerPrefs: string | undefined;
  if (conversation.lead_id) {
    const { data: lead } = await admin
      .from("leads")
      .select("preferences")
      .eq("id", conversation.lead_id)
      .single();
    if (lead?.preferences) {
      const p = lead.preferences as Record<string, unknown>;
      const parts: string[] = [];
      if (p.budgetMin || p.budgetMax) parts.push(`Budget: $${String(p.budgetMin || "?")} - $${String(p.budgetMax || "?")}`);
      const cities = Array.isArray(p.cities) ? (p.cities as string[]).join(", ") : "";
      if (cities) parts.push(`Cities: ${cities}`);
      const types = Array.isArray(p.propertyTypes) ? (p.propertyTypes as string[]).join(", ") : "";
      if (types) parts.push(`Types: ${types}`);
      if (p.bedrooms) parts.push(`Bedrooms: ${String(p.bedrooms)}`);
      if (p.purchaseTimeline) parts.push(`Timeline: ${String(p.purchaseTimeline)}`);
      if (p.financing) parts.push(`Financing: ${String(p.financing)}`);
      if (p.notes) parts.push(`Notes: ${String(p.notes)}`);
      if (parts.length > 0) buyerPrefs = parts.join(" | ");
    }
  }

  const reply = await generateAIReply(
    contactName || phone,
    text,
    matchedPropertyData,
    intent.summary,
    intent.language,
    history,
    systemPrompt,
    buyerPrefs,
    lowConfidence,
    trackUsage
  );
  console.log("[STEP 5] Reply:", reply);

  // Log AI usage for cost tracking
  for (const usage of totalUsage) {
    logAIUsage(usage, conversation.id, ownerId || conversation.owner_id || undefined).catch(() => {});
  }
  const totalCost = totalUsage.reduce((sum, u) => sum + estimateCost(u), 0);
  console.log(`[STEP 5] AI usage: ${totalUsage.length} calls, total cost: $${totalCost.toFixed(6)}`);

  // Step 6: Calculate holistic lead score (0-100)
  console.log("\n[STEP 6] Calculating holistic lead score...");
  const { count: totalMessages } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversation.id);

  const leadScore = calculateLeadScore({
    intentScore: intent.score,
    lastContactAt: null,
    messageCount: totalMessages || 1,
    hasPropertyMatch: matches.length > 0,
  });
  console.log("[STEP 6] Holistic score:", leadScore.total, "/ 100");
  console.log("[STEP 6] Breakdown:", leadScore.breakdown);

  const leadStatus = scoreToStatus(leadScore.total);
  console.log("[STEP 6] Lead status:", leadStatus);

  let leadId: string | null = null;

  if (leadScore.total >= 34) {
    console.log("\n[STEP 7] Upserting lead (score >= 0.3)...");

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

    // Extract preferences from the conversation
    const preferences: Record<string, unknown> = {
      ...extractPreferences(text),
      ...(intent.bedrooms ? { bedrooms: intent.bedrooms } : {}),
      ...(intent.purchaseTimeline ? { purchaseTimeline: intent.purchaseTimeline } : {}),
      ...(intent.financing ? { financing: intent.financing } : {}),
    };

    // Check if a lead with this phone already exists for this owner
    let isNewLead = true;
    if (resolvedOwnerId) {
      const { data: existingLead } = await admin
        .from("leads")
        .select("id, status, preferences")
        .eq("phone", phone)
        .eq("user_id", resolvedOwnerId)
        .maybeSingle();

      if (existingLead) {
        console.log("[STEP 7] Existing lead found:", existingLead.id, "current status:", existingLead.status);
        isNewLead = false;
        const mergedPrefs = {
          ...extractPreferences(text, existingLead.preferences as Record<string, unknown> | null),
          ...(intent.bedrooms ? { bedrooms: intent.bedrooms } : {}),
          ...(intent.purchaseTimeline ? { purchaseTimeline: intent.purchaseTimeline } : {}),
          ...(intent.financing ? { financing: intent.financing } : {}),
        };
        const { error: updateError } = await admin
          .from("leads")
          .update({
            name: contactName || phone,
            status: leadStatus,
            score: leadScore.total,
            score_breakdown: leadScore.breakdown,
            preferences: mergedPrefs,
            notes: `WhatsApp: ${intent.summary}\nMessage: ${text}`,
            property_id: matches[0]?.property?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLead.id);

        if (updateError) {
          console.error("[STEP 7] Lead update error:", updateError);
        } else {
          leadId = existingLead.id;
          console.log("[STEP 7] Lead updated:", leadId, "status:", leadStatus, "score:", leadScore.total);
          console.log("[STEP 7] Updated preferences:", JSON.stringify(mergedPrefs));
        }
      }
    }

    if (isNewLead) {
      const { data: lead, error: leadError } = await admin
        .from("leads")
        .insert({
          name: contactName || phone,
          phone,
          user_id: resolvedOwnerId || "00000000-0000-0000-0000-000000000000",
          status: leadStatus,
          source: "whatsapp",
          score: leadScore.total,
          score_breakdown: leadScore.breakdown,
          preferences,
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
      }
    }

    if (leadId) {
      console.log("[STEP 7] Lead ready:", leadId, "status:", leadStatus);

      console.log("\n[STEP 7b] Updating conversation with lead/property info...");
      const { error: updateConvErr } = await admin
        .from("conversations")
        .update({
          lead_id: leadId,
          property_id: matches[0]?.property?.id || null,
          owner_id: resolvedOwnerId || conversation.owner_id,
          intent: intent.summary,
          intent_score: intent.score,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);

      if (updateConvErr) {
        console.error("[STEP 7b] Conversation update error:", updateConvErr);
      } else {
        console.log("[STEP 7b] Conversation updated");
      }

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

      if (leadStatus === "hot") {
        console.log("\n[STEP 9] Checking auto follow-up setting...");
        const { data: profile } = await admin
          .from("profiles")
          .select("auto_follow_ups")
          .eq("id", resolvedOwnerId)
          .single();

        if (profile?.auto_follow_ups !== false) {
          try {
            await scheduleDefaultFollowUps(leadId);
            console.log("[STEP 9] Follow-ups scheduled (drip: day 1, 3, 7, weeks 2-8)");
          } catch (fuErr) {
            console.error("[STEP 9] Follow-up error:", fuErr);
          }
        } else {
          console.log("[STEP 9] Follow-ups disabled by agency");
        }
      } else {
        console.log("[STEP 9] Skipping follow-ups (not HOT)");
      }

      // Step 9a: Check for booking intent (visit scheduling)
      if (detectBookingIntent(text)) {
        console.log("\n[STEP 9a] Booking intent detected — creating booking...");
        const booking = await createBooking(leadId, matches[0]?.property?.id || null, text, resolvedOwnerId || "00000000-0000-0000-0000-000000000000");
        if (booking) {
          console.log("[STEP 9a] Booking created:", booking.id, "at", booking.scheduled_at);
        }
      }
    }

    // Step 9b: Dynamic property refresh — buyer asking for different properties
    const refreshKeywords = ["else", "other", "different", "more", "another", "show me", "what about",
      "غير", "آخر", "ثاني", "واش أخرى", "autre", "d'autres", "autre chose",
      "different", "change", "switch", "بدل", "تبديل", "changer"];
    const wantsRefresh = refreshKeywords.some((k) => text.toLowerCase().includes(k));

    if (wantsRefresh) {
      console.log("\n[STEP 9b] Buyer wants different properties — running fresh search...");
      const freshMatches = await findBestMatches(intent, 5, admin, resolvedOwnerId);

      if (freshMatches.length > 0) {
        const currentIds = new Set(matches.map((m) => m.property.id));
        const newResults = freshMatches.filter((m) => !currentIds.has(m.property.id));

        if (newResults.length > 0) {
          const freshBlock = newResults
            .slice(0, 3)
            .map((m, i) => `${i + 1}. ${m.property.title} — ${m.property.city}, ${m.property.location}\n   Price: $${m.property.price.toLocaleString()} | ${m.property.type}`)
            .join("\n\n");

          const refreshMsg = `Here are some other options:\n\n${freshBlock}\n\nWould you like details on any of these?`;
          await sendWhatsAppMessage(phone, refreshMsg, resolvedOwnerId, conversation.id);

          await admin.from("messages").insert({
            conversation_id: conversation.id,
            role: "assistant",
            content: refreshMsg,
            metadata: { fresh_search: true, matches_found: newResults.length },
          });
          console.log("[STEP 9b] Sent fresh property suggestions");
        } else {
          console.log("[STEP 9b] No new properties found — already showing all matches");
        }
      } else {
        console.log("[STEP 9b] No matching properties found for alternate search");
      }
    }
  } else {
    console.log("\n[STEP 7-9] Skipped (score < 0.3, no lead created)");
  }

  // Step 10: Store as pending suggestion for agent review (instead of auto-sending)
  console.log("\n[STEP 10] Storing pending suggestion...");

  const suggestionMedia: string[] = [];
  for (const m of matches) {
    if (m.property.images && m.property.images.length > 0) {
      for (const img of m.property.images) {
        if (suggestionMedia.length < 5) suggestionMedia.push(img);
      }
    }
  }

  const { error: suggestionError } = await admin
    .from("conversations")
    .update({
      pending_suggestion: reply,
      pending_suggestion_media: suggestionMedia.length > 0 ? suggestionMedia : null,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversation.id);

  if (suggestionError) {
    console.error("[STEP 10] Suggestion store error:", suggestionError);
  } else {
    console.log("[STEP 10] Pending suggestion stored — awaiting agent approval");
    if (suggestionMedia.length > 0) {
      console.log("[STEP 10] Attached media:", suggestionMedia.length, "image(s)");
    }
  }

  // Step 11: Store viewed properties on lead for future exclusion
  if (leadId && matches.length > 0) {
    const shownIds = matches.map((m) => m.property.id);
    const allViewed = [...new Set([...viewedPropertyIds, ...shownIds])];
    const { error: vpError } = await admin
      .from("leads")
      .update({ viewed_properties: allViewed })
      .eq("id", leadId);
    if (vpError) {
      console.error("[STEP 11] Error storing viewed_properties:", vpError);
    } else {
      console.log("[STEP 11] Viewed properties stored:", shownIds.join(", "));
    }
  }

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
