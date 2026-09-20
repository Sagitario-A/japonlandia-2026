/* =============================================================================
   motor/proyeccion.js · La cámara
   -----------------------------------------------------------------------------
   Proyección ortográfica de la esfera, que es lo que hace posible toda la
   película: **el zoom es un número**.

   Cada punto del mundo se convierte UNA SOLA VEZ en un vector unitario. Girar
   el planeta es entonces multiplicar y sumar —ni un seno ni un coseno por punto
   y por fotograma— y acercarse es subir el radio `R`. Del globo entero al mapa
   de Japón, de ahí a Kantō y de ahí a un portal de Setagaya es el MISMO código
   con `R` distinto, y por eso puede ir atado al scroll sin cortes.

       R ≈ 130        el globo llenando la pantalla
       R ≈ 750        Japón
       R ≈ 5.000      Kantō
       R ≈ 19.000     Narita → Meidaimae

   Ver NORMAS § 9.
   ============================================================================= */

import { RAD, mezcla, mezclaEscala, r1 } from './util.js?v=822ac628';

/* 🚨 EL VIEWBOX NO ES CUADRADO, y hay una razón.
   --------------------------------------------------------------------------
   Con un viewBox de 260×260 y `meet`, en un móvil de 390×844 el mapa solo usa
   el cuadrado central: media pantalla en blanco y el mapa diminuto. Se vio en
   la primera captura de Japón.

   Ahora el lado CORTO de la pantalla siempre vale 260 unidades (de -130 a 130)
   y el largo se estira. Así el globo cabe entero en cualquier proporción —el
   lado corto manda— y en vertical se gana toda la pantalla.

   `MITAD` es, por tanto, el radio del lado corto, y `encuadrar(grados)` habla
   de grados a lo ancho del LADO CORTO. En un móvil eso es el ancho, que es lo
   que uno tiene en la cabeza al encuadrar. */
export const MITAD = 130;

/* Hasta dónde se dibuja, con margen: los trazos tienen grosor y las etiquetas
   sobresalen. Se recalculan al cambiar el tamaño de la ventana. */
let limiteX = MITAD * 1.12;
let limiteY = MITAD * 1.12;

/** Ajusta el encuadre al tamaño real de la ventana.
 *  Devuelve el viewBox que hay que poner en el `<svg>`. */
export function ajustarViewport(ancho, alto) {
  const corto = Math.min(ancho, alto) || 1;
  const mx = MITAD * (ancho / corto);
  const my = MITAD * (alto / corto);
  limiteX = mx * 1.12;
  limiteY = my * 1.12;
  return (-mx) + ' ' + (-my) + ' ' + (mx * 2) + ' ' + (my * 2);
}

/* --------------------------------------------------------------------------
   1 · Estado de la cámara
   -------------------------------------------------------------------------- */
let cosL = 1, sinL = 0, cosF = 1, sinF = 0;
let radio = 100;
let lonVista = 0, latVista = 0;

/* El propio centro de la cámara como vector unitario. Se guarda en vez de
   recalcularlo: `asomaEnPantalla` se llama una vez por contorno y por
   fotograma, y eran cuatro funciones trigonométricas cada vez para nada. */
let ojoX = 1, ojoY = 0, ojoZ = 0;

/* Dónde cayó el último punto proyectado. Son exports vivos: quien los importa
   lee siempre el valor actual, sin pagar un objeto por punto. */
export let px = 0;
export let py = 0;

/** Apunta la cámara. `radioNuevo` es opcional: sin él se conserva el zoom. */
export function mirarA(lon0, lat0, radioNuevo) {
  lonVista = lon0;
  latVista = lat0;
  cosL = Math.cos(lon0 * RAD); sinL = Math.sin(lon0 * RAD);
  cosF = Math.cos(lat0 * RAD); sinF = Math.sin(lat0 * RAD);
  ojoX = cosF * cosL; ojoY = cosF * sinL; ojoZ = sinF;
  if (radioNuevo !== undefined) radio = radioNuevo;
}

export function radioActual() { return radio; }
export function centroActual() { return [lonVista, latVista]; }

/**
 * Qué radio hace falta para que el ancho de la pantalla sean `grados`.
 *
 * El ancho visible es un arco, no una recta, así que la cuenta lleva un seno:
 * MITAD / R = sen(grados/2). Con la aproximación de ángulos pequeños cuadra
 * igual de cerca, pero de lejos —Japón entero, el hemisferio— se iría bastante.
 */
export function encuadrar(grados) {
  const s = Math.sin(Math.min(180, grados) / 2 * RAD);
  return MITAD / Math.max(s, 1e-6);
}

/** Lo contrario: cuántos grados de ancho se están viendo ahora mismo. */
export function gradosVisibles(radioDado) {
  const rr = radioDado === undefined ? radio : radioDado;
  return 2 * Math.asin(Math.min(1, MITAD / rr)) / RAD;
}

/**
 * Mueve la cámara de un encuadre a otro según `p` (0 → 1).
 * Un encuadre es `[lon, lat, radio]`.
 *
 * El centro va por el camino corto —se corrige el salto del antimeridiano— y
 * el zoom va en logarítmico (ver `mezclaEscala`).
 */
export function viajarDeVista(desde, hasta, p) {
  let dLon = hasta[0] - desde[0];
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  mirarA(
    desde[0] + dLon * p,
    mezcla(desde[1], hasta[1], p),
    mezclaEscala(desde[2], hasta[2], p)
  );
}

/* --------------------------------------------------------------------------
   2 · Proyectar
   -------------------------------------------------------------------------- */

