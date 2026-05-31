import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const startTime = Date.now();

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {};
  let allOk = true;

  checks["server"] = "ok";

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id", { count: "exact", head: true });
    checks["database"] = error ? "fail" : "ok";
    if (error) allOk = false;
  } catch {
    checks["database"] = "fail";
    allOk = false;
  }

  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GROQ_API_KEY",
  ];
  const envChecks: Record<string, boolean> = {};
  for (const key of requiredEnvVars) {
    envChecks[key] = !!process.env[key];
    if (!process.env[key]) allOk = false;
  }

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    checks,
    env: envChecks,
  });
}
