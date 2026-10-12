"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncInbox } from "@/lib/inboxActions";

const INTERVALO_MS = 60_000;

/**
 * Recoge las tareas que el iPhone ha dejado en el buzón: al abrir la app, cada
 * minuto mientras está abierta y al volver a la ventana. No pinta nada; si
 * llega algo, refresca la página para que aparezca sin recargar a mano.
 */
export default function InboxSync() {
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;
    const recoger = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await syncInbox();
        if (!cancelado && r.status === "ok" && r.imported > 0) router.refresh();
      } catch {
        // Sin servidor (recargando en desarrollo...): ya lo intentará la próxima vez.
      }
    };

    recoger();
    const intervalo = setInterval(recoger, INTERVALO_MS);
    document.addEventListener("visibilitychange", recoger);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", recoger);
    };
  }, [router]);

  return null;
}
