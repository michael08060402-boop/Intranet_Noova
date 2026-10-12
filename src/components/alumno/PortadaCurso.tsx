"use client";

import { useEffect, useState, type ReactNode } from "react";
import { obtenerPortadaCurso } from "@/firebase/cursos";
import "./PortadaCurso.css";

const imagenesListas = new Map<string, string>();
const cargas = new Map<string, Promise<string>>();

async function direccionPortada(key: string, version: number) {
  const inicio = performance.now();
  function diagnostico(origen: string) {
    if (process.env.NODE_ENV === "development") console.info("[Portadas]", origen, `${Math.round(performance.now() - inicio)} ms`);
  }
  // La versión viene de Firestore: una portada actualizada no reutiliza la anterior.
  let cache: Cache | undefined;
  const direccionCache = new URL(`/__portadas_cache__/${encodeURIComponent(key)}?v=${version}`, window.location.origin).href;
  if (version && "caches" in window) {
    try {
      cache = await caches.open("noova-portadas-v1");
      const guardada = await cache.match(direccionCache);
      if (guardada) {
        const imagen = await guardada.blob();
        diagnostico("Imagen recuperada de caché");
        return URL.createObjectURL(imagen);
      }
    } catch {
      diagnostico("Caché no disponible");
    }
  }
  const url = await obtenerPortadaCurso(key, version);
  if (!cache) return url;
  const cacheImagenes = cache;
  try {
    // Evitar una respuesta HTTP previa sin cabeceras CORS tras configurar el bucket.
    const respuesta = await fetch(url, { cache: "reload", credentials: "omit" });
    if (!respuesta.ok || !respuesta.headers.get("content-type")?.startsWith("image/")) return url;
    const imagen = await respuesta.blob();
    if (!imagen.size || imagen.size > 5 * 1024 ** 2) return url;
    async function guardarEnCache() {
      try {
      await cacheImagenes.put(direccionCache, new Response(imagen, { headers: { "Content-Type": imagen.type } }));
      const entradas = await cacheImagenes.keys();
      // Limitar el espacio y retirar versiones anteriores de la misma portada.
      const ruta = new URL(direccionCache).pathname;
      await Promise.all(entradas.filter((entrada, indice) =>
        (new URL(entrada.url).pathname === ruta && entrada.url !== direccionCache) || indice < entradas.length - 100
      ).map((entrada) => cacheImagenes.delete(entrada)));
      } catch {
        diagnostico("No se pudo guardar en caché");
      }
    }
    // Mostrar la imagen sin esperar la escritura y limpieza de la caché.
    void guardarEnCache();
    diagnostico("Imagen descargada");
    return URL.createObjectURL(imagen);
  } catch {
    diagnostico("Descarga para caché fallida; carga directa");
    return url;
  }
}

function cargarPortada(key: string, version: number) {
  const clave = JSON.stringify([key, version]);
  const lista = imagenesListas.get(clave);
  if (lista) return Promise.resolve(lista);
  const pendiente = cargas.get(clave);
  if (pendiente) return pendiente;
  const carga = direccionPortada(key, version).then((url) => new Promise<string>((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => {
      imagenesListas.set(clave, url);
      if (imagenesListas.size > 200) imagenesListas.delete(imagenesListas.keys().next().value!);
      resolve(url);
    };
    imagen.onerror = () => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la portada."));
    };
    imagen.src = url;
  }));
  cargas.set(clave, carga);
  carga.then(() => cargas.delete(clave), () => cargas.delete(clave));
  return carga;
}

export default function PortadaCurso({ portadaKey, version = 0, nombre, className, children }: {
  portadaKey?: string;
  version?: number;
  nombre: string;
  className: string;
  children?: ReactNode;
}) {
  const [resultado, setResultado] = useState<{ key: string; url?: string } | null>(null);
  const clave = JSON.stringify([portadaKey, version]);

  useEffect(() => {
    if (!portadaKey) return;
    let activo = true;
    cargarPortada(portadaKey, version).then((url) => {
      if (activo) setResultado({ key: clave, url });
    }).catch(() => { if (activo) setResultado({ key: clave }); });
    return () => { activo = false; };
  }, [portadaKey, version, clave]);

  const cacheada = imagenesListas.get(clave);
  const resuelta = resultado?.key === clave;
  const cargando = Boolean(portadaKey && !cacheada && !resuelta);
  const url = cacheada ?? (resuelta ? resultado?.url : undefined);

  return (
    <span className={`${className} portada-curso${cargando ? " portada-curso--cargando" : ""}`}
      role="group"
      aria-busy={cargando}
      aria-label={cargando ? `Cargando portada de ${nombre}` : `Portada de ${nombre}`}
      style={cargando ? { backgroundImage: "none", backgroundColor: "#e7edf2" } : url ? { backgroundImage: `url(${JSON.stringify(url)})` } : undefined}>
      {cargando && <span className="portada-curso__carga" aria-hidden="true"><i /><i /><i /></span>}
      {children}
    </span>
  );
}
