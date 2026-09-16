/* =============================================================================
   motor/mapa.js · Las costas, la retícula y el nivel de detalle
   -----------------------------------------------------------------------------
   El zoom de la película va del globo entero a una manzana de Setagaya, y
   ningún dataset sirve para las dos cosas: el del mundo es tosco de cerca y el
   de Kantō no existe de lejos. Aquí se elige cuál toca y se funde de uno a otro
   para que el cambio no se vea.

   🚨 EL TECHO, medido el 16 de septiembre de 2026: Natural Earth 10m tiene solo
   ~390 puntos en toda la caja de Kantō. Pasado R ≈ 8.000 la costa deja de ser
   información y pasa a ser un polígono tosco, así que **se desvanece** en vez de
   dibujarse. Un mapa que miente de cerca es peor que un mapa que se aparta.
   Ver herramientas/generar-costas.js.
   ============================================================================= */

import { COSTAS as MUNDO } from '../datos/mundo.js?v=c94af970';
import { COSTAS as JAPON } from '../datos/japon.js?v=c94af970';
import { COSTAS as KANTO } from '../datos/kanto.js?v=c94af970';
import { aVectores, envolvente, asomaEnPantalla, trazar, radioActual } from './proyeccion.js?v=c94af970';
import { tope, tramo } from './util.js?v=c94af970';

/* --------------------------------------------------------------------------
   1 · Preparar los datasets
   --------------------------------------------------------------------------
   Cada contorno viene como [minLon, minLat, maxLon, maxLat, lon, lat, lon, lat…].
   La caja se usa aquí solo para saber que existe; lo que de verdad descarta
   islas es la envolvente esférica, que sí sabe de la curvatura.
   -------------------------------------------------------------------------- */
function preparar(costas) {
  return costas.map((c) => {
    const v = aVectores(c.slice(4));
    return { v, env: envolvente(v) };
  });
}

/* 🚨 LAS FRANJAS SE CALCULAN DESDE LOS ENCUADRES REALES, no a ojo.
   La primera versión ponía `japon` a partir de R=620, y el encuadre de Japón
   cae en R=578: el mapa de Japón se dibujaba con el dataset del MUNDO, a 28 km
   por punto, y salía un polígono tosco. Se vio en la primera captura.

     Japón   26°   → R ≈ 580
     Kantō    3,4° → R ≈ 4.380
     la ruta  1,15°→ R ≈ 12.950

   Las franjas los envuelven con holgura y se solapan para fundir. */
/* 🚨 DONDE SE CONMUTA LO DECIDE LA CAJA DEL DATASET, no el gusto.
   Un dataset solo puede entrar cuando su caja cubre TODO lo que se ve, o al
   conmutar desaparece de golpe lo que queda fuera y el mapa se corta. Paso el
   16 de septiembre: Corea, China y Rusia se esfumaban a mitad del zoom.

   En un movil el viewBox es alto, asi que manda la LATITUD:
       mitad vertical visible = asin(281 / R)

     japon  cubre lat -2..76 (±39 desde 37)  →  asin(281/R) ≤ 39°  →  R ≥ 447
     kanto  cubre lat 27..43 (±8 desde 35)   →  asin(281/R) ≤ 8°   →  R ≥ 2019

   De ahi salen los dos numeros de abajo, con un pelo de margen. */
const NIVELES = [
  { nombre: 'mundo', contornos: preparar(MUNDO), hasta: 460 },
  { nombre: 'japon', contornos: preparar(JAPON), hasta: 2100 },
  { nombre: 'kanto', contornos: preparar(KANTO), hasta: Infinity }
];

/* Dónde empieza a apagarse la costa porque la fuente ya no da más de sí */
const R_DESVANECE = 8000;
const R_INVISIBLE = 26000;

/**
 * Qué dataset toca. UNO solo: las franjas NO se solapan.
 *
 * 🚨 La primera versión los fundía, dibujando dos a media opacidad en la
 * transición. En pantalla salía un DOBLE CONTORNO FANTASMA: el mundo a 28 km
 * por punto y Japón a 3,9 km no describen la misma costa, así que fundirlos no
 * disimula el cambio, lo duplica.
 *
 * Con conmutación seca el cambio ocurre en un solo fotograma y siempre en
 * mitad de un zoom, que es cuando el mapa se está moviendo y nadie lo nota.
 */
function nivelDe(radio) {
  for (const nivel of NIVELES) if (radio < nivel.hasta) return nivel;
  return NIVELES[NIVELES.length - 1];
}

/**
 * Lo que se ve de la costa en total, por el límite de la fuente.
 * Se exporta para que el acto pueda apagar también lo que cuelgue de ella.
 */
export function opacidadCosta(radio) {
  const r = radio === undefined ? radioActual() : radio;
  return 1 - tope((r - R_DESVANECE) / (R_INVISIBLE - R_DESVANECE));
}

/* --------------------------------------------------------------------------
   2 · Dibujar
   -------------------------------------------------------------------------- */

/**
 * Devuelve `[{ d, opacidad }]`, una entrada por nivel que aporte algo.
 * El acto decide en qué `<path>` los mete.
 *
 * 🚨 Las costas se trazan SIN CERRAR y sin relleno. Cerrar un contorno recortado
 * por el borde del globo dibuja una cuerda recta que lo atraviesa. Se vio en
 * pantalla y por eso está escrito aquí y en NORMAS § 9.
 */
export function dibujarCostas() {
  const radio = radioActual();
  const global = opacidadCosta(radio);
  if (global <= 0.001) return [];

  const nivel = nivelDe(radio);
  let d = '';
  for (const c of nivel.contornos) {
    if (!asomaEnPantalla(c.env)) continue;        /* la isla entera, de un vistazo */
    d += trazar(c.v);
  }
  return d ? [{ d, opacidad: global }] : [];
}

/* --------------------------------------------------------------------------
   3 · La retícula del globo
   --------------------------------------------------------------------------
   Meridianos y paralelos cada 30°. Solo tiene sentido cuando se ve el planeta
   como planeta: en cuanto es un mapa estorba, así que se apaga sola.

   🚨 Los meridianos llegan hasta ±70° y no al polo: si convergen todos en un
   punto sale un destello feo. También se vio en pantalla.
   -------------------------------------------------------------------------- */
const RETICULA = (function () {
  const lineas = [];
  for (let lon = -180; lon < 180; lon += 30) {
    const p = [];
    for (let lat = -70; lat <= 70; lat += 10) p.push(lon, lat);
    lineas.push(aVectores(p));
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const p = [];
    for (let lon = -180; lon <= 180; lon += 10) p.push(lon, lat);
    lineas.push(aVectores(p));
  }
  return lineas;
})();

export function opacidadReticula(radio) {
  const r = radio === undefined ? radioActual() : radio;
  return 1 - tope((r - 150) / 320);
}

export function dibujarReticula() {
  if (opacidadReticula() <= 0.001) return '';
  let d = '';
  for (const linea of RETICULA) d += trazar(linea);
  return d;
}
