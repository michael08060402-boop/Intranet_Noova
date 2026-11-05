const { chromium } = require('@playwright/test');
const { createInterface } = require('node:readline/promises');
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const base = 'https://noova-intranet.web.app';
const curso = process.env.CURSO_PRUEBA || 'test';
const cantidadSesiones = Number(process.env.SESIONES_PRUEBA || 5);
if (!Number.isInteger(cantidadSesiones) || cantidadSesiones < 1 || cantidadSesiones > 5) {
  console.error('SESIONES_PRUEBA debe ser un entero entre 1 y 5.');
  process.exit(1);
}
const pausa = ms => new Promise(resolve => setTimeout(resolve, ms));
const chrome = [
  path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
].find(existsSync);

async function main() {
  const entrada = createInterface({ input: process.stdin, output: process.stdout });
  if (!chrome) throw new Error('Chrome no instalado');
  let browser;
  const estados = [];
  const resultados = [];
  try {
    for (let numero = 1; numero <= 1; numero++) {
      const perfilTemporal = await fs.mkdtemp(path.join(os.tmpdir(), 'noova-carga-chrome-'));
      let navegadorIngreso;
      const proceso = spawn(chrome, [`--user-data-dir=${perfilTemporal}`, '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--no-first-run', '--no-default-browser-check', base], { stdio: 'ignore', windowsHide: false });
      let falloApertura = false;
      proceso.on('error', () => { falloApertura = true; });
      try {
      // No conectar automatizacion hasta que el usuario termine el acceso normal.
      await entrada.question(`Cuenta ${numero}: inicia sesion con Google en el Chrome nuevo, entra a Mis cursos y pulsa Enter aqui. No escribas contrasenas en esta terminal. `);
      if (falloApertura) throw new Error('No se pudo abrir Chrome');
      const puerto = (await fs.readFile(path.join(perfilTemporal, 'DevToolsActivePort'), 'utf8')).split('\n')[0].trim();
      if (!/^\d+$/.test(puerto)) throw new Error('Puerto no valido');
      navegadorIngreso = await chromium.connectOverCDP(`http://127.0.0.1:${puerto}`);
      const contexto = navegadorIngreso.contexts()[0];
      const pagina = contexto.pages().find(p => p.url().startsWith(base)) || await contexto.newPage();
      await pagina.goto(`${base}/alumno/cursos`);
      const tarjeta = pagina.locator('.mis-cursos__curso').filter({ has: pagina.getByRole('heading', { name: curso, exact: true }) });
      await tarjeta.waitFor({ timeout: 60000 });
      // Solo el snapshot para las cinco sesiones permanece en memoria.
      estados.push(await contexto.storageState({ indexedDB: true }));
      } finally {
        if (navegadorIngreso) {
          const cdp = await navegadorIngreso.newBrowserCDPSession();
          await cdp.send('Browser.close').catch(() => {});
          await navegadorIngreso.close().catch(() => {});
          await pausa(1000);
          // Solo borrar el perfil temporal exacto creado para esta cuenta.
          if (path.dirname(perfilTemporal) === path.resolve(os.tmpdir()) && path.basename(perfilTemporal).startsWith('noova-carga-chrome-')) {
            await fs.rm(perfilTemporal, { recursive: true, force: true, maxRetries: 3 }).catch(() => console.log(`Perfil temporal pendiente de borrar tras cerrar Chrome: ${perfilTemporal}`));
          }
        } else {
          console.log(`Cierra el Chrome de prueba. Su perfil temporal esta en: ${perfilTemporal}`);
        }
      }
    }
    await entrada.question(`Listo: ${cantidadSesiones} sesiones haran dos visitas de 30 segundos y reproduciran el curso elegido. Consumira lecturas y trafico real. Pulsa Enter para comenzar o Ctrl+C para cancelar. `);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const preparadas = await Promise.all(Array.from({ length: cantidadSesiones }, async (_, i) => {
      const contexto = await browser.newContext({ storageState: estados[0] });
      return { contexto, pagina: await contexto.newPage(), sesion: i + 1 };
    }));
    const comienzoPrueba = Date.now();
    await Promise.all(preparadas.map(async ({ contexto, pagina, sesion }) => {
      let visitaActual = 1;
      const solicitudes = new Map();
      const red = [];
      function servicio(url) {
        const host = new URL(url).hostname;
        if (host === 'identitytoolkit.googleapis.com' || host === 'securetoken.googleapis.com') return 'Auth HTTP';
        if (host === 'firestore.googleapis.com') return 'Firestore HTTP (no incluye espera de listeners)';
        if (host === 'firebasestorage.googleapis.com') return 'Storage';
        if (url.includes('obtenerVideo') && (host.endsWith('.cloudfunctions.net') || host.endsWith('.run.app'))) return 'Funcion obtenerVideo';
        return null;
      }
      pagina.on('request', peticion => {
        const grupo = servicio(peticion.url());
        if (grupo) solicitudes.set(peticion, { grupo, inicio: Date.now(), visita: visitaActual });
      });
      pagina.on('requestfinished', peticion => {
        const dato = solicitudes.get(peticion);
        if (dato) red.push({ visita: dato.visita, servicio: dato.grupo, duracionMs: Date.now() - dato.inicio });
        solicitudes.delete(peticion);
      });
      pagina.on('requestfailed', peticion => { solicitudes.delete(peticion); });
      for (let visita = 1; visita <= 2; visita++) {
      visitaActual = visita;
      const inicio = Date.now();
      const resultado = { sesion, visita, documentoMs: null, accesoListoMs: null, datosTrasAccesoMs: null, portadaTrasDatosMs: null, enlaceVideoMs: null, videoMs: null, segundosReproducidos: 0, correcto: false };
      try {
        pagina.setDefaultTimeout(20000);
        await pagina.goto(`${base}/alumno/cursos`);
        resultado.documentoMs = Date.now() - inicio;
        await pagina.getByRole('heading', { name: 'Mis cursos', exact: true }).waitFor();
        resultado.accesoListoMs = Date.now() - inicio;
        const tarjeta = pagina.locator('.mis-cursos__curso').filter({ has: pagina.getByRole('heading', { name: curso, exact: true }) });
        await tarjeta.waitFor();
        const datosListos = Date.now();
        resultado.datosTrasAccesoMs = datosListos - inicio - resultado.accesoListoMs;
        const portada = tarjeta.locator('.portada-curso');
        await portada.waitFor();
        await pagina.waitForFunction(nombre => {
          const tarjetas = [...document.querySelectorAll('.mis-cursos__curso')];
          const tarjeta = tarjetas.find(t => t.querySelector('h2')?.textContent === nombre);
          const portada = tarjeta?.querySelector('.portada-curso');
          return portada?.getAttribute('aria-busy') === 'false' && getComputedStyle(portada).backgroundImage !== 'none';
        }, curso);
        // Comprobar la imagen decodificada, no solo que existe un fondo CSS.
        await portada.evaluate(async elemento => {
          const fondo = getComputedStyle(elemento).backgroundImage;
          const url = fondo.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
          if (!url) throw new Error('Portada ausente');
          const imagen = new Image(); imagen.src = url; await imagen.decode();
        });
        resultado.portadaTrasDatosMs = Date.now() - datosListos;
        const pedirEnlace = Date.now();
        await tarjeta.locator('.mis-cursos__continuar').click();
        const video = pagina.locator('video');
        await video.waitFor();
        resultado.enlaceVideoMs = Date.now() - pedirEnlace;
        const inicioVideo = Date.now();
        await video.evaluate(async elemento => { elemento.muted = true; await elemento.play(); });
        await pagina.waitForFunction(() => document.querySelector('video')?.currentTime > 0.1);
        resultado.videoMs = Date.now() - inicioVideo;
        await pausa(Math.max(0, comienzoPrueba + visita * 30000 - Date.now()));
        resultado.segundosReproducidos = await video.evaluate(elemento => { elemento.pause(); return elemento.currentTime; });
        resultado.correcto = resultado.segundosReproducidos > 0;
      } catch {
        // No imprimir errores con enlaces temporales o tokens de sesion.
        resultado.error = 'No se pudo completar el flujo. Revisar la sesion, portada o reproduccion.';
      } finally {
        resultados.push(resultado);
      }
      if (!resultado.correcto) break;
      }
      try {
        console.log(`Red de sesion ${sesion}: solo tiempos; no se muestran URLs ni tokens.`);
        console.table(red);
      } finally {
        await contexto.close();
      }
    }));
    console.table(resultados.sort((a, b) => a.sesion - b.sesion || a.visita - b.visita));
    console.log(`Prueba de ${cantidadSesiones} sesiones con una misma cuenta. No cambia progreso ni inicia examenes.`);
    if (resultados.some(r => !r.correcto)) process.exitCode = 1;
  } finally {
    entrada.close();
    await browser?.close();
  }
}

main().catch(() => { console.error('Prueba interrumpida o no preparada. No se muestran datos de sesion.'); process.exitCode = 1; });
