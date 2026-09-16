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

import { COSTAS as MUNDO } from '../datos/mundo.js?v=cfb77c51';
import { COSTAS as JAPON } from '../datos/japon.js?v=cfb77c51';
import { COSTAS as KANTO } from '../datos/kanto.js?v=cfb77c51';
import { CALLES } from '../datos/calles.js?v=cfb77c51';
import { AUTOPISTAS } from '../datos/autopistas.js?v=cfb77c51';
import { aVectores, envolvente, asomaEnPantalla, trazar, radioActual } from './proyeccion.js?v=cfb77c51';
import { tope, tramo } from './util.js?v=cfb77c51';

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

/* 🚨 DÓNDE SE APAGA LA COSTA — y por qué aguanta más que antes.
   Estaba en 8.000-26.000 y Kiko lo vio el 17 de septiembre: «el contorno
   desaparece muy rápido y se queda ahí como en la nada». Tenía razón: la costa
   moría de golpe a mitad del zoom y dejaba la pantalla vacía, en vez de irse
   saliendo del encuadre por su propio pie, que es lo natural.

   El límite real sigue existiendo —el dataset de Kantō está simplificado a
   0,002°, unos 220 m, así que pasado cierto zoom deja de ser información y pasa
   a ser un polígono tosco—, pero a 18.000 todavía da un píxel por segmento y a
   55.000 la bahía de Tokio ya ha salido del encuadre sola. Entre medias, el
   callejero de aquí abajo va entrando y coge el relevo: el mapa nunca se queda
   sin nada que enseñar. */
const R_DESVANECE = 18000;
const R_INVISIBLE = 75000;

/* --------------------------------------------------------------------------
   El callejero · «para ver por dónde vamos»
   --------------------------------------------------------------------------
   Lo pidió Kiko el 17 de septiembre, viendo el acto 3. Entra cuando la costa
   empieza a irse y se queda hasta el final del zoom.

   📄 Son datos de OpenStreetMap bajo ODbL, que OBLIGA A ATRIBUIR — al revés que
   las costas, que son de Natural Earth y de dominio público. La atribución está
   en la cabecera de datos/calles.js y en el pie de index.html, y de ahí no se
   quita. Ver herramientas/generar-calles.js.
   -------------------------------------------------------------------------- */
const CALLEJERO = preparar(CALLES);

/* Aparece a la vez que la costa se retira, para que haya relevo y no hueco */
/* 🚨 ESTOS DOS NÚMEROS SALEN DE LA CAJA DEL DATASET, no del gusto.
   En un móvil vertical la pantalla es 2,16 veces más alta que ancha, así que a
   un encuadre de F grados de ancho le caben F×2,16 grados de latitud. La caja
   de calles mide 0,16° de alto, o sea que las calles solo llegan de borde a
   borde a partir de R ~ 200.000. Antes de eso, encenderlas enseña un RECORTE
   RECTANGULAR flotando en el blanco, con sus cuatro bordes a la vista: se vio
   en la captura del zoom.
   Por eso entran tarde, a la vez que el encuadre se cierra sobre Shinjuku. */
const R_CALLES_ENTRA = 100000;
const R_CALLES_LLENA = 220000;

export function opacidadCalles(radio) {
  const r = radio === undefined ? radioActual() : radio;
  return tope((r - R_CALLES_ENTRA) / (R_CALLES_LLENA - R_CALLES_ENTRA));
}

/* --------------------------------------------------------------------------
   Las autopistas · el relevo entre la costa y el callejero
   --------------------------------------------------------------------------
   🚨 EXISTEN PARA QUE EL MAPA NO SE QUEDE EN BLANCO. Kiko, el 17 de
   septiembre: «las calles deberían aparecer antes para que no se quede tanto
   tiempo en blanco el mapa». Tenía razón, pero el callejero no podía adelantarse
   sin enseñar los bordes de su caja: es pequeña, y a esos zooms no llena la
   pantalla.

   La solución no es adelantar el callejero, es meter algo entre medias. La red
   de autopistas tiene una caja mucho más grande —1,75° de alto— así que llena
   la pantalla justo en el tramo en que la costa ya se ha ido y el callejero
   todavía no ha llegado. El mapa pasa de costa a autopistas a calles sin un
   solo hueco.
   -------------------------------------------------------------------------- */
const RED = preparar(AUTOPISTAS);

const R_AUTOPISTAS = [12000, 20000, 120000, 260000];   /* entra, llena, aguanta, se va */

export function opacidadAutopistas(radio) {
  const r = radio === undefined ? radioActual() : radio;
  const entra = tope((r - R_AUTOPISTAS[0]) / (R_AUTOPISTAS[1] - R_AUTOPISTAS[0]));
  const sale = tope((r - R_AUTOPISTAS[2]) / (R_AUTOPISTAS[3] - R_AUTOPISTAS[2]));
  return entra * (1 - sale);
}

export function dibujarAutopistas() {
  if (opacidadAutopistas() <= 0.001) return '';
  let d = '';
  for (const c of RED) {
    if (!asomaEnPantalla(c.env)) continue;
    d += trazar(c.v);
  }
  return d;
}

export function dibujarCalles() {
  if (opacidadCalles() <= 0.001) return '';
  let d = '';
  for (const c of CALLEJERO) {
    if (!asomaEnPantalla(c.env)) continue;      /* el tramo entero, de un vistazo */
    d += trazar(c.v);
  }
  return d;
}

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
