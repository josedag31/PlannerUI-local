import { NextRequest, NextResponse } from "next/server";
import { disconnectGoogle } from "@/lib/google";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const label = formData.get("label") === "ARUS" ? "ARUS" : "PERSONAL";
  await disconnectGoogle(label);
  return NextResponse.redirect(new URL(`/ajustes?google_disconnected=${label}`, request.url), { status: 303 });
}
