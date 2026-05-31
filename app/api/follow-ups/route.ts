import { NextRequest, NextResponse } from "next/server";
import { getFollowUps, getUpcomingFollowUps, completeFollowUp } from "@/services/follow-ups";
import { logError } from "@/services/logging";

export async function GET(request: NextRequest) {
  try {
    const days = request.nextUrl.searchParams.get("days")
      ? parseInt(request.nextUrl.searchParams.get("days")!)
      : undefined;

    const followUps = days ? await getUpcomingFollowUps(days) : await getFollowUps();
    return NextResponse.json(followUps);
  } catch (err) {
    await logError("follow-ups/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed } = body;

    if (completed && id) {
      await completeFollowUp(id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError("follow-ups/patch", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