/**
 * Proyecta un vector unitario ya girado. Deja el resultado en `px`/`py`.
 * Devuelve false si el punto cae en la cara oculta del planeta, que es lo que
 * hace que el otro lado desaparezca solo sin tener que recortar nada.
 */
export function proyectar(x, y, z) {
  const x1 = x * cosL + y * sinL;
  const y1 = y * cosL - x * sinL;
  const x2 = x1 * cosF + z * sinF;
  if (x2 <= 0) { return false; }          /* está al otro lado */
  px = radio * y1;
  py = -radio * (z * cosF - x1 * sinF);
  return true;
}

/** Proyecta un par lon/lat suelto, sin pasar por vectores. Para marcadores. */
export function proyectarGrados(lon, lat) {
  const la = lon * RAD, fa = lat * RAD, cl = Math.cos(fa);
  return proyectar(cl * Math.cos(la), cl * Math.sin(la), Math.sin(fa));
}

/* --------------------------------------------------------------------------
   3 · De grados a vectores
   -------------------------------------------------------------------------- */

/**
 * Convierte una lista plana de `lon, lat, lon, lat…` en vectores unitarios.
 * 🚨 Esto se hace UNA VEZ, al cargar. Es la razón de que el globo gire suave.
 */
export function aVectores(pares) {
  const n = pares.length / 2;
  const v = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) {
    const lon = pares[i * 2] * RAD, lat = pares[i * 2 + 1] * RAD;
    const cl = Math.cos(lat);
    v[i * 3] = cl * Math.cos(lon);
    v[i * 3 + 1] = cl * Math.sin(lon);
    v[i * 3 + 2] = Math.sin(lat);
  }
  return v;
}

/** El centro y el radio angular de un grupo de vectores, para poder descartarlo
 *  entero de un vistazo en vez de punto a punto. */
export function envolvente(v) {
  let cx = 0, cy = 0, cz = 0;
  const n = v.length / 3;
  for (let i = 0; i < v.length; i += 3) { cx += v[i]; cy += v[i + 1]; cz += v[i + 2]; }
  const m = Math.hypot(cx, cy, cz) || 1;
  cx /= m; cy /= m; cz /= m;
  let peor = 2;                               /* un coseno nunca pasa de 1 */
  for (let i = 0; i < v.length; i += 3) {
    const d = cx * v[i] + cy * v[i + 1] + cz * v[i + 2];
    if (d < peor) peor = d;
  }
  return { x: cx, y: cy, z: cz, radio: Math.acos(Math.max(-1, Math.min(1, peor))), n };
}

/**
 * ¿Merece la pena mirar este grupo? Compara la distancia angular del centro de
 * la cámara al centro del grupo contra la suma de los dos radios.
 * Es conservador: puede decir que sí de más, nunca que no de menos.
 */
export function asomaEnPantalla(env) {
  const cosD = env.x * ojoX + env.y * ojoY + env.z * ojoZ;
  const d = Math.acos(Math.max(-1, Math.min(1, cosD)));
  /* Radio angular de la pantalla, por la diagonal, con un margen holgado */
  const diagonal = Math.hypot(limiteX, limiteY);
  const media = Math.asin(Math.min(1, diagonal / radio));
  return d < env.radio + media;
}

/* --------------------------------------------------------------------------
   4 · Trazar
   -------------------------------------------------------------------------- */

/** ¿La caja de este segmento toca la pantalla? Barato y sin falsos negativos. */
function segmentoAsoma(x1, y1, x2, y2) {
  if (x1 > limiteX && x2 > limiteX) return false;
  if (x1 < -limiteX && x2 < -limiteX) return false;
  if (y1 > limiteY && y2 > limiteY) return false;
  if (y1 < -limiteY && y2 < -limiteY) return false;
  return true;
}

/**
 * Convierte vectores en un `d` de SVG.
 *
 * Va SEGMENTO a segmento, no punto a punto, por dos razones que costaron
 * encontrar:
 *
 *  1. 🚨 Descartar puntos sueltos por estar fuera de pantalla borra segmentos
 *     largos que la cruzan de lado a lado. Mirando el segmento entero no pasa.
 *  2. 🚨 Si dos puntos seguidos caen lejísimos, el contorno está dando la vuelta
 *     por el antimeridiano y unirlos dibuja una raya recta atravesando el mapa.
 *     El corte es relativo al radio, porque lo que a escala de globo es medio
 *     planeta, a escala de ciudad son cuatro manzanas.
 *
 * `hasta` limita cuántos puntos se dibujan, que es como una ruta se va trazando
 * poco a poco.
 */
export function trazar(v, hasta) {
  const fin = hasta === undefined ? v.length : Math.min(hasta, v.length);
  const salto2 = radio * radio;          /* medio planeta, a la escala de ahora */
  let d = '';
  let abierto = false;
  let ax = 0, ay = 0, aOk = false;

  for (let i = 0; i < fin; i += 3) {
    const ok = proyectar(v[i], v[i + 1], v[i + 2]);
    const x = px, y = py;

    if (ok && aOk) {
      const dx = x - ax, dy = y - ay;
      if (dx * dx + dy * dy <= salto2 && segmentoAsoma(ax, ay, x, y)) {
        if (!abierto) { d += 'M' + r1(ax) + ' ' + r1(ay); abierto = true; }
        d += 'L' + r1(x) + ' ' + r1(y);
      } else {
        abierto = false;
      }
    } else {
      abierto = false;
    }

    ax = x; ay = y; aOk = ok;
  }
  return d;
}
