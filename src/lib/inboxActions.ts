"use server";

import { revalidatePath } from "next/cache";
import { syncMobileInbox, type InboxSyncResult } from "@/lib/inbox";

/** Recoge el buzón del móvil. Lo llama `InboxSync` desde el cliente. */
export async function syncInbox(): Promise<InboxSyncResult> {
  const result = await syncMobileInbox();
  if (result.status === "ok" && result.imported > 0) {
    revalidatePath("/", "layout");
  }
  return result;
}
