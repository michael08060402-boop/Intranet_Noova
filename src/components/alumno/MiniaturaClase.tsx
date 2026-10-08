"use client";

import { useEffect, useState, type ReactNode } from "react";
import { pedirVideo } from "@/firebase/cursos";

export default function MiniaturaClase({ cursoId, claseId, className, children, habilitada = true }: {
  cursoId: string; claseId: string; className: string; children?: ReactNode; habilitada?: boolean;
}) {
  const [datos, setDatos] = useState<{ clave: string; url: string; poster?: string; personalizada: boolean } | null>(null);
  const clave = `${cursoId}/${claseId}`;
  useEffect(() => {
    let vigente = true;
    if (habilitada) pedirVideo(cursoId, claseId).then((video) => {
      if (vigente) setDatos({ clave: `${cursoId}/${claseId}`, ...video });
    }).catch(() => {});
    return () => { vigente = false; };
  }, [cursoId, claseId, habilitada]);
  const actual = habilitada && datos?.clave === clave ? datos : null;
  return <span className={className} style={{ position: "relative", overflow: "hidden", background: "#e6ebef" }}>
    {actual?.personalizada && actual.poster ? <span style={{ position: "absolute", inset: 0, background: `url(${JSON.stringify(actual.poster)}) center / cover` }} /> : actual && <video
      src={actual.url} poster={actual.poster} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      onLoadedMetadata={(evento) => {
        const video = evento.currentTarget;
        if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = video.duration * 0.2;
      }}
      onSeeked={(evento) => evento.currentTarget.pause()}
    />}
    <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
  </span>;
}