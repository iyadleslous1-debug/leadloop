import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("sb-access-token")?.value;
  let refreshToken = cookieStore.get("sb-refresh-token")?.value;

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  if (accessToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });

    if (!error && data.session) {
      // Sync refreshed tokens back to cookies if they changed
      if (data.session.access_token !== accessToken) {
        cookieStore.set("sb-access-token", data.session.access_token, {
          path: "/",
          maxAge: 3600,
          sameSite: "lax",
        });
        cookieStore.set("sb-refresh-token", data.session.refresh_token, {
          path: "/",
          maxAge: 3600,
          sameSite: "lax",
        });
      }
    }
  }

  return supabase;
}
