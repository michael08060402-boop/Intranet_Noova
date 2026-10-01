"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CircleCheck, CircleHelp, CreditCard, Crown, Lock, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import logoYape from "@/assets/pagos/yape.webp";
import { useSesion } from "@/components/acceso/SesionProvider";
import { ahorroPeriodo, buscarPeriodo, nombrePeriodo, periodos, precioSinDescuento } from "../planPremium";
import "./Pago.css";

type Paso = "formulario" | "procesando" | "exito";
type Metodo = "tarjeta" | "yape";

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric" });

// Agrupa los dígitos de la tarjeta de cuatro en cuatro mientras se escriben.
const formatoTarjeta = (valor: string) => valor.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatoVencimiento = (valor: string) => valor.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(?=\d)/, "$1/");
const soloDigitos = (valor: string, maximo: number) => valor.replace(/\D/g, "").slice(0, maximo);

function vencimientoPlan(meses: number) {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  return formatoFecha.format(fecha);
}

export default function PagoPage() {
  return (
    <Suspense fallback={<main className="pago-page student-fondo" />}>
      <Pago />
    </Suspense>
  );
}

// Pago simulado: no hay pasarela conectada, no se cobra nada y los datos de pago solo viven en esta pantalla.
function Pago() {
  const { perfil } = useSesion();
  const [meses, setMeses] = useState(buscarPeriodo(Number(useSearchParams().get("periodo"))).meses);
  const [metodo, setMetodo] = useState<Metodo>("tarjeta");
  const [paso, setPaso] = useState<Paso>("formulario");
  const [titular, setTitular] = useState("");
  const [tarjeta, setTarjeta] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const precio = buscarPeriodo(meses).precio;
  const descuento = precioSinDescuento(meses) - precio;

  function validar() {
    if (metodo === "yape") {
      if (!/^9\d{8}$/.test(celular)) return "El celular debe tener 9 dígitos y empezar con 9.";
      if (!/^\d{6}$/.test(codigo)) return "El código de aprobación tiene 6 dígitos.";
      return "";
    }
    if (tarjeta.replace(/\s/g, "").length !== 16) return "El número de tarjeta debe tener 16 dígitos.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento)) return "Ingresa el vencimiento como MM/AA.";
    if (!/^\d{3,4}$/.test(cvv)) return "El CVV debe tener 3 o 4 dígitos.";
    return "";
  }

  function pagar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const fallo = validar();
    setError(fallo);
    if (fallo) return;
    setPaso("procesando");
    setTimeout(() => {
      setTitular("");
      setTarjeta("");
      setVencimiento("");
      setCvv("");
      setCelular("");
      setCodigo("");
      setPaso("exito");
    }, 1800);
  }

  function elegirMetodo(nuevo: Metodo) {
    setMetodo(nuevo);
    setError("");
  }

  if (perfil?.plan === "premium") {
    return (
      <main className="pago-page student-fondo">
        <section className="pago-page__resultado">
          <CircleCheck />
          <h1>Ya tienes Premium</h1>
          <p>Tu cuenta ya tiene acceso a todos los cursos.</p>
          <Link href="/alumno/explorar" className="pago-page__boton">Ir a los cursos</Link>
        </section>
      </main>
    );
  }

  if (paso === "exito") {
    return (
      <main className="pago-page student-fondo">
        <section className="pago-page__resultado">
          <CircleCheck />
          <h1>¡Pago exitoso!</h1>
          <p>
            Tu Premium de {nombrePeriodo(meses)} estaría activo hasta el <strong>{vencimientoPlan(meses)}</strong>.
            Esta es una simulación: no se realizó ningún cobro y tu plan no cambió.
          </p>
          <Link href="/alumno/explorar" className="pago-page__boton">Volver a los cursos</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="pago-page student-fondo">
      <Link href="/alumno/premium" className="pago-page__volver"><ArrowLeft />Volver a planes</Link>
      <header className="pago-page__encabezado">
        <h1>Completa tu compra</h1>
        <p>Activa tu acceso Premium y continúa aprendiendo.</p>
      </header>

      <div className="pago-page__layout">
        <section className="pago-page__panel" aria-labelledby="pago-metodo">
          <h2 id="pago-metodo">Método de pago</h2>
          <div className="pago-page__metodos" role="radiogroup" aria-label="Método de pago">
            <button type="button" role="radio" aria-checked={metodo === "tarjeta"} className={metodo === "tarjeta" ? "is-activo" : ""} onClick={() => elegirMetodo("tarjeta")}>
              <span className="pago-page__metodo-icono"><span className="pago-page__logo" aria-hidden="true" /></span>
              Tarjeta
              <span className="pago-page__radio">{metodo === "tarjeta" && <CircleCheck />}</span>
            </button>
            <button type="button" role="radio" aria-checked={metodo === "yape"} className={metodo === "yape" ? "is-activo" : ""} onClick={() => elegirMetodo("yape")}>
              <Image src={logoYape} alt="" className="pago-page__yape" />
              Yape
              <span className="pago-page__radio">{metodo === "yape" && <CircleCheck />}</span>
            </button>
          </div>
          <p className="pago-page__prueba" role="note"><TriangleAlert />Entorno de prueba: no ingreses datos reales. No se realizará ningún cobro.</p>

          {/* autoComplete="off" evita que el navegador ofrezca tarjetas guardadas en una pantalla de prueba. */}
          <form className="pago-page__formulario" onSubmit={pagar} autoComplete="off">
            {metodo === "tarjeta" ? (
              <>
                <label className="pago-page__completo">
                  <span>Nombre en la tarjeta</span>
                  <input value={titular} onChange={(evento) => setTitular(evento.target.value)} placeholder="Juan Pérez García" required maxLength={60} />
                </label>
                <label className="pago-page__completo">
                  <span>Número de tarjeta</span>
                  <span className="pago-page__campo"><CreditCard />
                    <input value={tarjeta} onChange={(evento) => setTarjeta(formatoTarjeta(evento.target.value))} placeholder="4111 1111 1111 1111" inputMode="numeric" required />
                  </span>
                </label>
                <label>
                  <span>Vencimiento</span>
                  <span className="pago-page__campo"><CalendarDays />
                    <input value={vencimiento} onChange={(evento) => setVencimiento(formatoVencimiento(evento.target.value))} placeholder="MM/AA" inputMode="numeric" required />
                  </span>
                </label>
                <label>
                  <span>CVV</span>
                  <span className="pago-page__campo"><Lock />
                    <input value={cvv} onChange={(evento) => setCvv(soloDigitos(evento.target.value, 4))} placeholder="123" inputMode="numeric" required />
                    <CircleHelp className="pago-page__ayuda" aria-label="Los 3 o 4 dígitos al reverso de tu tarjeta" />
                  </span>
                </label>
              </>
            ) : (
              <>
                <label className="pago-page__completo">
                  <span>Celular afiliado a Yape</span>
                  <span className="pago-page__campo"><Smartphone />
                    <input value={celular} onChange={(evento) => setCelular(soloDigitos(evento.target.value, 9))} placeholder="987 654 321" inputMode="numeric" required />
                  </span>
                </label>
                <label className="pago-page__completo">
                  <span>Código de aprobación</span>
                  <span className="pago-page__campo"><Lock />
                    <input value={codigo} onChange={(evento) => setCodigo(soloDigitos(evento.target.value, 6))} placeholder="6 dígitos" inputMode="numeric" required />
                  </span>
                  <small>Lo encuentras en tu app de Yape, en el menú «Código de aprobación».</small>
                </label>
              </>
            )}
            {error && <p className="pago-page__error" role="alert">{error}</p>}
            <button type="submit" className="pago-page__pagar student-dorado" disabled={paso === "procesando"}>
              {paso === "procesando" ? "Procesando pago…" : <>Pagar S/ {precio}<ArrowRight /></>}
            </button>
          </form>
        </section>

        <aside className="pago-page__panel" aria-labelledby="pago-resumen">
          <h2 id="pago-resumen">Resumen de compra</h2>
          <div className="pago-page__plan">
            <span className="pago-page__corona"><Crown /></span>
            <div>
              <strong>Plan Premium</strong>
              <small>Acceso completo a todos los cursos.</small>
            </div>
          </div>
          <dl className="pago-page__detalle">
            <div>
              <dt>Duración</dt>
              <dd>
                <select value={meses} onChange={(evento) => setMeses(Number(evento.target.value))} aria-label="Duración del plan">
                  {periodos.map((periodo) => <option key={periodo.meses} value={periodo.meses}>{nombrePeriodo(periodo.meses)}</option>)}
                </select>
              </dd>
            </div>
            {descuento > 0 && (
              <>
                <div><dt>Precio original</dt><dd><s>S/ {precioSinDescuento(meses)}</s></dd></div>
                <div className="pago-page__descuento"><dt>Descuento ({ahorroPeriodo(meses)}%)</dt><dd>- S/ {descuento}</dd></div>
              </>
            )}
            <div className="pago-page__total"><dt>Total</dt><dd>S/ {precio}</dd></div>
          </dl>
          <div className="pago-page__nota">
            <CalendarDays />
            <div><small>Acceso hasta</small><strong>{vencimientoPlan(meses)}</strong></div>
          </div>
          <p className="pago-page__unico"><ShieldCheck />Pago único: no se renueva automáticamente.</p>
        </aside>
      </div>
    </main>
  );
}
