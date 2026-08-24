import { NextRequest, NextResponse } from "next/server";
import { disconnectGoogle } from "@/lib/google";

export async function POST(request: NextRequest) {
  await disconnectGoogle();
  return NextResponse.redirect(new URL("/ajustes?google_disconnected=1", request.url));
}
