"use client";
import { useEffect, useState } from "react";

export default function SubtitulosVideo({ texto }: { texto?: string }) {
  const [archivo, setArchivo] = useState<{ texto: string; url: string }>();
  useEffect(() => {
    if (!texto) return;
    let activo = true;
    const url = URL.createObjectURL(new Blob([texto], { type: "text/vtt;charset=utf-8" }));
    queueMicrotask(() => { if (activo) setArchivo({ texto, url }); });
    return () => { activo = false; URL.revokeObjectURL(url); };
  }, [texto]);
  return archivo?.texto === texto && archivo ? <track key={archivo.url} kind="captions" src={archivo.url} srcLang="es" label="Español" default /> : null;
}
