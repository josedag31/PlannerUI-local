import { NextRequest, NextResponse } from "next/server";
import { disconnectMicrosoft } from "@/lib/microsoft";

export async function POST(request: NextRequest) {
  await disconnectMicrosoft();
  return NextResponse.redirect(new URL("/ajustes?microsoft_disconnected=1", request.url), { status: 303 });
}
