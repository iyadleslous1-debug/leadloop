import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "WhatsApp webhook coming soon" });
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint active" });
}
