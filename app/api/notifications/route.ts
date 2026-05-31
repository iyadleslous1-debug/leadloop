import { NextRequest, NextResponse } from "next/server";
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from "@/services/notifications";
import { logError } from "@/services/logging";

export async function GET() {
  try {
    const [notifications, unread] = await Promise.all([
      getNotifications(),
      getUnreadCount(),
    ]);

    return NextResponse.json({ notifications, unread });
  } catch (err) {
    await logError("notifications/get", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, all } = body;

    if (all) {
      await markAllAsRead();
    } else if (id) {
      await markAsRead(id);
    } else {
      return NextResponse.json({ error: "id or all required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError("notifications/patch", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
