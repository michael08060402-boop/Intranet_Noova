"use client";

import { useEffect, useRef, useState, type VideoHTMLAttributes } from "react";
import { Maximize, Minimize } from "lucide-react";
import SubtitulosVideo from "./SubtitulosVideo";
import "./ReproductorVideo.css";

export default function ReproductorVideo({ subtitulos, ...props }: VideoHTMLAttributes<HTMLVideoElement> & { subtitulos?: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [activados, setActivados] = useState(true);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const pistas = video.current?.textTracks;
    const sincronizar = () => {
      const pista = Array.from(pistas ?? []).find(p => p.kind === "captions");
      if (pista) setActivados(pista.mode === "showing");
    };
    const pantalla = () => setPantallaCompleta(document.fullscreenElement === contenedor.current);
    pistas?.addEventListener("change", sincronizar);
    document.addEventListener("fullscreenchange", pantalla);
    return () => { pistas?.removeEventListener("change", sincronizar); document.removeEventListener("fullscreenchange", pantalla); };
  }, []);
  async function ampliar() {
    try {
      setError("");
      if (document.fullscreenElement === contenedor.current) await document.exitFullscreen();
      else if (contenedor.current?.requestFullscreen) await contenedor.current.requestFullscreen();
      else setError("Este navegador no permite ampliar el reproductor completo.");
    } catch { setError("No se pudo abrir la pantalla completa."); }
  }
  return <div ref={contenedor} className="reproductor-video">
    <video {...props} ref={video} controlsList={`${props.controlsList ?? ""} nofullscreen`.trim()}>
      <SubtitulosVideo texto={subtitulos} activados={activados} />
    </video>
    <div className="reproductor-video__controles">
      {subtitulos && <button type="button" aria-label={activados ? "Desactivar subtítulos" : "Activar subtítulos"} title={activados ? "Desactivar subtítulos" : "Activar subtítulos"} aria-pressed={activados} onClick={() => setActivados(valor => !valor)}>CC</button>}
      <button type="button" aria-label={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"} title="Pantalla completa" onClick={ampliar}>{pantallaCompleta ? <Minimize /> : <Maximize />}</button>
    </div>
    {error && <p className="reproductor-video__error" role="status">{error}</p>}
  </div>;
}
