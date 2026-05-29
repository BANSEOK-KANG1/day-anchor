import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

  if (!hasSupabase) {
    return;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup", "/settings/:path*"],
};
