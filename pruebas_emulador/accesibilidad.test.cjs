const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const esbuild = require('esbuild');
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
let navegador, servidor, base;
const carpeta = path.resolve('.a11y-temporal');
before(async () => {
  fs.mkdirSync(carpeta, { recursive: true });
  await esbuild.build({
    entryPoints: ['pruebas_emulador/accesibilidad/fixture.jsx'], bundle: true, outfile: path.join(carpeta, 'fixture.js'), jsx: 'automatic', loader: { '.svg': 'file', '.webp': 'file' },
    plugins: [{ name: 'servicios-simulados', setup(build) {
      build.onResolve({ filter: /^(?:@\/firebase\/(?:cursos|evaluaciones|perfiles|config)|firebase\/auth)$|SesionProvider$/ }, () => ({ path: path.resolve('pruebas_emulador/accesibilidad/mocks.js') }));
      build.onResolve({ filter: /^next\/(?:navigation|link|image)$/ }, (args) => ({ path: args.path, namespace: 'next-simulado' }));
      build.onLoad({ filter: /.*/, namespace: 'next-simulado' }, (args) => ({ loader: 'js', contents: args.path === 'next/navigation' ? `const router={replace(){}};export const useRouter=()=>router;export const useSearchParams=()=>new URLSearchParams(location.search);export const usePathname=()=>location.pathname;` : args.path === 'next/link' ? `import React from 'react';export default p=>React.createElement('a',p);` : `import React from 'react';export default ({src,fill,preload,unoptimized,...p})=>React.createElement('img',{...p,src:typeof src==='string'?src:src.src});`, resolveDir: process.cwd() }));
    } }],
  });
  servidor = http.createServer((req, res) => {
    const nombre = new URL(req.url, 'http://localhost').pathname;
    if (nombre === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prueba de accesibilidad</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'); return; }
    const archivo = path.resolve(carpeta, '.' + nombre);
    if (!archivo.startsWith(carpeta + path.sep) || !fs.existsSync(archivo)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', archivo.endsWith('.css') ? 'text/css' : archivo.endsWith('.js') ? 'application/javascript' : archivo.endsWith('.svg') ? 'image/svg+xml' : 'image/webp');
    fs.createReadStream(archivo).pipe(res);
  });
  await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  navegador = await chromium.launch({ headless: true, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
});
after(async () => { await navegador?.close(); if (servidor) await new Promise(resolve => servidor.close(resolve)); });
async function abrir(vista, width = 1280) {
  const context = await navegador.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/?vista=${vista}&id=examen`);
  await page.locator('main').waitFor();
  return page;
}
async function analizar(page) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(resultado.violations.map(v => ({ id: v.id, nodos: v.nodes.map(n => n.target) })), []);
}
test('once pantallas: axe en escritorio y 320 px', async () => {
  for (const width of [1280, 320]) for (const vista of ['acceso', 'examen', 'admin', 'alumnos', 'reportes', 'cursos', 'admin-clase', 'detalle', 'mis-cursos', 'evaluaciones', 'perfil']) {
    const page = await abrir(vista, width);
    if (vista === 'admin') await page.getByRole('dialog').waitFor();
    await analizar(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Desbordamiento en ${vista} a ${width}px`);
    await page.close();
  }
});
test('modal de clase: controles sin subtítulos, teclado y lectura de campos', async () => {
  const page = await abrir('admin-clase', 320);
  await page.getByRole('button', { name: 'Nueva clase', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await analizar(page);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert.equal(await page.getByRole('button', { name: 'Nueva clase', exact: true }).evaluate(element => element === document.activeElement), true);
  await page.close();
});
test('texto al 200 % conserva controles y acciones accesibles', async () => {
  for (const vista of ['acceso', 'examen', 'admin']) {
    const page = await abrir(vista);
    await page.evaluate(() => {
      const medidas = [...document.querySelectorAll('button,label,input,select,textarea,p,h1,h2,h3,small,legend,a,span,strong')].map(element => [element, parseFloat(getComputedStyle(element).fontSize)]);
      medidas.forEach(([element, size]) => { element.style.fontSize = `${size * 2}px`; });
    });
    await analizar(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await page.close();
  }
});
test('registro y recuperación: etiquetas, contraste y teclado en móvil', async () => {
  const page = await abrir('acceso', 320);
  await page.getByRole('button', { name: 'Crea tu cuenta', exact: true }).click();
  await analizar(page);
  await page.getByRole('button', { name: 'Inicia sesión', exact: true }).click();
  await page.getByRole('button', { name: '¿Olvidaste tu contraseña?', exact: true }).click();
  await analizar(page);
  await page.close();
});
test('teclado: salto al contenido, examen, calculadoras, Escape y foco restaurado', async () => {
  const page = await abrir('examen');
  await page.keyboard.press('Tab');
  await page.getByRole('link', { name: 'Saltar al contenido principal' }).press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'MAIN');
  assert.equal(await page.locator('input[name="tiempo-examen"]').count(), 0);
  await page.getByRole('button', { name: 'Comenzar examen' }).click();
  await page.getByRole('button', { name: 'Calculadoras', exact: true }).waitFor();
  await analizar(page);
  const boton = page.getByRole('button', { name: 'Calculadoras', exact: true });
  await boton.click();
  await page.getByRole('dialog', { name: 'Herramientas de cálculo' }).waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Cerrar herramientas');
  await analizar(page);
  for (const nombre of ['Aire', 'Balance', 'Ventilador', 'Bomba', 'Conversor']) {
    await page.getByRole('button', { name: nombre, exact: true }).click();
    await page.getByRole('button', { name: 'Ejemplo', exact: true }).click();
    await analizar(page);
  }
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert.equal(await boton.evaluate(element => element === document.activeElement), true);
  await page.close();
});
test('reflow a 320 px y espaciado de texto ampliado conserva formularios', async () => {
  for (const vista of ['acceso', 'examen', 'admin']) {
    const page = await abrir(vista, 320);
    await page.setViewportSize({ width: 320, height: 256 });
    await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
    await analizar(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Reflow en ${vista}`);
    if (vista === 'admin') {
      await page.getByRole('button', { name: 'Crear examen', exact: true }).scrollIntoViewIfNeeded();
      assert.equal(await page.getByRole('button', { name: 'Crear examen', exact: true }).isVisible(), true);
    }
    await page.close();
  }
});
test('el reproductor incorpora un track WebVTT en español', async () => {
  const page = await abrir('subtitulos');
  await page.waitForFunction(() => document.querySelector('track')?.src.startsWith('blob:'));
  assert.equal(await page.locator('track').getAttribute('kind'), 'captions');
  assert.equal(await page.locator('track').getAttribute('srclang'), 'es');
  await page.close();
});
