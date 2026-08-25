import { NextRequest, NextResponse } from "next/server";
import { listDriveFolderChildren, searchDriveFolders } from "@/lib/googleData";
import type { GoogleAccountLabel } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const label: GoogleAccountLabel = params.get("label") === "ARUS" ? "ARUS" : "PERSONAL";
  const query = params.get("q");

  const folders = query
    ? await searchDriveFolders(query, label)
    : await listDriveFolderChildren(label, params.get("parentId") ?? "root");

  return NextResponse.json({ folders });
}
