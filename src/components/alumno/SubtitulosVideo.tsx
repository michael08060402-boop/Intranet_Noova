"use client";
import { useEffect, useRef, useState } from "react";

export default function SubtitulosVideo({ texto, activados = true }: { texto?: string; activados?: boolean }) {
  const pista = useRef<HTMLTrackElement>(null);
  const [archivo, setArchivo] = useState<{ texto: string; url: string }>();
  useEffect(() => {
    if (!texto) return;
    let activo = true;
    const url = URL.createObjectURL(new Blob([texto], { type: "text/vtt;charset=utf-8" }));
    queueMicrotask(() => { if (activo) setArchivo({ texto, url }); });
    return () => { activo = false; URL.revokeObjectURL(url); };
  }, [texto]);
  useEffect(() => {
    if (pista.current) pista.current.track.mode = activados ? "showing" : "disabled";
  }, [activados, archivo, texto]);
  return archivo?.texto === texto && archivo ? <track ref={pista} key={archivo.url} kind="captions" src={archivo.url} srcLang="es" label="Español" default onLoad={() => { if (pista.current) pista.current.track.mode = activados ? "showing" : "disabled"; }} /> : null;
}
