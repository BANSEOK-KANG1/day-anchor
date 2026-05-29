import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const hasSupabase = url && key && !url.includes("your-project");

  if (!hasSupabase) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup", "/settings/:path*"],
};
