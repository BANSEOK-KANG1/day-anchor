import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWidgetToken, hashWidgetToken } from "@/lib/widget/token";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase.from("widget_tokens").delete().eq("user_id", user.id);

  const token = generateWidgetToken();
  const tokenHash = hashWidgetToken(token);

  const { error } = await supabase.from("widget_tokens").insert({
    user_id: user.id,
    token_hash: tokenHash,
    label: "mobile-widget",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const widgetUrl = `${origin}/widget?token=${encodeURIComponent(token)}`;
  const apiUrl = `${origin}/api/widget/today?token=${encodeURIComponent(token)}`;

  return NextResponse.json({
    token,
    widgetUrl,
    apiUrl,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("widget_tokens").delete().eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
