"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, LifeBuoy, Mail, Plus, Send } from "lucide-react";
import { useSesion } from "@/components/acceso/SesionProvider";
import {
  CORREO_SOPORTE,
  LIMITE_ASUNTO,
  LIMITE_MENSAJE,
  cambiarEstadoTicket,
  categoriasTicket,
  crearTicket,
  escucharTickets,
  escucharTicketsDe,
  marcarTicketLeido,
  responderComoSoporte,
  responderComoUsuario,
  type CategoriaTicket,
  type EstadoTicket,
  type Ticket,
} from "@/firebase/tickets";
import { mensajeDeError } from "@/firebase/errores";
import "./PanelSoporte.css";

const filtros: { valor: EstadoTicket | "todos"; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "abierto", etiqueta: "Abiertos" },
  { valor: "respondido", etiqueta: "Respondidos" },
  { valor: "cerrado", etiqueta: "Cerrados" },
];
const etiquetaEstado: Record<EstadoTicket, string> = { abierto: "Abierto", respondido: "Respondido", cerrado: "Cerrado" };
const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function PanelSoporte({ admin }: { admin: boolean }) {
  const { usuario, perfil } = useSesion();
  const pedido = useSearchParams().get("id");
  const uid = usuario?.uid;
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [vista, setVista] = useState<string>(pedido ?? "");
  const [filtro, setFiltro] = useState<EstadoTicket | "todos">("todos");
  const [asunto, setAsunto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaTicket>("Cursos");
  const [texto, setTexto] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const alFallar = () => { setTickets([]); setError("No se pudieron cargar los tickets."); };
    return admin ? escucharTickets(setTickets, alFallar) : escucharTicketsDe(uid, setTickets, alFallar);
  }, [admin, uid]);

  const seleccionado = tickets?.find((ticket) => ticket.id === vista) ?? null;
  const esDelUsuario = seleccionado?.uid === uid;
  const visibles = (tickets ?? []).filter((ticket) => filtro === "todos" || ticket.estado === filtro);
  const escribiendo = vista === "nuevo";

  useEffect(() => {
    if (seleccionado?.sinLeer && esDelUsuario) marcarTicketLeido(seleccionado.id).catch(() => {});
  }, [seleccionado?.id, seleccionado?.sinLeer, esDelUsuario]);

  async function ejecutar(accion: () => Promise<unknown>) {
    setEnviando(true);
    setError("");
    try {
      await accion();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  function enviarNuevo(evento: FormEvent) {
    evento.preventDefault();
    if (!usuario || !perfil) return;
    ejecutar(async () => {
      const id = await crearTicket(usuario, perfil, asunto.trim(), categoria, texto.trim());
      setAsunto("");
      setTexto("");
      setCategoria("Cursos");
      setVista(id);
    });
  }

  function enviarRespuesta(evento: FormEvent) {
    evento.preventDefault();
    if (!seleccionado || !perfil) return;
    const mensaje = respuesta.trim();
    ejecutar(async () => {
      if (admin) await responderComoSoporte(seleccionado, perfil.nombre, mensaje);
      else await responderComoUsuario(seleccionado, perfil.nombre, mensaje);
      setRespuesta("");
    });
  }

  const nuevoValido = asunto.trim().length >= 3 && texto.trim().length >= 5;

  return (
    <div className={`soporte ${vista ? "is-detalle" : ""}`}>
      <section className="soporte__lista" aria-label="Tickets">
        <div className="soporte__lista-cabecera">
          <h2>{admin ? "Tickets" : "Mis tickets"}</h2>
          <button type="button" className="soporte__nuevo" onClick={() => { setVista("nuevo"); setError(""); }}>
            <Plus />Nuevo ticket
          </button>
        </div>
        <div className="soporte__filtros" role="group" aria-label="Filtrar por estado">
          {filtros.map(({ valor, etiqueta }) => (
            <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>{etiqueta}</button>
          ))}
        </div>
        {tickets === null ? <p className="soporte__vacio">Cargando…</p> : visibles.length === 0 ? (
          <p className="soporte__vacio">{tickets.length === 0 ? "Aún no hay tickets." : "No hay tickets con ese estado."}</p>
        ) : (
          <ul>
            {visibles.map((ticket) => (
              <li key={ticket.id}>
                <button type="button" className={ticket.id === vista ? "is-activo" : ""} onClick={() => { setVista(ticket.id); setError(""); }}>
                  <span className="soporte__fila-titulo">
                    {ticket.sinLeer && ticket.uid === uid && <i className="soporte__punto" aria-label="Respuesta nueva" />}
                    <strong>{ticket.asunto}</strong>
                  </span>
                  <span className="soporte__fila-meta">
                    {admin ? (ticket.uid === uid ? "Tú" : ticket.nombre) : ticket.categoria} · {formatoFecha.format(ticket.actualizadoEn)}
                  </span>
                  <span className={`soporte__estado soporte__estado--${ticket.estado}`}>{etiquetaEstado[ticket.estado]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <a className="soporte__correo" href={`mailto:${CORREO_SOPORTE}`}><Mail />{CORREO_SOPORTE}</a>
      </section>

      <section className="soporte__detalle" aria-label={escribiendo ? "Nuevo ticket" : "Detalle del ticket"}>
        <button type="button" className="soporte__volver" onClick={() => { setVista(""); setError(""); }}><ArrowLeft />Tickets</button>
        {escribiendo ? (
          <form className="soporte__formulario" onSubmit={enviarNuevo}>
            <h2>Nuevo ticket</h2>
            <label>
              Asunto
              <input value={asunto} maxLength={LIMITE_ASUNTO} onChange={(evento) => setAsunto(evento.target.value)} />
            </label>
            <label>
              Categoría
              <select value={categoria} onChange={(evento) => setCategoria(evento.target.value as CategoriaTicket)}>
                {categoriasTicket.map((nombre) => <option key={nombre}>{nombre}</option>)}
              </select>
            </label>
            <label>
              Mensaje
              <textarea rows={6} value={texto} maxLength={LIMITE_MENSAJE} onChange={(evento) => setTexto(evento.target.value)} />
            </label>
            {error && <p className="soporte__error" role="alert">{error}</p>}
            <button type="submit" className="soporte__enviar" disabled={enviando || !nuevoValido}><Send />{enviando ? "Enviando…" : "Enviar ticket"}</button>
          </form>
        ) : seleccionado ? (
          <div className="soporte__hilo">
            <header>
              <div>
                <h2>{seleccionado.asunto}</h2>
                <p>
                  {seleccionado.categoria} · {formatoFecha.format(seleccionado.creadoEn)}
                  {admin && <> · {seleccionado.nombre} ({seleccionado.correo}){seleccionado.rol === "admin" && " · administrador"}</>}
                </p>
              </div>
              <span className={`soporte__estado soporte__estado--${seleccionado.estado}`}>{etiquetaEstado[seleccionado.estado]}</span>
            </header>
            <ol>
              {seleccionado.mensajes.map((mensaje, posicion) => {
                const propio = admin ? mensaje.de === "soporte" : mensaje.de === "usuario";
                const autor = mensaje.de === "soporte" ? (admin ? `${mensaje.autor} · Soporte` : "Soporte Noova") : mensaje.autor;
                return (
                  <li key={posicion} className={`soporte__mensaje ${propio ? "is-propio" : ""} ${mensaje.de === "soporte" ? "is-soporte" : ""}`}>
                    <strong>{autor}</strong>
                    <p>{mensaje.texto}</p>
                    <small>{formatoFecha.format(mensaje.fecha)}</small>
                  </li>
                );
              })}
            </ol>
            {seleccionado.estado === "cerrado" ? (
              <div className="soporte__cerrado">
                <p>Este ticket está cerrado.</p>
                {admin && <button type="button" disabled={enviando} onClick={() => ejecutar(() => cambiarEstadoTicket(seleccionado.id, "abierto"))}>Reabrir</button>}
              </div>
            ) : (
              <form className="soporte__responder" onSubmit={enviarRespuesta}>
                <textarea aria-label="Respuesta" rows={3} placeholder={admin && !esDelUsuario ? "Escribe la respuesta" : "Escribe un mensaje"} value={respuesta} maxLength={LIMITE_MENSAJE} onChange={(evento) => setRespuesta(evento.target.value)} />
                {error && <p className="soporte__error" role="alert">{error}</p>}
                <div>
                  <button type="button" className="soporte__cerrar" disabled={enviando} onClick={() => ejecutar(() => cambiarEstadoTicket(seleccionado.id, "cerrado"))}>Cerrar ticket</button>
                  <button type="submit" className="soporte__enviar" disabled={enviando || respuesta.trim().length === 0}><Send />{enviando ? "Enviando…" : "Responder"}</button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="soporte__ninguno">
            <LifeBuoy />
            <p>Elige un ticket o crea uno nuevo.</p>
          </div>
        )}
      </section>
    </div>
  );
}
