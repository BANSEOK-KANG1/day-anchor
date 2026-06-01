import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { WidgetSnapshot } from "@/lib/widget/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const dateParam = url.searchParams.get("date");

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const pDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;

  const { data, error } = await supabase.rpc("get_widget_snapshot", {
    p_token: token,
    p_date: pDate ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(data as WidgetSnapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
