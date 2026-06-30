import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";

// Lets the client (navbar) discover whether the current user is an admin
// without exposing the ADMIN_EMAILS allowlist to the browser.
export async function GET() {
  const admin = await getAdminUser();
  return NextResponse.json({ admin: !!admin });
}
